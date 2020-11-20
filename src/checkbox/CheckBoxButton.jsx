/* @flow */

import React from 'react';
import CheckBox from './CheckBox';

const EMPTY_FUNC = () => {};

export default class CheckboxButton extends CheckBox {
  static elementType = 'CheckboxButton';

  $checkbox: { current: null | HTMLInputElement } = React.createRef();

  render(): React.DOM {
    const group = this.context.ElCheckboxGroup;
    const checkboxButtonClass = this.className('el-checkbox-button', group.props.size ? 'el-checkbox-button--' + group.props.size : '', {
      'is-disabled': this.props.disabled,
      'is-checked': this.state.checked,
      'is-focus': this.state.focus
    });

    return (
      <label
        style={this.style()}
        className={checkboxButtonClass}
        onClick={this.handleClickLabel}>
        <input
          className="el-checkbox-button__original"
          type="checkbox"
          ref={this.$checkbox}
          checked={this.state.checked}
          disabled={this.props.disabled}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onChange={EMPTY_FUNC}
        />
        <span className="el-checkbox-button__inner" style={this.state.checked ? {
          boxShadow: '-1px 0 0 0 ' + group.props.fill,
          backgroundColor: group.props.fill || '',
          borderColor: group.props.fill || '',
          color: group.props.textColor || ''
        }: {}}>
          {this.state.label || this.props.children}
        </span>
      </label>
    )
  }
}
