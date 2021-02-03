/* @flow */

import React from 'react';
import { PropTypes, Component, LazyList } from '../../libs';
import { require_condition } from '../../libs/utils';
import Node from './Node';
import Locale from '../locale';
import TreeStore from './model/tree-store';
import { default as TreeNode } from './model/node';

type State = {
  currentNode: ?Object,
  store: any,
};

export default class Tree extends Component {
  state: State;

  $list: { current: null | Component } = React.createRef();

  constructor(props: Object) {
    super(props);
    const {
      data, lazy, options, load, defaultCheckedKeys, defaultExpandedKeys, currentNodeKey, nodeKey,
      checkStrictly, autoExpandParent, defaultExpandAll, filterNodeMethod, shouldNodeRender,
      hideArrowWhenNoLeaves,
    } = this.props;
    this.state = {
      store: new TreeStore({
        key: nodeKey, data, lazy, props: options, load, currentNodeKey, checkStrictly,
        defaultCheckedKeys, defaultExpandedKeys, autoExpandParent, defaultExpandAll, filterNodeMethod,
        shouldNodeRender, hideArrowWhenNoLeaves,
      }),
      currentNode: null
    };
  }

  componentWillReceiveProps(nextProps: Object): void {
    if (nextProps.data instanceof Array && this.props.data !== nextProps.data) {
      this.root.setData(nextProps.data);
      this.store.filter(undefined, true, false);
      this.setState({}); //force update
    }

    if (
      nextProps.shouldNodeRender !== this.props.shouldNodeRender ||
      nextProps.hideArrowWhenNoLeaves !== this.props.hideArrowWhenNoLeaves
    ) {
      this.store.filter(undefined, true, false);
      this.refresh();
    }
  }

  componentDidMount() {
    this.store.filter(undefined, true, false);
    this.refresh();
  }

  get root(): any{
    return this.state.store.root;
  }

  get store(): any {
    return this.state.store
  }


  filter(value: any, isEnableByChildren?: boolean, isEnableExpand?: boolean) {
    this.store.filter(value, isEnableByChildren, isEnableExpand);
    this.refresh();
  }

  refresh(){
    this.setState({});
  }

  // 前端懒加载：LazyList顶层刷新API
  // 理由：因为LazyList是PureComponent，所以在折叠的时候无法触发子孙节点的LazyList刷新
  // 所以挂载全局API来触发懒加载重算
  refreshAllNodeLazyList = () => {
    const { isLazy } = this.props;
    if (isLazy) {
      Object.values(this.store.nodesMap).forEach((node: TreeNode) => {
        node.lazyListUpdate();
      });
    }
  }

  getNodeKey(node: any, otherwise: number) {
    const nodeKey = this.props.nodeKey;
    if (nodeKey && node) {
      return node.data[nodeKey];
    }
    return otherwise;
  }

  getCheckedNodes(leafOnly: boolean): void {
    return this.store.getCheckedNodes(leafOnly);
  }

  getCheckedKeys(leafOnly: boolean) {
    return this.store.getCheckedKeys(leafOnly);
  }

  setCheckedNodes(nodes: any, leafOnly: boolean) {
    if (!this.props.nodeKey) throw new Error('[Tree] nodeKey is required in setCheckedNodes');
    this.store.setCheckedNodes(nodes, leafOnly);
  }

  setCheckedKeys(keys: any, leafOnly: boolean) {
    if (!this.props.nodeKey) throw new Error('[Tree] nodeKey is required in setCheckedNodes');
    this.store.setCheckedKeys(keys, leafOnly);
  }

  setChecked(data: any, checked: boolean, deep: boolean) {
    this.store.setChecked(data, checked, deep);
  }

  setCurrentNodeKey(key: string): void {
    const nodeData: any = Object.values(this.store.nodesMap)
      .find((node, idx) => this.getNodeKey(node, idx) === key) || {};
    const nodeEl = nodeData.$el;

    if (nodeEl) {
      nodeEl.handleClickNode(null, false);
    }
  }

  clearCurrentNodeKey(): void {
    this.store.setCurrentNode(null);
    this.setState({ currentNode: null });
  }

  // used by child nodes, use tree store to store this info?
  getCurrentNode(): ?Object {
    return this.state.currentNode;
  }

  setCurrentNode(node: Object): void {
    require_condition(node != null);

    let {onCurrentChange, onNodeClicked} = this.props;
    this.store.setCurrentNode(node);
    this.setState({
      currentNode: node
    }, ()=>{
      let nodeModel = node.props.nodeModel;
      onCurrentChange(nodeModel.data, node)
      onNodeClicked(nodeModel.data, node)
    });
  }

  closeSiblings(exclude: any){
    const {accordion} = this.props;
    if (!accordion) return;
    if (!this.root.childNodes || !this.root.childNodes.length) return;

    this.root.childNodes.filter(e=> e !== exclude).forEach(e=>e.collapse());
    this.refresh();
  }

  // 前端懒加载：计算当前节点和子孙节点的总高度
  getLazyItemSize = (node: TreeNode): number => {
    let size = 0;
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

  getNodePosition(key: string): number {
    return this.store.getNodePosition(key);
  }

  renderNodes = () => {
    const {
      options,
      renderContent,
      isShowCheckbox,
      onCheckChange,
    } = this.props;

    return this.root.childNodes.map((e, idx) => (
      <Node
        ref="cnode"
        key={this.getNodeKey(e,idx)}
        nodeModel={e}
        options={options}
        renderContent={renderContent}
        treeNode={this}
        parent={this}
        root={this}
        isShowCheckbox={isShowCheckbox}
        onCheckChange={onCheckChange}
      />
    ))
  }

  // children渲染分为 普通渲染 和 前端懒加载渲染
  renderChildrens = (): React.DOM => {
    const { isLazy } = this.props;
    return isLazy
      ? (
        <LazyList ref={this.$list} renderItemSize={(child, idx) => this.getLazyItemSize(this.root.childNodes[idx])} delayMs={300}>
          {this.renderNodes()}
        </LazyList>
      )
      : this.renderNodes();
  };

  renderEmptyText = (emptyText: string): React.DOM => (
    <div className="el-tree__empty-block">
      <span className="el-tree__empty-text">{emptyText}</span>
    </div>
  );

  renderEmpty = (): React.DOM => {
    const { emptyText, renderEmpty } = this.props;
    const { renderEmptyText } = this;

    switch (typeof renderEmpty) {
      case 'function':
        return renderEmpty();
      case 'object':
        return React.isValidElement(renderEmpty)
          ? renderEmpty
          : renderEmptyText(JSON.stringify(renderEmpty));
      case 'string':
      case 'undefined':
      default:
        return renderEmpty
          ? renderEmptyText(renderEmpty)
          : renderEmptyText(emptyText);
    }
  };

  render(): React.DOM {
    const { highlightCurrent } = this.props;
    const { root } = this;
    const isNotEmpty = root.childNodes && root.childNodes.some(node => node.visible);

    return (
      <div
        style={this.style()}
        className={this.className('el-tree', {
          'el-tree--highlight-current': highlightCurrent
        })}
      >
        {isNotEmpty
          ? this.renderChildrens()
          : this.renderEmpty()}
      </div>
    );
  }
}

Tree.propTypes = {
  autoExpandParent: PropTypes.bool,
  checkStrictly: PropTypes.bool,
  currentNodeKey: PropTypes.any,
  defaultCheckedKeys: PropTypes.array,
  defaultExpandedKeys: PropTypes.array,
  defaultExpandAll: PropTypes.bool,
  data: PropTypes.array,
  emptyText: PropTypes.string,
  renderEmpty: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.node]),
  expandOnClickNode: PropTypes.bool,
  filterNodeMethod: PropTypes.func,
  renderContent: PropTypes.func,
  isShowCheckbox: PropTypes.bool,
  accordion: PropTypes.bool,
  indent: PropTypes.number,
  nodeKey: PropTypes.string,
  options: PropTypes.shape({
    children: PropTypes.string,
    label: PropTypes.string,
    icon: PropTypes.string
  }), //equal to props in vue element
  lazy: PropTypes.bool, //todo: check this
  highlightCurrent: PropTypes.bool,
  // (f:(resolve, reject)=>Unit)=>Unit
  load: PropTypes.func,
  //
  shouldNodeRender: PropTypes.func,
  onCheckChange: PropTypes.func,
  // todo: 这个地方需要改下， 现在是current和nodeclick一起被设置上了
  // (nodeModel.data, node)=>Unit
  onNodeClicked: PropTypes.func,
  // (nodeModel.data, node)=>Unit
  onCurrentChange: PropTypes.func,
  // (nodeModel.data, nodeModel, Node)=>Unit
  onNodeExpand: PropTypes.func,
  onNodeCollapse: PropTypes.func,
  isLazy: PropTypes.bool,
  hideArrowWhenNoLeaves: PropTypes.bool,
};

Tree.defaultProps = {
  autoExpandParent: true,
  defaultCheckedKeys: [],
  defaultExpandedKeys: [],
  data: [],
  expandOnClickNode: true,
  emptyText: Locale.t('el.tree.emptyText'),
  indent: 16,
  options: { children: 'children', label: 'label', icon: 'icon' },
  shouldNodeRender: () => true,
  onCheckChange() {},
  onNodeClicked() {},
  onCurrentChange(){},
  onNodeExpand(){},
  onNodeCollapse(){},
  isLazy: false,
  hideArrowWhenNoLeaves: false,
};
