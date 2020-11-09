import React, { Children, PureComponent } from 'react';
import PropTypes from 'prop-types';
import { getScrollParent } from '../utils/domHelper';

/* eslint-disable react/jsx-filename-extension */
export default class LazyList extends PureComponent {
  static elementType = 'LazyList';

  static propTypes = {
    children: PropTypes.node,
    renderItemSize: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.number,
    ]),
    isHorizontal: PropTypes.bool,
    debounceMs: PropTypes.number,
    delayMs: PropTypes.number,
  };

  static defaultProps = {
    children: [],
    renderItemSize: 0,
    isHorizontal: false,
    debounceMs: 10,
    delayMs: 0,
  };

  _isMounted = false;

  $list = React.createRef();

  state = {
    parentScroll: 0,
    parentSize: 0,
    scrollParent: null,
  };

  componentDidMount() {
    const { delayMs } = this.props;

    setTimeout(() => {
      if (this._isMounted) {
        this.bindEvents();
        window.addEventListener('resize', this.handleResize);
      }
    }, delayMs);

    this.toggleMounted(true);
  }

  componentDidUpdate() {
    const { scrollParent: oldScrollParent, parentSize: oldParentSize } = this.state;
    const newScrollParent = getScrollParent(this.$list.current);
    const newParentSize = this.getParentSize(newScrollParent);

    const isScrollParentChange = newScrollParent && oldScrollParent !== newScrollParent;
    const isParentSizeChange = oldParentSize !== newParentSize;

    if (isScrollParentChange || isParentSizeChange) {
      this.removeEvents();
      this.bindEvents();
    }
  }

  componentWillUnmount() {
    this.removeEvents();
    window.removeEventListener('resize', this.handleResize);

    this.toggleMounted(false);
  }

  getParentSize (scrollParent) {
    const { isHorizontal } = this.props;
    const windowSize = { width: window.innerWidth, height: window.innerHeight };
    const elementSize = { width: scrollParent.clientWidth, height: scrollParent.clientHeight };
    const parentSize = [window, document].includes(scrollParent) ? windowSize : elementSize;

    return isHorizontal ? parentSize.width : parentSize.height;
  }

  getItemSize(child, idx) {
    const { renderItemSize } = this.props;
    return typeof renderItemSize === 'number'
      ? renderItemSize
      : renderItemSize(child, idx);
  }

  getParentScroll(scrollParent) {
    const { isHorizontal } = this.props;
    const windowSize = { top: document.documentElement.scrollTop, left: document.documentElement.scrollLeft };
    const elementSize = { top: scrollParent.scrollTop, left: scrollParent.scrollLeft };
    const parentSize = [window, document].includes(scrollParent) ? windowSize : elementSize;

    return isHorizontal ? parentSize.left : parentSize.top;
  }

  getParentOffset(scrollParent) {
    const { isHorizontal } = this.props;
    const listSize = [window, document, null].includes(scrollParent)
      ? { top: 0, left: 0 }
      : scrollParent.getBoundingClientRect();
    return isHorizontal ? listSize.left : listSize.top;
  }

  getListOffset(listEl) {
    const { isHorizontal } = this.props;
    const listSize = listEl.getBoundingClientRect();
    return isHorizontal ? listSize.left : listSize.top;
  }

  getIsOutOfBox({ listOffset, offset, itemSize, parentSize, parentOffset }) {
    return listOffset + offset + itemSize >= parentOffset &&
      listOffset + offset <= parentOffset + parentSize;
  }

  get listStyle() {
    const { children, renderItemSize, isHorizontal } = this.props;

    const value = Children.toArray(children).reduce((totalSize, child, idx) => {
      const size = typeof renderItemSize === 'number' ? renderItemSize : renderItemSize(child, idx);
      return totalSize + size;
    }, 0);
    const height = !isHorizontal ? `${value}px` : null;
    const width = isHorizontal ? `${value}px` : null;

    return { height, width, position: 'relative' };
  }

  toggleMounted(isMounted) {
    this._isMounted = isMounted;
  }

  bindEvents() {
    const scrollParent = getScrollParent(this.$list.current);

    this.setState({ scrollParent });
    scrollParent.addEventListener('scroll', this.handleScroll);

    this.handleScroll({ target: scrollParent });
  }

  removeEvents() {
    const parentScroll = getScrollParent(this.$list.current);

    parentScroll.removeEventListener('scroll', this.handleScroll);
    this.setState({ parentScroll: null });
  }

  handleScroll = (event) => {
    const { debounceMs } = this.props;

    clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      const parentScroll = this.getParentScroll(event.target);
      const parentSize = this.getParentSize(event.target);

      this.setState({ parentScroll, parentSize });
    }, debounceMs);
  }

  handleResize = () => {
    const { parentScroll } = this.state;
    if (parentScroll) {
      this.handleScroll({ target: parentScroll });
    }
  }

  render() {
    const { isHorizontal, children } = this.props;
    const { scrollParent } = this.state;
    let offset = 0;

    return (
      <div style={this.listStyle} ref={this.$list}>
        {scrollParent && Children.map(children, (child, idx) => {
          const parentSize = this.getParentSize(scrollParent);
          const itemSize = this.getItemSize(child, idx);
          const listOffset = this.getListOffset(this.$list.current);
          const parentOffset = this.getParentOffset(scrollParent);

          let childComponent = null;

          if (this.getIsOutOfBox({ listOffset, offset, itemSize, parentSize, parentOffset })) {
            childComponent = React.cloneElement(child, {
              ...child.props,
              style: {
                ...child.props.style,
                position: 'absolute',
                boxSizing: 'border-box',
                width: !isHorizontal ? '100%' : null,
                height: isHorizontal ? '100%' : null,
                top: !isHorizontal ? `${offset}px` : null,
                left: isHorizontal ? `${offset}px` : null,
              }
            });
          }

          offset += itemSize;

          return childComponent;
        })}
      </div>
    );
  }
}
