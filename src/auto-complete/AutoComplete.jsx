/* @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import ClickOutside from 'kyligence-react-click-outside';
import { Component, PropTypes } from '../../libs';
import Input from '../input';
import Suggestions from './Suggestions';

type State = {
  inputValue: string,
  isFocus: boolean,
  suggestions: Array<any>,
  loading: boolean,
  highlightedIndex: number,
}

type Props = {
  popperClass: string,
  placeholder: string,
  disabled: boolean,
  name: string,
  size: string,
  value: string,
  triggerOnFocus: boolean,
  fetchSuggestions: Function,
  onSelect: Function,
  onChange: Function,
  onPrefixIconClick: Function,
  onSuffixIconClick: Function,
  prefixIcon: Element | string,
  suffixIcon: Element | string,
  append: Element,
  prepend: Element,
  onFocus: Function,
  onBlur: Function,
  popperProps: Object,
  isSelectValue: boolean,
}

type AutoCompleteDefaultProps = {
  triggerOnFocus: boolean,
};

class AutoComplete extends Component {
  props: Props;
  state: State;

  static defaultProps: AutoCompleteDefaultProps = {
    triggerOnFocus: true,
    isSelectValue: true,
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      inputValue: props.value,
      isFocus: false,
      suggestions: [],
      loading: false,
      highlightedIndex: -1
    };
  }

  getChildContext() {
    return {
      component: this
    };
  }

  componentWillReceiveProps(props: Props): void {
    this.setState({ inputValue: props.value });
  }

  componentDidUpdate(): void {
    const visible = this.suggestionVisible();
    const reference = ReactDOM.findDOMNode(this.inputNode);

    if (reference instanceof HTMLElement) {
      setTimeout(() => {
        if (this.suggestionsNode) {
          this.suggestionsNode.onVisibleChange(visible, reference.offsetWidth);
        }
      })
    }
  }

  getData(queryString: string): void {
    const { fetchSuggestions } = this.props;
    this.setState({ loading: true });

    fetchSuggestions(queryString, (suggestions: Array<any>) => {
      this.setState({ loading: false });

      if (Array.isArray(suggestions)) {
        this.setState({ suggestions });
      }
    });
  }

  handleChange(value: string): void {
    const { triggerOnFocus, onChange } = this.props;

    this.setState({ inputValue: value });

    if (!triggerOnFocus && !value) {
      this.setState({ suggestions: [] }); return;
    }

    onChange && onChange(value);

    this.getData(value);
  }

  handleFocus(e): void {
    const { onFocus, triggerOnFocus } = this.props;
    const { inputValue } = this.state;

    this.setState({ isFocus: true });
    onFocus && onFocus(e);
    triggerOnFocus && this.getData(inputValue);
  }

  handleKeyEnter(highlightedIndex: number): void {
    const { suggestions } = this.state;

    if (this.suggestionVisible() && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      this.select(suggestions[highlightedIndex]);
    }
  }

  handleClickOutside(): void {
    const { isFocus } = this.state;

    isFocus && this.setState({ isFocus: false });
  }

  select(item: Object): void {
    const { onSelect, isSelectValue } = this.props;

    if (isSelectValue) {
      this.setState({ inputValue: item.value }, () => {
        this.setState({ suggestions: [] });
      });
    } else {
      this.setState({ suggestions: [] });
    }

    onSelect && onSelect(item);
  }

  highlight(index: number): void {
    const { loading, suggestions } = this.state;

    if (!this.suggestionVisible() || loading) return;
    if (index < 0) index = 0;
    if (index >= suggestions.length) {
      index = suggestions.length - 1;
    }
    const reference = ReactDOM.findDOMNode(this.suggestionsNode);
    if (reference instanceof HTMLElement) {
      const suggestion = document.querySelector('.el-autocomplete-suggestion__wrap');
      const suggestionList = document.querySelectorAll('.el-autocomplete-suggestion__list li');
      if (suggestion instanceof HTMLElement && suggestionList instanceof NodeList) {
        let highlightItem = suggestionList[index];
        let scrollTop = suggestion.scrollTop;
        let offsetTop = highlightItem.offsetTop;

        if (offsetTop + highlightItem.scrollHeight > (scrollTop + suggestion.clientHeight)) {
          suggestion.scrollTop += highlightItem.scrollHeight;
        }

        if (offsetTop < scrollTop) {
          suggestion.scrollTop -= highlightItem.scrollHeight;
        }

        this.setState({ highlightedIndex: index });
      }
    }
  }

  /* Computed Methods */

  suggestionVisible(): boolean {
    const { suggestions, loading, isFocus } = this.state;
    const isValidData = Array.isArray(suggestions) && suggestions.length > 0;

    return (isValidData || loading) && isFocus;
  }

  onKeyDown(e: SyntheticKeyboardEvent<any>): void {
    const { highlightedIndex } = this.state;

    switch (e.keyCode) {
      case 13:
        this.handleKeyEnter(highlightedIndex);
        break;
      case 38:
        this.highlight(highlightedIndex - 1)
        break;
      case 40:
        this.highlight(highlightedIndex + 1);
        break;
      default:
        break;
    }
  }

  render(): React.DOM {
    const { disabled, placeholder, name, size, prefixIcon, suffixIcon, append, prepend, onPrefixIconClick, onSuffixIconClick, popperClass, onBlur, popperProps } = this.props;
    const { inputValue, suggestions } = this.state;

    return (
      <div style={this.style()} className={this.className('el-autocomplete')}>
        <Input
          ref={node => this.inputNode = node}
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          name={name}
          size={size}
          prefixIcon={prefixIcon}
          suffixIcon={suffixIcon}
          prepend={prepend}
          append={append}
          onPrefixIconClick={onPrefixIconClick}
          onSuffixIconClick={onSuffixIconClick}
          onChange={this.handleChange.bind(this)}
          onFocus={this.handleFocus.bind(this)}
          onBlur={onBlur}
          onKeyDown={this.onKeyDown.bind(this)}
        />
        <Suggestions
          ref={node => this.suggestionsNode = node}
          className={this.classNames(popperClass)}
          suggestions={suggestions}
          popperProps={popperProps}
        />
      </div>
    )
  }
}

AutoComplete.childContextTypes = {
  component: PropTypes.any
};

export default ClickOutside(AutoComplete);
