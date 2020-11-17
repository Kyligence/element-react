/* @flow */

import React, { Children } from 'react';
import ReactDOM from 'react-dom';
import ClickOutside from 'kyligence-react-click-outside';
import { debounce } from 'throttle-debounce';
import Popper from 'popper.js';
import { isEqual } from 'lodash';
import { Component, PropTypes, Transition, View, LazyList } from '../../libs';
import { merge } from '../../libs/utils/dataHelper';
import { addResizeListener, removeResizeListener } from '../../libs/utils/resize-event';

import { Scrollbar } from '../scrollbar';

import Tag from '../tag';
import Input from '../input';
import i18n from '../locale';

// StyleSheet.reset(`
//   .el-select-dropdown {
//     position: fixed !important;
//   }
// `)

type State = {
  options: Array<Object>,
  inputLength: number,
  inputWidth: number,
  inputHovering: boolean,
  filteredOptionsCount: number,
  optionsCount: number,
  hoverIndex: number,
  bottomOverflowBeforeHidden: number,
  currentPlaceholder: string,
  selectedLabel: string,
  value: any,
  visible: boolean,
  query: string,
  selected: any,
  voidRemoteQuery: boolean,
  valueChangeBySelected: boolean,
  selectedInit: boolean,
  dropdownUl?: HTMLElement,
  isFocus: boolean,
  isDirty: boolean,
};

const sizeMap: { [size: string]: number } = {
  'large': 42,
  'normal': 30,
  'small': 24,
  'mini': 22
};

class Select extends Component {
  state: State;
  debouncedOnInputChange: Function;
  timer: TimeoutID;

  constructor(props: Object) {
    super(props);

    this.state = {
      options: [],
      inputLength: 20,
      inputWidth: 0,
      inputHovering: false,
      filteredOptionsCount: 0,
      optionsCount: 0,
      hoverIndex: -1,
      bottomOverflowBeforeHidden: 0,
      currentPlaceholder: props.placeholder || i18n.t('el.select.placeholder'),
      selectedLabel: '',
      selectedInit: false,
      visible: false,
      selected: undefined,
      value: props.value,
      valueChangeBySelected: false,
      voidRemoteQuery: false,
      query: '',
      isFocus: false,
      isDirty: false,
    };

    this.isSingleRemoteOpend = false;
    this.isScrolling = false;
    this.lazyListRef = React.createRef();
    this.scrollRef = React.createRef();

    if (props.multiple) {
      this.state.selectedInit = true;
      this.state.selected = [];
    }

    if (props.remote) {
      this.state.voidRemoteQuery = true;
    }

    this.debouncedOnInputChange = debounce(this.debounce(), () => {
      this.onInputChange();
    });
    this.dealWithScrollDebounce = debounce(200, this.dealWithScroll);
    this.onQueryChange = query => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this._onQueryChange(query), 100);
    };

    this.resetInputWidth = this._resetInputWidth.bind(this)
  }

  getChildContext(): Object {
    return {
      component: this
    };
  }

  componentDidMount() {
    this.reference = ReactDOM.findDOMNode(this.refs.reference);
    this.popper = ReactDOM.findDOMNode(this.refs.popper);

    this.handleValueChange();
    addResizeListener(this.refs.root, this.resetInputWidth);

    const { remote, remoteMethod, multiple } = this.props;
    const { query } = this.state;
    // remote单选补执行远程方法
    if (remote && remoteMethod && !multiple) {
      remoteMethod(query);
    }
  }

  componentWillReceiveProps(props: Object) {
    if (props.placeholder != this.props.placeholder) {
      this.setState({
        currentPlaceholder: props.placeholder
      });
    }

    if (props.value != this.props.value) {
      this.setState({
        value: props.value
      }, () => {
        this.handleValueChange();
      });
    }
  }

  componentWillUpdate(props: Object, state: Object) {
    if (state.value != this.state.value) {
      this.onValueChange(state.value);
    }

    if (state.visible != this.state.visible) {
      if (this.props.onVisibleChange) {
        this.props.onVisibleChange(state.visible);
      }

      this.onVisibleChange(state.visible);
    }

    if (state.query != this.state.query && props.remote && !props.multiple && this.isSingleRemoteOpend) {	
      this.onQueryChange(state.query);
    }

    if (Array.isArray(state.selected)) {
      if (state.selected.length != this.state.selected.length) {
        this.onSelectedChange(state.selected);
      }
    }

    this.handleAfterFilterMenuState(props, state);
  }

  componentDidUpdate(props: Object) {
    this.state.inputWidth = this.reference.getBoundingClientRect().width;
    if (this.popperJS && this.props.loading !== props.loading) {
      this.popperJS.update()
    }
  }

  componentWillUnmount() {
    removeResizeListener(this.refs.root, this.resetInputWidth);
  }

  get isNormalDropdown() {
    const { isShowOptionsAfterFilter, remote, filterable } = this.props;
    const isValidShowOptionAfterFilter = isShowOptionsAfterFilter && (remote || filterable);

    return !isShowOptionsAfterFilter || !isValidShowOptionAfterFilter
  }

  get isLazyFilterableNoMethod() {
    const { isLazy, filterMethod, filterable } = this.props;
    return isLazy && !filterMethod && filterable;
  }

  debounce(): number {
    const { debounceMs, remote } = this.props;
    return remote ? debounceMs : 0;
  }

  handleFilter = value => {
    this.setState({ selectedLabel: value }, () => {
      const { remote } = this.props;
      if (!remote) {
        this.onQueryChange(value);
      }
      this.scrollRef.current.wrap.scrollTop = 0;
    });
    if (!this.isNormalDropdown) {
      this.setState({ isDirty: true }, () => {
        this.onQueryChange(value);
      });
    }
  }

  handleFilterMultiple = () => {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      const query = this.refs.input.value;
      this.setState({ query }, () => {
        this.onQueryChange(query);
        this.scrollRef.current.wrap.scrollTop = 0;
      });
      if (!this.isNormalDropdown) {
        this.setState({ isDirty: true }, () => {
          this.onQueryChange(query);
        });
      }
    }, this.debounce());
  }

  handleClickOutside() {
    if (this.state.visible) {
      this.setState({ visible: false });
    }
    // 输入才展示下拉框逻辑
    if (!this.isNormalDropdown) {
      const { value } = this.props;
      this.setState({ isFocus: false, isDirty: false, selectedLabel: value });
    }
  }

  handleValueChange() {
    const { multiple, remote, filterMethod, isLazy } = this.props;
    const { value, options, selected: oldSelected, visible } = this.state;

    if (multiple && Array.isArray(value)) {
      const currentSelected = value.reduce((selecteds, selectedValue) => {
        const currOption = options.find(option => option.props.value === selectedValue);
        return currOption ? [...selecteds, currOption] : selecteds;
      }, []);

      const otherSelected = oldSelected.filter((item) => {
        const isDuplicateSelected = !!currentSelected.find(selected => item.props.value === selected.props.value);
        const isDeletedSelected = !value.find(selectedValue => item.props.value === selectedValue);
        return !isDuplicateSelected && !isDeletedSelected;
      });

      let selected = currentSelected;

      if (remote || isLazy) {
        const newSelected = [...otherSelected, ...currentSelected];
        // 组成selectedMap，通过value快速查找selected
        const selectedMap = newSelected.reduce((map, selectedItem) => ({
          ...map,
          [selectedItem.props.value]: selectedItem,
        }), {});

        // selected按照value的顺序来排序
        selected = value.map(valueItem => selectedMap[valueItem]).filter(val => val);
        // 万一有select不在value中，那就依旧塞回去
        const selectNotInValue = newSelected.filter(item => !value.includes(item.props.value));
        selected = [...selected, ...selectNotInValue];
        // 原来的代码
        // selected = [...otherSelected, ...currentSelected];
      }

      this.setState({ selected }, () => {
        this.onSelectedChange(this.state.selected, false);
      });
    } else {
      if (this.isLazyFilterableNoMethod) {
        this.forceUpdate();
        return this.setState({});
      }

      const selected = options.filter(option => {
        // use lodash isEqual function in case of value type is object or array
        return isEqual(option.props.value , value)
      })[0];

      if (remote && visible) return;
      if (selected && !filterMethod) {
        if (this.isNormalDropdown || (!this.isNormalDropdown && !this.state.isDirty)) {
          this.state.selectedLabel = selected.props.label || selected.props.value;
        }
      }
    }
  }

  onVisibleChange(visible: boolean) {
    const { multiple, filterable } = this.props;
    let { query, dropdownUl, selected, selectedLabel, bottomOverflowBeforeHidden } = this.state;

    if (!visible) {
      this.reference.querySelector('input').blur();

      if (this.refs.root.querySelector('.el-input__icon')) {
        const elements = this.refs.root.querySelector('.el-input__icon');

        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.remove('is-reverse');
        }
      }

      if (this.refs.input) {
        this.refs.input.blur();
      }

      this.resetHoverIndex();

      if (!multiple) {
        if (dropdownUl && selected) {
          const element: any = ReactDOM.findDOMNode(selected);
          bottomOverflowBeforeHidden = element.getBoundingClientRect().bottom - this.popper.getBoundingClientRect().bottom;
        }

        if (selected && selected.props) {
          if (selected.props.value) {
            if (this.isNormalDropdown || (!this.isNormalDropdown && !this.state.isDirty)) {
              selectedLabel = selected.currentLabel();
            }
          }
        } else if (filterable) {
          selectedLabel = '';
        }

        this.setState({ bottomOverflowBeforeHidden, selectedLabel });
      }
      this.isSingleRemoteOpend = false;
      if (this.props.multiple && this.props.filterable) {
        this.refs.input.value = '';
        this.setState({ query: '' }, () => {
          this.onQueryChange();
        });
      }
    } else {
      let icon = this.refs.root.querySelector('.el-input__icon');

      if (icon && !icon.classList.contains('el-icon-circle-close')) {
        const elements = this.refs.root.querySelector('.el-input__icon');

        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.add('is-reverse');
        }
      }

      if (this.popperJS) {
        this.popperJS.update();
      }

      if (filterable) {
        query = selectedLabel;

        if (multiple) {
          this.refs.input.focus();
        } else {
          this.refs.reference.focus();
        }
      }

      if (!dropdownUl) {
        let dropdownChildNodes = this.popper.childNodes;
        dropdownUl = [].filter.call(dropdownChildNodes, item => item.tagName === 'UL')[0];
      }

      if (!multiple && dropdownUl) {
        if (bottomOverflowBeforeHidden > 0) {
          dropdownUl.scrollTop += bottomOverflowBeforeHidden;
        }
      }

      this.setState({ query: query || '', dropdownUl }, () => {
        if (!multiple && this.isNormalDropdown) {
          this.onQueryChange();
          this.isSingleRemoteOpend = true;
        }
      });
    }
  }

  onValueChange(val: mixed) {
    const { multiple, placeholder } = this.props;

    let {
      options,
      valueChangeBySelected,
      selectedInit,
      selected,
      selectedLabel,
      currentPlaceholder
    } = this.state;

    if (valueChangeBySelected) {
      return this.setState({
        valueChangeBySelected: false
      });
    }

    if (multiple && Array.isArray(val)) {
      this.resetInputHeight();

      selectedInit = true;
      selected = [];
      currentPlaceholder = placeholder;

      val.forEach(item => {
        let option = options.filter(option => option.props.value === item)[0];
        if (option) {
          this.addOptionToValue(option);
        }
      });

      this.forceUpdate();
    }

    if (!multiple) {
      let option = options.filter(option => option.props.value === val)[0];

      if (option) {
        this.addOptionToValue(option);
        this.setState({ selectedInit, currentPlaceholder });
      } else {
        selected = {};
        selectedLabel = '';
        this.setState({ selectedInit, selected, currentPlaceholder, selectedLabel }, () => {
          this.resetHoverIndex();
        });
      }
    }
  }

  get canDispatchChange() {
    // 当 懒加载并且不滚动 或 不是懒加载 的时候
    // 因为懒加载的时候，option是实时挂载的，会不断触发onchange事件
    const { isLazy } = this.props;
    return (isLazy && !this.isScrolling) || !isLazy;
  }

  onSelectedChange(val: any, bubble: boolean = true) {
    const { form } = this.context;
    const { multiple, filterable, onChange, placeholder } = this.props;
    let { query, hoverIndex, inputLength, selectedInit, currentPlaceholder, valueChangeBySelected } = this.state;

    if (multiple) {
      if (val.length > 0) {
        currentPlaceholder = '';
      } else {
        currentPlaceholder = placeholder;
      }

      this.setState({ currentPlaceholder }, () => {
        this.resetInputHeight();
      });

      valueChangeBySelected = true;

      if (bubble && this.canDispatchChange) {
        onChange && onChange(val.map(item => item.props.value), val);
        form && form.onFieldChange();
      }

      if (filterable) {
        hoverIndex = -1;
        inputLength = 20;
      }

      this.setState({ valueChangeBySelected, query, hoverIndex, inputLength });
      this.onQueryChange(query);
    } else {
      if (selectedInit) {
        return this.setState({
          selectedInit: false
        });
      }

      if (bubble && this.canDispatchChange) {
        onChange && onChange(val.props.value, val);
        form && form.onFieldChange();
      }
    }
  }

  _onQueryChange(query = '') {
    const { multiple, filterable, remote, remoteMethod, filterMethod } = this.props;
    let { voidRemoteQuery, hoverIndex, options, optionsCount } = this.state;

    if (multiple && filterable) {
      this.resetInputHeight();
    }

    if (remote && typeof remoteMethod === 'function') {
      hoverIndex = -1;
      voidRemoteQuery = query === '';

      remoteMethod(query);

      options.forEach(option => {
        option.resetIndex();
      });
    } else if (typeof filterMethod === 'function') {
      filterMethod(query);
    } else {
      options.forEach(option => {
        option.queryChange(query);
      });
      setTimeout(() => this.setState({
        filteredOptionsCount: options.filter(o => o.state.visible && !o.props.hidden).length,
      }));
    }

    this.setState({ hoverIndex, voidRemoteQuery });
  }

  onEnter = () => {
    const { popperProps: customProps, positionFixed } = this.props;
    const defaultProps = {
      placement: 'bottom-start',
      modifiers: {
        computeStyle: {
          gpuAcceleration: false
        },
        preventOverflow: { enabled: false },
        hide: { enabled: false }
      },
      positionFixed,
    };
    const popperProps = merge(defaultProps, customProps);
    this.popperJS = new Popper(this.reference, this.popper, popperProps);
  };

  onAfterEnter = () => {
    // 第一次展开下拉框的时候有动画，此时懒加载的高度计算不准确，需要在展开后再正确计算一次
    if (this.lazyListRef.current) {
      this.lazyListRef.current.handleResize();
    }
  };

  onAfterLeave = () => {
    this.popperJS.destroy();
  };

  iconClass(): string {
    return this.showCloseIcon() ? 'el-icon-circle-close' : (this.props.remote && this.props.filterable ? '' : `el-kylin-more ${this.state.visible ? 'is-reverse' : ''}`);
  }

  showCloseIcon(): boolean {
    let criteria = this.props.clearable && this.state.inputHovering && !this.props.multiple && this.state.options.indexOf(this.state.selected) > -1;

    if (!this.refs.root) return false;

    let icon = this.refs.root.querySelector('.el-input__suffix.el-input__icon');

    if (icon) {
      if (criteria) {
        icon.addEventListener('click', this.deleteSelected.bind(this));
        icon.classList.add('is-show-close');
      } else {
        icon.removeEventListener('click', this.deleteSelected.bind(this));
        icon.classList.remove('is-show-close');
      }
    }

    return criteria;
  }

  emptyText() {
    const { loading, filterable, noMatchText, noDataText } = this.props;
    const { voidRemoteQuery, options, filteredOptionsCount } = this.state;

    if (loading) {
      return i18n.t('el.select.loading');
    } else {
      if (voidRemoteQuery) {
        this.state.voidRemoteQuery = false;

        return noMatchText || i18n.t('el.select.noMatch');
      }

      if (filterable && filteredOptionsCount === 0) {
        return noMatchText || i18n.t('el.select.noMatch');
      }

      if (options.length === 0 || options.filter(o => !o.props.hidden).length === 0) {
        return noDataText || i18n.t('el.select.noData');
      }
    }

    return null;
  }

  handleClose() {
    this.setState({ visible: false });
  }

  toggleLastOptionHitState(hit?: boolean): any {
    const { selected } = this.state;

    if (!Array.isArray(selected)) return;

    const option = selected[selected.length - 1];

    if (!option) return;

    if (hit === true || hit === false) {
      return option.hitState = hit;
    }

    option.hitState = !option.hitState;

    return option.hitState;
  }

  deletePrevTag(e: Object) {
    if (e.target.value.length <= 0 && !this.toggleLastOptionHitState()) {
      const { selected } = this.state;

      selected.pop();

      this.setState({ selected });
    }
  }

  addOptionToValue(option: any, init?: boolean) {
    const { multiple, remote } = this.props;
    let { selected, selectedLabel, hoverIndex, value, visible } = this.state;

    if (multiple) {
      if (selected.indexOf(option) === -1 && (remote ? value.indexOf(option.props.value) === -1 : true)) {
        this.selectedInit = !!init;

        selected.push(option);

        this.resetHoverIndex();
      }
    } else {
      this.selectedInit = !!init;

      selected = option;
      if (!(this.isLazyFilterableNoMethod && visible)) {
        selectedLabel = option.currentLabel();
      }
      hoverIndex = option.index;
      this.setState({ selected, selectedLabel, hoverIndex });
    }
  }

  managePlaceholder() {
    const { placeholder } = this.props
    let { currentPlaceholder } = this.state;

    if (currentPlaceholder !== '') {
      currentPlaceholder = this.refs.input.value ? '' : placeholder;
    }

    this.setState({ currentPlaceholder });
  }

  resetInputState(e: Object) {
    if (e.keyCode !== 8) {
      this.toggleLastOptionHitState(false);
    }

    this.setState({
      inputLength: this.refs.input.value.length * 15 + 20
    });
  }

  _resetInputWidth() {
    this.setState({
      inputWidth: this.reference.getBoundingClientRect().width
    })
  }

  resetInputHeight() {
    let inputChildNodes = this.reference.childNodes;
    let input = [].filter.call(inputChildNodes, item => item.tagName === 'INPUT')[0];

    input.style.height = Math.max(this.refs.tags.clientHeight + 6, sizeMap[this.props.size] || sizeMap.normal) + 'px';

    if (this.popperJS) {
      this.popperJS.update();
    }
  }

  resetHoverIndex() {
    const { multiple } = this.props;
    let { hoverIndex, options, selected } = this.state;

    setTimeout(() => {
      if (!multiple) {
        hoverIndex = options.indexOf(selected);
      } else {
        if (selected.length > 0) {
          hoverIndex = Math.min.apply(null, selected.map(item => options.indexOf(item)));
        } else {
          hoverIndex = -1;
        }
      }

      this.setState({ hoverIndex });
    }, 300);
  }

  toggleMenu(isVisiable) {
    const { disabled } = this.props;
    const { visible } = this.state;

    if (isVisiable === undefined) {
      if (!disabled) {
        this.setState({ visible: !visible });
      }
    } else {
      this.setState({ visible: isVisiable });
    }
  }

  navigateOptions(direction: string) {
    let { visible, hoverIndex, options } = this.state;

    if (!visible) {
      return this.setState({
        visible: true
      });
    }

    let skip;

    if (options.length != options.filter(item => item.props.disabled === true).length) {
      if (direction === 'next') {
        hoverIndex++;

        if (hoverIndex === options.length) {
          hoverIndex = 0;
        }

        if (options[hoverIndex].props.disabled === true ||
          options[hoverIndex].props.groupDisabled === true ||
          !options[hoverIndex].state.visible) {
          skip = 'next';
        }
      }

      if (direction === 'prev') {
        hoverIndex--;

        if (hoverIndex < 0) {
          hoverIndex = options.length - 1;
        }

        if (options[hoverIndex].props.disabled === true ||
          options[hoverIndex].props.groupDisabled === true ||
          !options[hoverIndex].state.visible) {
          skip = 'prev';
        }
      }
    }

    this.setState({ hoverIndex, options }, () => {
      if (skip) {
        this.navigateOptions(skip);
      }

      this.resetScrollTop();
    });
  }

  resetScrollTop() {
    const element: any = ReactDOM.findDOMNode(this.state.options[this.state.hoverIndex]);
    const bottomOverflowDistance = element.getBoundingClientRect().bottom - this.popper.getBoundingClientRect().bottom;
    const topOverflowDistance = element.getBoundingClientRect().top - this.popper.getBoundingClientRect().top;

    if (this.state.dropdownUl) {
      if (bottomOverflowDistance > 0) {
        this.state.dropdownUl.scrollTop += bottomOverflowDistance;
      }
      if (topOverflowDistance < 0) {
        this.state.dropdownUl.scrollTop += topOverflowDistance;
      }
    }
  }

  selectOption() {
    let { hoverIndex, options } = this.state;

    if (options[hoverIndex]) {
      this.onOptionClick(options[hoverIndex]);
    }
  }

  deleteSelected(e: Object) {
    e.stopPropagation();

    if (this.state.selectedLabel != '') {
      this.setState({
        selected: {},
        selectedLabel: '',
        visible: false
      });

      this.context.form && this.context.form.onFieldChange();

      if (this.props.onChange) {
        this.props.onChange('');
      }

      if (this.props.onClear) {
        this.props.onClear();
      }
    }
  }

  deleteTag(tag: any) {
    const index = this.state.selected.indexOf(tag);

    if (index > -1 && !this.props.disabled) {
      const selected = this.state.selected.slice(0);

      selected.splice(index, 1);

      this.setState({ selected }, () => {
        if (this.props.onRemoveTag) {
          this.props.onRemoveTag(tag.props.value);
        }
      });
    }
  }

  handleIconClick(event) {
    if (this.iconClass().indexOf('circle-close') > -1) {
      this.deleteSelected(event);
    } else {
      this.toggleMenu();
    }
  }

  onInputChange() {
    if (this.props.filterable && this.state.selectedLabel !== this.state.value) {
      this.setState({
        query: this.state.selectedLabel
      });
    }
  }

  onOptionCreate(option: any) {
    this.state.options.push(option);
    this.state.optionsCount++;
    this.state.filteredOptionsCount++;

    this.forceUpdate();
    this.handleValueChange();
  }

  onOptionDestroy(option: any) {
    this.state.optionsCount--;
    this.state.filteredOptionsCount--;

    const index = this.state.options.indexOf(option);

    if (index > -1) {
      this.state.options.splice(index, 1);
    }

    this.state.options.forEach(el => {
      if (el != option) {
        el.resetIndex();
      }
    });

    this.forceUpdate();
    this.handleValueChange();
  }

  onOptionClick(option: any) {
    const { multiple } = this.props;
    let { visible, selected, selectedLabel } = this.state;

    if (!multiple) {
      selected = option;
      selectedLabel = option.currentLabel();
      visible = false;
    } else {
      let optionIndex = -1;

      selected = selected.slice(0);

      selected.forEach((item, index) => {
        if (item === option || item.props.value === option.props.value) {
          optionIndex = index;
        }
      });

      if (optionIndex > -1) {
        selected.splice(optionIndex, 1);
      } else {
        selected.push(option);
      }
    }

    this.setState({ selected, selectedLabel }, () => {
      if (!multiple) {
        this.onSelectedChange(this.state.selected);
      }

      this.setState({ visible });
    });

    if (!this.isNormalDropdown) {
      this.setState({ isFocus: false, isDirty: false });
    }
  }

  onMouseDown(event) {
    event.preventDefault();

    if (this.refs.input) {
      this.refs.input.focus();
    }

    this.handleClickSelect();
  }

  onMouseEnter() {
    this.setState({
      inputHovering: true
    })
  }

  onMouseLeave() {
    this.setState({
      inputHovering: false
    })
  }

  handleClickSelect = () => {
    if (this.isNormalDropdown) {
      this.toggleMenu();
    } else {
      // 输入才展示下拉框逻辑
      this.setState({ isFocus: true }, () => {
        const { multiple } = this.props;
        if (multiple) {
          this.refs.input.focus();
        } else {
          this.refs.reference.focus();
        }
      });
    }
  }

  // 输入才展示下拉框逻辑
  handleAfterFilterMenuState(props, state) {
    const { multiple } = props;
    const { isFocus, visible, isDirty, selectedLabel } = state;
    if (!this.isNormalDropdown && isFocus) {
      if (multiple) {
        if (!visible) {
          this.refs.input.focus();
          if (isDirty) {
            if (selectedLabel) {
              this.toggleMenu(true);
            }
          }
        } else if (isDirty && !selectedLabel) {
          this.toggleMenu(false);
        }
      } else {
        if (!visible) {
          this.refs.reference.focus();
          if (isDirty) {
            if (selectedLabel) {
              this.toggleMenu(true);
            }
          }
        } else if (isDirty && !selectedLabel) {
          this.toggleMenu(false);
        }
      }
    }
  }

  dealWithScroll(isScrolling) {
    this.isScrolling = isScrolling;
  }

  handleScroll = () => {
    // 在滚动下拉框的时候，更新控制变量isScrolling
    // 滚动时为true，滚动结束为false
    return !this.isScrolling ? this.dealWithScroll(true) : this.dealWithScrollDebounce(false);
  };

  renderOption(child) {
    const { showOverflowTooltip } = this.props;

    return React.cloneElement(child, {
      ...child.props,
      showOverflowTooltip,
    });
  }

  currentLabel = option => {
    const { label, value } = option.props;
    return label || ((typeof value === 'string' || typeof value === 'number') ? value : '');
  }

  filterOption = (option) => {
    const { query, value } = this.state;
    const { hidden } = option.props;
    // query 里如果有正则中的特殊字符，需要先将这些字符转义
    const parsedQuery = query.replace(/(\^|\(|\)|\[|\]|\$|\*|\+|\.|\?|\\|\{|\}|\|)/g, '\\$1');
    const visible = new RegExp(parsedQuery, 'i').test(this.currentLabel(option));
    return (query && query !== value) ? (visible && !hidden) : !hidden;
  }

  renderOptions = () => {
    const { showOverflowTooltip, children } = this.props;

    const options = Children.toArray(children);

    const filteredOptions = this.isLazyFilterableNoMethod
      ? options.filter(option => this.filterOption(option))
      : options;

    const renderedOption = showOverflowTooltip
      ? filteredOptions.map(child => this.renderOption(child))
      : filteredOptions;

    return renderedOption;
  }

  shouldRenderLazyItem = (lazyItem) => {
    const { value, multiple } = this.props;
    return !multiple
      ? lazyItem.props.value === value
      : (value && value.includes(lazyItem.props.value));
  }

  renderLazyList = () => {
    const { children } = this.props;
    return (
      <LazyList
        key={React.Children.toArray(children).length}
        ref={this.lazyListRef}
        renderItemSize={36}
        shouldRenderItem={this.shouldRenderLazyItem}
      >
        {this.renderOptions()}
      </LazyList>
    );
  }

  render() {
    const { multiple, size, disabled, filterable, loading, prefixIcon, warningMsg, isShowMenu, isLazy } = this.props;
    const { selected, inputWidth, inputLength, query, selectedLabel, visible, options, filteredOptionsCount, currentPlaceholder } = this.state;
    const { handleScroll } = this;

    return (
      <div ref="root" style={this.style()} className={this.className('el-select', visible && 'is-open')}>
        {
          multiple && (
            <div ref="tags" className="el-select__tags" onClick={this.handleClickSelect} style={{
              maxWidth: inputWidth - 32
            }}>
              {
                selected.map(el => {
                  return (
                    <Tag
                      type="primary"
                      key={el.props.value}
                      hit={el.hitState}
                      closable={!disabled}
                      closeTransition={true}
                      onClose={this.deleteTag.bind(this, el)}
                      icon={el.props.icon}
                      onIconClick={el.props.onIconClick}
                    >
                      <span className="el-select__tags-text">{el.currentLabel()}</span>
                    </Tag>
                  )
                })
              }
              {
                filterable && (
                  <input
                    ref="input"
                    type="text"
                    className={this.classNames('el-select__input', size && `is-${size}`)}
                    style={{ width: inputLength, maxWidth: inputWidth - 42 }}
                    disabled={disabled}
                    defaultValue={query}
                    onKeyUp={this.managePlaceholder.bind(this)}
                    onKeyDown={e => {
                      this.resetInputState(e);

                      switch (e.keyCode) {
                        case 27:
                          this.setState({ visible: false });
                          e.preventDefault();
                          break;
                        case 8:
                          this.deletePrevTag(e);
                          break;
                        case 13:
                          this.selectOption();
                          e.preventDefault();
                          break;
                        case 38:
                          this.navigateOptions('prev');
                          e.preventDefault();
                          break;
                        case 40:
                          this.navigateOptions('next');
                          e.preventDefault();
                          break;
                        default:
                          break;
                      }
                    }}
                    onChange={this.handleFilterMultiple}
                  />
                )
              }
            </div>
          )
        }
        <Input
          ref="reference"
          value={selectedLabel}
          type="text"
          placeholder={currentPlaceholder}
          name="name"
          size={size}
          disabled={disabled}
          readOnly={!filterable || multiple}
          prefixIcon={prefixIcon}
          suffixIcon={this.iconClass() || undefined}
          onChange={this.handleFilter}
          onSuffixIconClick={this.handleIconClick.bind(this)}
          onMouseDown={this.onMouseDown.bind(this)}
          onMouseEnter={this.onMouseEnter.bind(this)}
          onMouseLeave={this.onMouseLeave.bind(this)}
          onKeyUp={this.debouncedOnInputChange.bind(this)}
          onKeyDown={e => {
            switch (e.keyCode) {
              case 9:
              case 27:
                this.setState({ visible: false });
                e.preventDefault();
                break;
              case 13:
                this.selectOption();
                e.preventDefault();
                break;
              case 38:
                this.navigateOptions('prev');
                e.preventDefault();
                break;
              case 40:
                this.navigateOptions('next');
                e.preventDefault();
                break;
              default:
                break;
            }
          }}
        />
        <Transition
          name="el-zoom-in-top"
          onEnter={this.onEnter}
          onAfterEnter={this.onAfterEnter}
          onAfterLeave={this.onAfterLeave}
        >
          <View show={visible && this.emptyText() !== false && isShowMenu}>
            <div
              ref="popper"
              className={this.classNames('el-select-dropdown', { 'is-multiple': multiple })}
              style={{ minWidth: inputWidth }}
            >
              <View show={options.length > 0 && filteredOptionsCount > 0 && !loading}>
                <Scrollbar
                  ref={this.scrollRef}
                  viewComponent="ul"
                  wrapClass="el-select-dropdown__wrap"
                  viewClass="el-select-dropdown__list"
                  onScroll={handleScroll}
                >
                  { warningMsg && filteredOptionsCount > 0 &&
                    <div className="el-select-dropdown__warning"><span>{warningMsg}</span></div>
                  }
                  {!isLazy
                    ? this.renderOptions()
                    : this.renderLazyList()}
                </Scrollbar>
              </View>
              {this.emptyText() && <p className="el-select-dropdown__empty">{this.emptyText()}</p>}
            </div>
          </View>
        </Transition>
      </div>
    )
  }
}

Select.defaultProps = {
  showOverflowTooltip: false,
  debounceMs: 300,
  isShowOptionsAfterFilter: false,
  isShowMenu: true,
  isLazy: false,
};

Select.childContextTypes = {
  component: PropTypes.any
};

Select.contextTypes = {
  form: PropTypes.any
};

Select.propTypes = {
  value: PropTypes.any,
  size: PropTypes.string,
  disabled: PropTypes.bool,
  clearable: PropTypes.bool,
  filterable: PropTypes.bool,
  loading: PropTypes.bool,
  remote: PropTypes.bool,
  debounceMs: PropTypes.number,
  remoteMethod: PropTypes.func,
  filterMethod: PropTypes.func,
  multiple: PropTypes.bool,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  onVisibleChange: PropTypes.func,
  onRemoveTag: PropTypes.func,
  onClear: PropTypes.func,
  prefixIcon: PropTypes.string,
  warningMsg: PropTypes.string,
  showOverflowTooltip: PropTypes.bool,
  noMatchText: PropTypes.string,
  noDataText: PropTypes.string,
  positionFixed: PropTypes.bool,
  popperProps: PropTypes.object,
  isShowOptionsAfterFilter: PropTypes.bool,
  isShowMenu: PropTypes.bool,
  isLazy: PropTypes.bool,
}

export default ClickOutside(Select);
