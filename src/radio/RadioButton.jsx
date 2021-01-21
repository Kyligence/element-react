/* @flow */

import React from 'react';
import { Component, PropTypes } from '../../libs';

import Radio from './Radio';

export default class RadioButton extends Radio {
  static elementType = 'RadioButton';

  inputRef: any = React.createRef();

  parent(): Component {
    return this.context.component;
  }

  size(): string {
    return this.parent().props.size;
  }

  isDisabled(): boolean {
    return this.props.disabled || this.parent().props.disabled;
  }

  activeStyle(): { backgroundColor: string, borderColor: string, color: string } {
    return {
      backgroundColor: this.parent().props.fill || '',
      borderColor: this.parent().props.fill || '',
      color: this.parent().props.textColor || ''
    };
  }

  render(): React.DOM {
    const { size, children, value } = this.props;
    const { checked } = this.state;
    const { inputRef } = this;

    const labelClass = this.className(
      'el-radio-button',
      size && `el-radio-button--${this.size()}`,
      checked && 'is-active'
    );

    return (
      <label style={this.style()} className={labelClass} onClick={this.handleClickCheckbox}>
        <input
          readOnly
          type="radio"
          className="el-radio-button__orig-radio"
          ref={inputRef}
          checked={checked}
          disabled={this.isDisabled()}
        />
        <span className="el-radio-button__inner" style={checked ? this.activeStyle() : {}}>
          {children || value}
        </span>
      </label>
    )
  }
}

RadioButton.contextTypes = {
  component: PropTypes.any
};

RadioButton.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  disabled: PropTypes.bool,
  name: PropTypes.string
};
