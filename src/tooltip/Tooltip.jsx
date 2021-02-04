/* @flow */

import React from 'react';
import Popper from 'popper.js';
import { merge } from '../../libs/utils/dataHelper';
import { Component, PropTypes, Transition, View, MountBody } from '../../libs';

type State = {
  showPopper: boolean;
}

const EMPTY_FUNC = () => {};
export default class Tooltip extends Component {
  state: State;

  static defaultProps = {
    effect: "dark",
    placement: "bottom",
    disabled: false,
    transition: "fade-in-linear",
    visibleArrow: true,
    openDelay: 0,
    manual: false,
    positionFixed: false,
    appendToBody: false,
    onShow: EMPTY_FUNC,
    onHide: EMPTY_FUNC,
  }

  constructor(props: Object) {
    super(props);

    this.state = {
      showPopper: false
    }
  }

  componentWillReceiveProps(nextProps: Object) {
    const { visible: oldVisible } = this.props;
    const { visible: newVisible } = nextProps;

    if (oldVisible !== newVisible) {
      this.setState({ showPopper: newVisible });
    }
  }

  showPopper(): void {
    const { manual, openDelay, onShow } = this.props;

    if (!manual) {
      this.timeout = setTimeout(() => {
        this.setState({ showPopper: true }, onShow);
      }, openDelay);
    }
  }

  hidePopper(): void {
    const { manual, onHide } = this.props;

    if (!manual) {
      clearTimeout(this.timeout);
      this.setState({ showPopper: false }, onHide);
    }
  }

  onEnter(): void {
    const { popper, reference, arrow } = this.refs;
    const { placement, positionFixed, popperProps: customProps } = this.props;

    if (arrow) {
      arrow.setAttribute('x-arrow', '');
    }

    const defaultProps = {
      placement,
      positionFixed,
      modifiers: {
        computeStyle: {
          gpuAcceleration: false
        },
        preventOverflow: {
          boundariesElement: 'window',
        }
      }
    };

    const popperProps = merge(defaultProps, customProps);
    this.popperJS = new Popper(reference, popper, popperProps);
  }

  onAfterLeave(): void {
    this.popperJS.destroy();
  }

  renderTooltip() {
    const { effect, content, disabled, transition, visibleArrow, popperClass } = this.props;
    const { showPopper } = this.state;

    return !disabled && (
      <Transition name={transition} onEnter={this.onEnter.bind(this)} onAfterLeave={this.onAfterLeave.bind(this)}>
        <View show={showPopper}>
          <div ref="popper" className={this.classNames("el-tooltip__popper", `is-${effect}`, popperClass)}>
            <div>{content}</div>
            {visibleArrow && (
              <div ref="arrow" className="popper__arrow" />
            )}
          </div>
        </View>
      </Transition>
    )
  }

  render(): React.DOM {
    const { children, appendToBody } = this.props;

    return (
      <div style={this.style()} className={this.className('el-tooltip')} onMouseEnter={this.showPopper.bind(this)} onMouseLeave={this.hidePopper.bind(this)}>
        <div ref="reference" className="el-tooltip__rel">
          <div>{children}</div>
        </div>
        {appendToBody
          ? <MountBody>{this.renderTooltip()}</MountBody>
          : this.renderTooltip()}
      </div>
    )
  }
}

Tooltip.propTypes = {
  // 默认提供的主题: dark, light
  effect: PropTypes.string,
  // 显示的内容，也可以通过 slot#content 传入 DOM
  content: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  // Tooltip 的出现位置 [top, top-start, top-end, bottom, bottom-start, bottom-end, left, left-start, left-end, right, right-start, right-end]
  placement: PropTypes.oneOf(['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end', 'right', 'right-start', 'right-end']),
  // 状态是否可用
  disabled: PropTypes.bool,
  // 渐变动画定义
  transition: PropTypes.string,
  // 是否显示 Tooltip 箭头
  visibleArrow: PropTypes.bool,
  // 延迟出现(单位: 毫秒)
  openDelay: PropTypes.number,
  // 手动控制模式，设置为 true 后，mouseenter 和 mouseleave 事件将不会生效
  manual: PropTypes.bool,
  // 手动控制状态的展示
  visible: PropTypes.bool,
  positionFixed: PropTypes.bool,
  popperClass: PropTypes.string,
  appendToBody: PropTypes.bool,
  onShow: PropTypes.func,
  onHide: PropTypes.func,
};
