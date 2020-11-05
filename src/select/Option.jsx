/* @flow */

import React, { Children } from 'react';
import { isEqual } from 'lodash';
import { Component, PropTypes, View } from '../../libs';
import OverflowTooltip from '../OverflowTooltip/OverflowTooltip';

type State = {
  index: number,
  visible: boolean
};

export default class Option extends Component {
  state: State;

  constructor(props: Object) {
    super(props);

    this.state = {
      index: -1,
      visible: true
    };
  }

  componentWillMount() {
    this.parent().onOptionCreate(this);

    this.setState({
      index: this.parent().state.options.indexOf(this)
    });

    if (this.currentSelected() === true) {
      this.parent().addOptionToValue(this, true);
    }
  }

  componentWillUnmount() {
    this.parent().onOptionDestroy(this);
  }

  get clickEvent(): string {
    const isMobileTouch = 'ontouchend' in (document.documentElement || {});
    return isMobileTouch ? 'onTouchEnd' : 'onClick';
  }

  get showOverflowTooltip() {
    const { showOverflowTooltip, children } = this.props;
    return showOverflowTooltip && Children.count(children) === 0;
  }

  parent(): Object {
    const { component } = this.context;
    return component;
  }

  currentSelected(): boolean {
    const { selected, value } = this.props;
    return selected || (this.parent().props.multiple ?
      this.parent().state.value.indexOf(value) > -1 :
      isEqual(this.parent().state.value, value));
  }

  currentLabel(): string {
    const { label, value } = this.props;
    return label || ((typeof value === 'string' || typeof value === 'number') ? value : '');
  }

  itemSelected(): boolean {
    const { value } = this.props;
    if (Object.prototype.toString.call(this.parent().state.selected) === '[object Object]') {
      return isEqual(this, this.parent().state.selected);
    } else if (Array.isArray(this.parent().state.selected)) {
      return this.parent().state.selected.map(el => el.props.value).indexOf(value) > -1;
    }

    return false;
  }

  hoverItem = () => {
    const { disabled } = this.props;
    if (!disabled && !this.parent().props.disabled) {
      this.parent().setState({
        hoverIndex: this.parent().state.options.indexOf(this)
      });
    }
  }

  selectOptionClick = () => {
    const { disabled } = this.props;
    if (disabled !== true && this.parent().props.disabled !== true) {
      this.parent().onOptionClick(this);
    }
  }

  queryChange(query: string) {
    const { hidden } = this.props;
    // query 里如果有正则中的特殊字符，需要先将这些字符转义
    const parsedQuery = query.replace(/(\^|\(|\)|\[|\]|\$|\*|\+|\.|\?|\\|\{|\}|\|)/g, '\\$1');
    const visible = new RegExp(parsedQuery, 'i').test(this.currentLabel());

    if (hidden || !visible) {
      this.parent().setState({
        filteredOptionsCount: this.parent().state.filteredOptionsCount - 1
      });
    }
    this.setState({ visible });
  }

  resetIndex() {
    this.setState({
      index: this.parent().state.options.indexOf(this)
    });
  }

  renderChildren() {
    const { children } = this.props;
    return children || <span>{this.currentLabel()}</span>
  }

  render() {
    const { visible, index } = this.state;
    const { disabled, hidden } = this.props;
    const { showOverflowTooltip } = this;

    const events = {
      onMouseEnter: this.hoverItem,
      [this.clickEvent]: this.selectOptionClick,
    };

    return (
      <View show={visible && !hidden}>
        <li
          style={this.style()}
          className={this.className('el-select-dropdown__item', {
            'selected': this.itemSelected(),
            'is-disabled': disabled || this.parent().props.disabled,
            'hover': this.parent().state.hoverIndex === index
          })}
          {...events}
        >
          {showOverflowTooltip ? (
            <OverflowTooltip content={this.currentLabel()}>
              {this.renderChildren()}
            </OverflowTooltip>
          ) : (this.renderChildren())}
        </li>
      </View>
    )
  }
}

Option.contextTypes = {
  component: PropTypes.any
};

Option.propTypes = {
  value: PropTypes.any,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
  hidden: PropTypes.bool,
  children: PropTypes.node,
  showOverflowTooltip: PropTypes.bool,
  icon: PropTypes.string,
  onIconClick: PropTypes.func
}
