import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { PureComponent } from '../../libs';
import { findParents, getPagePosition } from './handler';
import * as memoize from './memoize';

const EMPTY_FUNC = () => {};
const EMPTY_ARRAY = [];

export default class ResizableItem extends PureComponent {
  static propTypes = {
    // public props
    defaultSize: PropTypes.string,
    maxSize: PropTypes.string,
    minSize: PropTypes.string,
    onResize: PropTypes.func,
    children: PropTypes.node.isRequired,
    // private props
    alignment: PropTypes.oneOf(['vertical', 'horizontal']),
    wrapperSize: PropTypes.number,
    resizableItems: PropTypes.array,
  };

  static defaultProps = {
    // public props
    defaultSize: '0px',
    maxSize: '100%',
    minSize: '0px',
    onResize: EMPTY_FUNC,
    // private props
    alignment: 'vertical',
    wrapperSize: 0,
    resizableItems: EMPTY_ARRAY
  };
  // 临时变量
  handleRef = React.createRef();
  startAt = 0;
  startSize = 0;
  startSizeNextItem = 0;
  // memoize function
  getMaxSize = memoize.generateGetMaxSize();
  getMinSize = memoize.generateGetMaxSize();
  getDefaultSize = memoize.generateGetDefaultSize();
  // component state
  state = {
    isDrag: false,
    size: 0,
  };

  componentDidMount() {
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleResize);

    this.initSize();
  }

  componentDidUpdate(prevProps) {
    const { wrapperSize: oldWrapperSize, defaultSize: oldDefaultSize } = prevProps;
    const { wrapperSize: newWrapperSize, defaultSize: newDefaultSize } = this.props;

    if (oldWrapperSize !== newWrapperSize) {
      this.onWrapperSizeChanged(oldWrapperSize, newWrapperSize);
    }
    if (oldDefaultSize !== newDefaultSize) {
      this.onDefaultSizeChanged(oldDefaultSize, newDefaultSize);
    }
  }

  get _maxSize() {
    const { maxSize, wrapperSize } = this.props;
    return this.getMaxSize(maxSize, wrapperSize);
  }

  get _minSize() {
    const { minSize, wrapperSize } = this.props;
    return this.getMinSize(minSize, wrapperSize);
  }

  get _defaultSize() {
    const { defaultSize, wrapperSize } = this.props;
    return this.getDefaultSize(defaultSize, wrapperSize);
  }

  get currentIdx() {
    const { resizableItems } = this.props;
    return resizableItems.findIndex(item => item.current === this);
  }

  get isLastItem() {
    const { resizableItems } = this.props;
    const { currentIdx } = this;
    return resizableItems.length === currentIdx + 1;
  }

  get nextItem() {
    const { resizableItems } = this.props;
    const { currentIdx, isLastItem } = this;
    return !isLastItem ? resizableItems[currentIdx + 1] : null;
  }

  get itemStyle() {
    const { alignment } = this.props;
    const { size } = this.state;

    switch (alignment) {
      case 'horizontal':
        return { width: `${size}px`, height: '100%' };
      case 'vertical':
        return { width: '100%', height: `${size}px` };
      default:
        return null;
    }
  }

  initSize = () => {
    const { _defaultSize, _minSize, _maxSize } = this;
    const isValidSize = _minSize <= _defaultSize && _defaultSize <= _maxSize;

    if (isValidSize) {
      this.setState({ size: _defaultSize });
    } else if (_defaultSize < _minSize) {
      this.setState({ size: _minSize });
      const currentItemWarning = `Min Size: ${_minSize}, Default Size: ${_defaultSize}, Max Size: ${_maxSize}.`;
      console.warn(`Error in Resizable.Item size:\n${currentItemWarning}`);
    } else if (_defaultSize > _maxSize) {
      this.setState({ size: _maxSize });
      const currentItemWarning = `Min Size: ${_minSize}, Default Size: ${_defaultSize}, Max Size: ${_maxSize}.`;
      console.warn(`Error in Resizable.Item size:\n${currentItemWarning}`);
    }
  };

  handleMouseDown = (event) => {
    const { alignment } = this.props;
    const { size } = this.state;
    const { handleRef } = this;

    const isHandleInParent = findParents(event.target).includes(handleRef.current);
    const isHandleTarget = event.target === handleRef.current;
    const isDraggable = isHandleInParent || isHandleTarget;
    const isLeftClick = !event.button;

    if (isDraggable && isLeftClick) {
      this.startAt = getPagePosition(alignment, event);
      this.startSize = size;

      const { nextItem } = this;
      const { size: nextItemSize } = nextItem.current.state;
      this.startSizeNextItem = nextItemSize;

      this.setState({ isDrag: true });
    }
  };

  handleMouseUp = () => {
    const { isDrag } = this.state;
    if (isDrag) {
      this.startAt = 0;
      this.startSize = 0;
      this.startSizeNextItem = 0;

      this.setState({ isDrag: false });
    }
  };

  handleResize = (event) => {
    const { isDrag } = this.state;
    const { alignment, onResize } = this.props;

    if (isDrag) {
      const { _minSize, _maxSize, nextItem, startSize, startSizeNextItem } = this;
      const { _minSize: _nMinSize, _maxSize: _nMaxSize } = nextItem.current;

      const offset = getPagePosition(alignment, event) - this.startAt;
      const size = startSize + offset;
      const nextItemSize = startSizeNextItem - offset;
      const isValidSize = _minSize <= size && size <= _maxSize;
      const isValidSizeNextItem = _nMinSize <= nextItemSize && nextItemSize <= _nMaxSize;

      if (isValidSize && isValidSizeNextItem) {
        this.setState({ size });
        nextItem.current.setState({ size: nextItemSize });
      } else if (size < _minSize && isValidSizeNextItem) {
        this.setState({ size: _minSize });
        nextItem.current.setState({ size: startSizeNextItem + startSize - _minSize });
      } else if (size > _maxSize && isValidSizeNextItem) {
        this.setState({ size: _maxSize });
        nextItem.current.setState({ size: startSizeNextItem + startSize - _maxSize });
      } else if (nextItemSize < _nMinSize && isValidSize) {
        nextItem.current.setState({ size: _nMinSize });
        this.setState({ size: startSizeNextItem + startSize - _nMinSize });
      } else if (nextItemSize > _nMaxSize && isValidSize) {
        nextItem.current.setState({ size: _nMaxSize });
        this.setState({ size: startSizeNextItem + startSize - _nMaxSize });
      } else {
        const currentItemWarning = `Min Size: ${_minSize}, Current Size: ${size}, Max Size: ${_maxSize}.`;
        const nextItemWarning = `Min Size: ${_nMinSize}, Current Size: ${nextItemSize}, Max Size: ${_nMaxSize}.`;
        console.warn(`Error in Resizable.Item size:\n${currentItemWarning}\n${nextItemWarning}`);
      }

      onResize(event);
    }
  };

  onWrapperSizeChanged = (oldVal, newVal) => {
    const { _minSize, _maxSize } = this;
    const { size: oldSize } = this.state;
    const size = oldSize / oldVal * newVal;

    if (_minSize <= size && size <= _maxSize) {
      this.setState({ size });
    } else if (size < _minSize) {
      this.setState({ size: _minSize });
    } else if (size > _maxSize) {
      this.setState({ size: _maxSize });
    }
  };

  onDefaultSizeChanged = (oldVal, newVal) => {
    const { _minSize, _maxSize } = this;

    if (_minSize <= newVal && newVal <= _maxSize) {
      this.setState({ size: newVal });
    } else if (newVal < _minSize) {
      this.setState({ size: _minSize });
    } else if (newVal > _maxSize) {
      this.setState({ size: _maxSize });
    }
  };

  render() {
    const { children } = this.props;
    const { isDrag } = this.state;
    const { itemStyle, isLastItem } = this;

    return (
      <div className="resizable-item" style={this.style(itemStyle)}>
        {children}
        {!isLastItem && (
          <div className={classnames('resizable-handler', isDrag && 'dragging')} ref={this.handleRef} />
        )}
      </div>
    );
  }
}
