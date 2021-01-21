/* @flow */

import React from 'react';
import { Component, PropTypes } from '../../libs';

const EMPTY_FUNC = (value: string | number, e: any) => {};

const getChecked = (props: Object): boolean => props.model == props.value || Boolean(props.checked);

type State = {
  checked: boolean,
  focus?: boolean
};

export default class Radio extends Component {
  static elementType = 'Radio';

  state: State = {
    checked: getChecked(this.props),
    focus: false,
  };

  inputRef: any = React.createRef();

  componentWillReceiveProps(props: Object) {
    const { checked: oldChecked } = this.state;
    const newChecked = getChecked(props);

    if (oldChecked !== newChecked) {
      this.setState({ checked: newChecked });
    }
  }

  onFocus = () => this.setState({ focus: true })

  onBlur = () => this.setState({ focus: false })

  handleClickCheckbox = (event: any) => {
    const { onChange = EMPTY_FUNC, value, disabled } = this.props;
    const { current: { checked: oldChecked } } = this.inputRef;
    const newCheckedIsTrue = !oldChecked;

    if (!disabled && newCheckedIsTrue) {
      onChange(value, event);
      this.setState({ checked: true });
    } else {
      event.stopPropagation();
    }
  }

  render(): React.DOM {
    const { checked, focus } = this.state;
    const { disabled, children } = this.props;
    const { inputRef } = this;

    return (
      <label style={this.style()} className={this.className('el-radio')} onClick={this.handleClickCheckbox}>
        <span className={this.classNames({
          'el-radio__input': true,
          'is-checked': checked,
          'is-disabled': disabled,
          'is-focus': focus
        })}>
          <span className="el-radio__inner"></span>
          <input
            readOnly
            type="radio"
            className="el-radio__original"
            ref={inputRef}
            checked={checked}
            disabled={disabled}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
          />
        </span>
        {children && (
          <span className={checked ? "el-radio__label is-checked-label": "el-radio__label"}>
            {children}
          </span>
        )}
      </label>
    )
  }
}

Radio.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  checked: PropTypes.bool
}
