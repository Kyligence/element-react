import React, { Children } from 'react';
import PropTypes from 'prop-types';
import ResizeObserver from 'resize-observer-polyfill';

import Item from './Item';
import { getSize } from './handler';
import { PureComponent } from '../../libs';

export default class ResizableWrapper extends PureComponent {
  static propTypes = {
    children: PropTypes.node.isRequired,
    alignment: PropTypes.oneOf(['vertical', 'horizontal']),
    theme: PropTypes.oneOf(['light-bar', 'heavy-bar']),
  };

  static defaultProps = {
    alignment: 'horizontal',
    theme: 'light-bar',
  };

  wrapperRef = React.createRef();
  childrenRef = [];
  
  state = {
    inited: false,
    wrapperSize: 0,
  };

  componentDidMount() {
    this.listenWrapperSizeChange();
  }

  listenWrapperSizeChange = () => {
    const { wrapperRef } = this;
    new ResizeObserver(this.handleResizeWrapper).observe(wrapperRef.current);
  };

  clearupRefs = () => {
    this.childrenRef = [];
  };

  createRef = () => {
    const childRef = React.createRef();
    this.childrenRef.push(childRef);
    return childRef;
  };

  isValidElement = childNode => {
    return React.isValidElement(childNode) && childNode.type.name === Item.name;
  };

  handleResizeWrapper = ([entity]) => {
    const { alignment } = this.props;
    const wrapperSize = getSize(alignment, entity.contentRect);
    this.setState({ wrapperSize, inited: true });
  };

  render() {
    const { children, alignment, theme } = this.props;
    const { wrapperSize, inited } = this.state;
    const { wrapperRef } = this;

    this.clearupRefs();
  
    return (
      <div className={this.className('resizable-wrapper', alignment, theme)} ref={wrapperRef}>
        {inited && Children.map(children, child => this.isValidElement(child)
          ? React.cloneElement(child, {
            ...child.props,
            alignment,
            wrapperSize,
            ref: this.createRef(),
            resizableItems: this.childrenRef,
          }) : child)}
      </div>
    );
  }
}
