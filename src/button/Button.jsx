/* @flow */

import React from 'react';
import { Component, PropTypes } from '../../libs';

export default class Button extends Component {
  onClick(e: SyntheticEvent<any>): void {
    if (!this.props.loading) {
      this.props.onClick && this.props.onClick(e);
    }
  }

  onMouseDown = (e: SyntheticEvent<any>): void => {
    if (!this.props.loading) {
      this.props.onMouseDown && this.props.onMouseDown(e);
    }
  }

  render(): React.DOM {
    const hasContent = !!this.props.children;
    const isReactElement = !!(hasContent && this.props.children.$$typeof);
    const isReactElements = !!(hasContent && this.props.children.length);
    return (
      <button style={this.style()} className={this.className('el-button', this.props.type && `el-button--${this.props.type}`, this.props.size && `el-button--${this.props.size}`, {
          'is-disabled': this.props.disabled,
          'is-loading': this.props.loading,
          'is-plain': this.props.plain,
          'is-circle': this.props.circle,
          'is-square': this.props.square,
      })} disabled={this.props.disabled} type={this.props.nativeType} onClick={this.onClick.bind(this)} onMouseDown={this.onMouseDown}>
        { this.props.loading && <i className="el-icon-loading" /> }
        { this.props.icon && !this.props.loading && <i className={this.props.icon} /> }
        { hasContent || isReactElement || isReactElements ? (
          <span>{this.props.children}</span>
        ) : null }
      </button>
    )
  }
}

Button.propTypes = {
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  type: PropTypes.string,
  size: PropTypes.string,
  icon: PropTypes.string,
  nativeType: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  plain: PropTypes.bool,
  circle: PropTypes.bool,
  square: PropTypes.bool,
}

Button.defaultProps = {
  type: 'default',
  nativeType: 'button',
  loading: false,
  disabled: false,
  plain: false,
  circle: false,
  square: false,
};
