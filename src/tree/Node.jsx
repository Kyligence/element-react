/* @flow */

import React, { isValidElement } from 'react';
import { debounce } from 'throttle-debounce';

import { PropTypes, Component, CollapseTransition, LazyList } from '../../libs';
import { watchPropertyChange, IDGenerator } from '../../libs/utils';
import Checkbox from '../checkbox';
import { default as TreeNode } from './model/node';


function NodeContent({context, renderContent}) {
  const {nodeModel, treeNode} = context.props;

  if (typeof renderContent === 'function') {
    return renderContent(nodeModel, nodeModel.data, treeNode.store);
  } else {
    return <span className="el-tree-node__label">{nodeModel.label}</span>;
  }
}

NodeContent.propTypes = {
  renderContent: PropTypes.func,
  context: PropTypes.object.isRequired
};

type State = {
  childNodeRendered: boolean,
  isShowCheckbox: boolean
};

export default class Node extends Component {
  state: State;

  $list: { current: null | Component } = React.createRef();

  constructor(props: Object) {
    super(props);

    this.state = {
      childNodeRendered: false,
      isShowCheckbox: false
    };
    this.state.isShowCheckbox = props.treeNode.isShowCheckbox;

    this.oldChecked = false;
    this.oldIndeterminate = false;
    this.idGen = new IDGenerator();
    this.handleClickNode = this.handleClick.bind(this);
  }

  componentDidMount(): void {
    const nodeModel = this.props.nodeModel;
    const childrenKey = this.props.options.children || 'children';

    const triggerChange = debounce(20, (...args) => {
      if (this.isDeconstructed) return;
      this.handleSelectChange.apply(this, args);
    });

    this.loadHandler = this.enhanceLoad(nodeModel);
    this.watchers = {
      [this.idGen.next()]: watchPropertyChange(
        nodeModel,
        'indeterminate',
        value => {
          triggerChange(nodeModel.checked, value);
        }
      ),
      [this.idGen.next()]: watchPropertyChange(nodeModel, 'checked', value => {
        triggerChange(value, nodeModel.indeterminate);
      }),
      [this.idGen.next()]: watchPropertyChange(nodeModel, 'loading', () => {
        this.refresh();
      })
    };

    if (nodeModel.data != null) {
      this.watchers[
        this.idGen.next()
      ] = watchPropertyChange(nodeModel.data, childrenKey, () => {
        nodeModel.updateChildren();
        this.refresh(); //force update view
      });
    }
    nodeModel.$el = this;
    nodeModel.setLazyListUpdate(this.refreshLazyList);
  }

  componentWillUnmount(): void {
    this.loadHandler();
    // clear watchs
    for (let w in this.watchers) {
      if (this.watchers[w]) {
        this.watchers[w]();
      }
    }
    this.isDeconstructed = true;
  }

  componentDidUpdate() {
    // 由于树的节点DOM有复用，导致top属性发生变化，导致有300ms的动画效果
    // 动画开始执行的一瞬间，可能节点还在列表外，但动画执行完有可能在列表内
    // 所以在更新完成之后300毫秒内(动画结束后)，需要重计算一下懒加载列表，才能正确判断是否展示
    this.refreshLazyList();
  }

  enhanceLoad(nodeModel: Object): Function {
    const load = nodeModel.load;
    const enhanced = (...args) => {
      load.apply(null, args);
      this.refresh();
    };
    nodeModel.load = enhanced;
    return () => {
      nodeModel.load = load;
    };
  }

  handleSelectChange(checked: boolean, indeterminate: boolean): void {
    const { onCheckChange, nodeModel } = this.props;

    // !NOTE: 原码是 && 的关系，感觉有bug
    if (
      this.oldChecked !== checked || this.oldIndeterminate !== indeterminate
    ) {
      onCheckChange(nodeModel.data, checked, indeterminate);
      this.refresh(); //force update
    }

    this.oldChecked = checked;
    this.oldIndeterminate = indeterminate;
  }

  getNodeKey(node: any, otherwise: number) {
    const nodeKey = this.props.nodeKey;
    if (nodeKey && node) {
      return node.data[nodeKey];
    }
    return otherwise;
  }


  handleClick(evt: ?SyntheticEvent<any>, isExpandNode: boolean = true): void {
    if (evt) evt.stopPropagation();
    const { nodeModel, treeNode } = this.props;

    treeNode.setCurrentNode(this);
    if (treeNode.props.expandOnClickNode && isExpandNode){
      this.handleExpandIconClick()
    }
  }

  handleExpandIconClick = (evt: ?SyntheticEvent<any>) => {
    if (evt) evt.stopPropagation();

    const { nodeModel, parent } = this.props;
    const {onNodeCollapse, onNodeExpand} = this.props.treeNode.props;

    if (nodeModel.isLeaf) return;

    if (nodeModel.expanded) {
      nodeModel.collapse()
      this.refresh()
      onNodeCollapse(nodeModel.data, nodeModel, this)
    } else {
      nodeModel.expand(() => {
        this.setState({childNodeRendered: true }, () => {
          onNodeExpand(nodeModel.data, nodeModel, this)
        });
        parent.closeSiblings(nodeModel)
      });
    }
    // 在触发折叠展开事件之后，需要正确重算前端懒加载计算
    const { root } = this.props;
    if (root.props.isLazy) {
      root.refreshAllNodeLazyList();
    }
  }

  closeSiblings(exclude: any){
    const {treeNode, nodeModel} = this.props;
    if (!treeNode.props.accordion) return;
    if (nodeModel.isLeaf || !nodeModel.childNodes || !nodeModel.childNodes.length) return;

    nodeModel.childNodes.filter(e=> e !== exclude).forEach(e=>e.collapse());
    this.refresh();
  }

  refresh(){
    this.setState({});
  }

  refreshLazyList = () => {
    const { root } = this.props;
    if (root.props.isLazy) {
      setTimeout(() => {
        if (this.$list.current) {
          this.$list.current.forceUpdate();
        }
      }, 300);
    }
  }

  handleUserClick = (event: SyntheticEvent<any>) => {
    event.preventDefault();
    event.stopPropagation();

    let {nodeModel, checkStrictly} = this.props.treeNode;
    if (nodeModel.indeterminate) {
      nodeModel.setChecked(nodeModel.checked, !checkStrictly);
    }
  }

  handleCheckChange = (checked: boolean) => {
    const { nodeModel } = this.props;
    nodeModel.setChecked(checked, true);
  }

  // 前端懒加载：计算当前节点和子孙节点的总高度
  getLazyItemSize = (child: TreeNode | any): number => {
    let size = 0;
    let node = child;

    if (isValidElement(child)) {
      node = child.props.nodeModel
    }
    if (node.visible) {
      size = 36;
      if (node.expanded) {
        for (const childNode of node.childNodes) {
          size += this.getLazyItemSize(childNode);
        }
      }
    }
    return size;
  }

  renderNodes = (childNodes: Array<TreeNode>): React.DOM => {
    const { root } = this.props;
    return childNodes.filter(nodeData => nodeData.visible).map((e, idx) => {
      let props = Object.assign({}, this.props, { nodeModel: e, parent: this });
      return <Node {...props} key={this.getNodeKey(e, idx)} root={root} />;
    });
  };

  // children渲染分为 普通渲染 和 前端懒加载渲染
  renderChildrens = (childNodes: Array<TreeNode>): React.DOM => {
    const { root } = this.props;
    return root.props.isLazy
      ? (
        <LazyList ref={this.$list} renderItemSize={child => this.getLazyItemSize(child)} delayMs={300}>
          {this.renderNodes(childNodes)}
        </LazyList>
      )
      : this.renderNodes(childNodes);
  };

  render(): React.DOM {
    const { childNodeRendered } = this.state;
    const { treeNode, nodeModel, isShowCheckbox, root } = this.props;
    const { childNodes, expanded } = nodeModel;

    return (
      <div
        onClick={this.handleClickNode}
        className={this.classNames('el-tree-node', {
          expanded: childNodeRendered && expanded,
          'is-current': treeNode.getCurrentNode() === this,
          'is-hidden': !nodeModel.visible
        })}
        style={{display: nodeModel.visible ? '': 'none', ...this.style()}}
      >
        <div
          className="el-tree-node__content"
          style={{ paddingLeft: `${(nodeModel.level - 1) * treeNode.props.indent}px` }}
        >
          <span
            className={this.classNames('el-tree-node__expand-icon', {
              'is-leaf': nodeModel.isLeaf,
              expanded: !nodeModel.isLeaf && expanded
            })}
            onClick={this.handleExpandIconClick}
          />
          {isShowCheckbox && (
            <Checkbox
              checked={nodeModel.checked}
              onChange={this.handleCheckChange}
              indeterminate={nodeModel.indeterminate}
              onClick={this.handleUserClick}
            />
          )}
          {nodeModel.loading &&
            <span className="el-tree-node__loading-icon el-icon-loading"> </span>}
          <NodeContent
            nodeModel={nodeModel}
            renderContent={treeNode.props.renderContent}
            context={this}
          />
        </div>
        <CollapseTransition destroyable={root.props.isLazy} isShow={expanded} ref="collapse">
          <div className="el-tree-node__children">
            {this.renderChildrens(childNodes)}
          </div>
        </CollapseTransition>
      </div>
    );
  }
}

Node.propTypes = {
  nodeModel: PropTypes.object,
  options: PropTypes.object,
  treeNode: PropTypes.object.isRequired,
  isShowCheckbox: PropTypes.bool,
  onCheckChange: PropTypes.func,
  root: PropTypes.object.isRequired,
};

Node.defaultProps = {
  nodeModel: {},
  options: {},
  onCheckChange() {},
};
