/* @flow */

import React from 'react';
import { Component, PropTypes } from '../../libs';
import Popover from '../popover/Popover';

const EMPTY_FUNC = (stepIdx: number, event: any) => {};
const EMPTY_OBJECT = {};

export default class Step extends Component {
  static defaultProps = {
    status: 'wait',
    popperProps: EMPTY_OBJECT,
  };

  popperRef: any = React.createRef();

  constructor(props: Object) {
    super(props);
    this.state = {
      offsetLeft: 0,
      borderWidth: 0,
      lineLeft: 0,
      lineRight: 0,
      isShowPopper: false,
    };
  }

  componentDidMount() {
    this.setOffsetLeft();
  }

  componentDidUpdate() {
    this.setOffsetLeft();
  }

  get iconStyle() {
    const { direction } = this.props;
    const { offsetLeft } = this.state;
    if (direction === 'horizontal') {
      return {
        left: `${offsetLeft}px`,
      };
    }
    return {};
  }

  get lineStyle() {
    const { direction } = this.props;
    const { lineLeft, lineRight } = this.state;
    if (direction === 'horizontal') {
      return {
        left: `${lineLeft}px`,
        right: `${lineRight}px`,
      };
    }
    return {};
  }

  handleClickStep = (event: any) => {
    const { onClick = EMPTY_FUNC, stepNumber } = this.props;
    onClick(stepNumber - 1, event);
  }

  handleHoverStep = () => {
    this.setState({ isShowPopper: true });
  }

  handleBlurStep = () => {
    this.setState({ isShowPopper: false });
  }

  setOffsetLeft() {
    if (this.refs.$icon && this.refs.title) {
      const { offsetLeft: stateLeft, borderWidth: stateBorder } = this.state;

      const iconOuterWidth = this.refs.$icon.offsetWidth;
      const iconInnerWidth = this.refs.$icon.clientWidth;
      const titleWidth = this.refs.title.offsetWidth;
      const offsetLeft = (titleWidth - iconOuterWidth) / 2;
      const borderWidth = iconOuterWidth - iconInnerWidth;

      if (offsetLeft !== stateLeft || borderWidth !== stateBorder) {
        this.setState({ offsetLeft, borderWidth });
      }
    }
  }

  setLinePosition(nextStepRight: number) {
    const iconEl = this.refs.$icon;
    if (iconEl) {
      const { offsetLeft } = this.state;
      const iconWidth = iconEl.offsetWidth;
      this.setState({
        lineLeft: iconWidth + offsetLeft,
        lineRight: -nextStepRight,
      });
    }
  }

  renderStepIcon(): React.DOM {
    const {
      icon,
      status,
      stepNumber,
      onClick
    } = this.props;
    const { handleClickStep, handleHoverStep, handleBlurStep } = this;

    const stepIconClass = this.classNames('el-step__icon', onClick && 'is-clickable');
    const iconNode = icon ? <i className={icon} /> : <div>{stepNumber}</div>;

    return (
      <span ref="$icon" className={stepIconClass} style={this.iconStyle} onClick={handleClickStep} onMouseEnter={handleHoverStep} onMouseLeave={handleBlurStep}>
        {status !== 'success' && status !== 'error'
          ? iconNode
          : <i className={'el-icon-' + (status === 'success' ? 'check' : 'close')} />}
      </span>
    );
  }

  render(): React.DOM {
    const {
      title,
      icon,
      description,
      status,
      direction,
      style,
      lineStyle,
      onClick,
      popper,
      popperClass,
      popperProps
    } = this.props;
    const { isShowPopper } = this.state;
    const { handleClickStep, handleHoverStep, handleBlurStep } = this;
    const directionClass = `is-${direction}`;
    const statusClass = `is-${status}`;

    const stepClass = this.className('el-step', directionClass);
    const stepHeaderClass = this.classNames('el-step__head', statusClass, { 'is-text': !icon });
    const stepLineClass = this.classNames('el-step__line', directionClass, { 'is-icon': icon });
    const stepTitleClass = this.classNames('el-step__title', statusClass, onClick && 'is-clickable')
    const stepDescClass = this.classNames('el-step__description', statusClass, onClick && 'is-clickable')

    return (
      <div ref="$el" style={this.style(style)} className={stepClass}>
        <div className={stepHeaderClass}>
          <div className={stepLineClass} style={this.lineStyle}>
            <i className="el-step__line-inner" style={lineStyle} />
          </div>
          {description && popper ? (
            <Popover ref={this.popperRef} appendToBody placement="top" trigger="manual" visible={isShowPopper} content={description} popperClass={popperClass} {...popperProps}>
              {this.renderStepIcon()}
            </Popover>
          ) : this.renderStepIcon()}
        </div>
        <div className="el-step__main">
          <div ref="title" className={stepTitleClass} onClick={handleClickStep} onMouseEnter={handleHoverStep} onMouseLeave={handleBlurStep}>
            {title}
          </div>
          {description && !popper ? (
            <div className={stepDescClass} onClick={handleClickStep}>
              {description}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

Step.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  icon: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  status: PropTypes.string,
  direction: PropTypes.string,
  style: PropTypes.object,
  lineStyle: PropTypes.object,
  stepNumber: PropTypes.number,
  onClick: PropTypes.func,
  popper: PropTypes.bool,
  popperClass: PropTypes.string,
  popperProps: PropTypes.object,
};
