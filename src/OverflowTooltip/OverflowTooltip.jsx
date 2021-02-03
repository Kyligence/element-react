import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { PureComponent } from '../../libs';
import Tooltip from '../tooltip';

export default class OverflowTooltip extends PureComponent {
  static propTypes = {
    children: PropTypes.element.isRequired,
    content: PropTypes.node.isRequired,
    popperProps: PropTypes.object,
  };

  static defaultProps = {
    popperProps: undefined,
  };

  state = {
    isShowSample: true,
    isShowTooltip: false,
  };

  $childRef = React.createRef();

  componentDidMount() {
    this.calculateTooltip();
  }

  componentDidUpdate() {
    this.calculateTooltip();
  }

  get isShouldTooltip() {
    const $child = this.$childRef.current;
    const $parent = $child.parentNode;
    const { width: childWidth } = $child.getBoundingClientRect();
    const { width: parentWidth } = $parent.getBoundingClientRect();
    const parentStyle = window.getComputedStyle($parent);
    const paddingLeft = +parentStyle.paddingLeft.replace('px', '');
    const paddingRight = +parentStyle.paddingRight.replace('px', '');

    if (childWidth > 0 && parentWidth > 0) {
      return childWidth > parentWidth - paddingLeft - paddingRight;
    }
    return false;
  }

  calculateTooltip() {
    this.setState({ isShowSample: true }, () => {
      const $child = this.$childRef.current;

      if ($child) {
        const { isShowTooltip } = this.state;
        if (isShowTooltip !== this.isShouldTooltip) {
          if (this.isShouldTooltip) {
            this.setState({ isShowTooltip: true });
          } else {
            this.setState({ isShowTooltip: false });
          }
        }
      }

      this.setState({ isShowSample: false });
    });
  }

  render() {
    const { children, content, popperProps } = this.props;
    const { isShowSample, isShowTooltip } = this.state;
    const { $childRef } = this;

    return (
      <Fragment>
        {isShowSample && (
          <span ref={$childRef}>
            {children}
          </span>
        )}
        {isShowTooltip ? (
          <Tooltip
            positionFixed
            effect="dark"
            className="overflow-tooltip"
            style={{ display: isShowSample ? 'none' : 'block' }}
            placement="top"
            content={content}
            popperProps={popperProps}
          >
            {children}
          </Tooltip>
        ) : React.cloneElement(children, {
          ...children.props,
          style: { display: isShowSample ? 'none' : 'inline' }
        })}
      </Fragment>
    );
  }
}
