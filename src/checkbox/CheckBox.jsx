/* @flow */

import React from 'react'
import { Component, PropTypes } from '../../libs'

type State = {
  checked: boolean,
  focus: boolean,
  label: string,
  hasSelection: boolean,
}

export default class Checkbox extends Component {
  static elementType = 'Checkbox';

  state: State;

  $checkbox: { current: null | HTMLInputElement } = React.createRef();

  constructor(props: Object) {
    super(props);

    this.state = {
      checked: props.checked,
      focus: props.focus,
      label: this.getLabel(props),
      hasSelection: props.hasSelection
    };
  }

  componentWillReceiveProps(nextProps: Object): void {
    const { checked: oldChecked, focus: oldFocus, hasSelection: oldHasSelection } = this.props;
    const { checked: newChecked, focus: newFocus, hasSelection: newHasSelection } = nextProps;
    const newLabel = this.getLabel(nextProps);
    const oldLabel = this.getLabel(this.props);

    if (
      oldChecked !== newChecked ||
      oldFocus !== newFocus ||
      oldHasSelection !== newHasSelection ||
      newLabel !== oldLabel
    ) {
      this.setState({
        checked: newChecked,
        focus: newFocus,
        label: newLabel,
        hasSelection: newHasSelection,
      })
    }
  }

  onFocus = () => {
    this.setState({
      focus: true
    });
  }

  onBlur = () => {
    this.setState({
      focus: false
    });
  }

  getLabel(props: Object): string {
    if (props.trueLabel || props.falseLabel) {
      return props.checked ? props.trueLabel : props.falseLabel;
    } else {
      return props.label;
    }
  }

  handleClickLabel = (e: SyntheticEvent<any>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.target) {
      const { label } = this.state;
      const { trueLabel, falseLabel} = this.props;

      let checked;
      if (this.$checkbox.current) {
        checked = !this.$checkbox.current.checked;
      }
      const group = this.context.ElCheckboxGroup;

      if (group) {
        const length = group.state.options.length + (checked ? 1 : -1);

        if (group.props.min !== undefined && length < group.props.min) {
          return;
        }

        if (group.props.max !== undefined && length > group.props.max) {
          return;
        }
      }

      let newLabel = label;

      if (this.props.trueLabel || this.props.falseLabel) {
        newLabel = checked ? trueLabel : falseLabel;
      }

      this.setState({
        checked: checked,
        label: newLabel,
      }, () => {
        if (this.props.onChange) {
          this.props.onChange(checked);
        }
      });
    }
  }

  render(): React.DOM {
    return (
      <label style={this.style()} className={this.className('el-checkbox')} onClick={this.handleClickLabel}>
        <span className={this.classNames('el-checkbox__input', {
          'is-disabled': this.props.disabled,
          'is-checked': this.state.checked,
          'is-indeterminate': this.props.indeterminate,
          'is-focus': this.state.focus,
          'has-selection': !this.state.checked && this.state.hasSelection
        })}>
          <span className="el-checkbox__inner"></span>
          <input
            className="el-checkbox__original"
            type="checkbox"
            ref={this.$checkbox}
            checked={this.state.checked}
            disabled={this.props.disabled}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
          />
        </span>
        <span className={ this.state.checked ? "el-checkbox__label is-checked-label": "el-checkbox__label"}>
          {this.props.children || this.state.label}
        </span>
      </label>
    )
  }
}

Checkbox.contextTypes = {
  ElCheckboxGroup: PropTypes.any
};

Checkbox.propTypes = {
  label: PropTypes.string,
  trueLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  falseLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  disabled: PropTypes.bool,
  checked: PropTypes.bool,
  indeterminate: PropTypes.bool,
  focus: PropTypes.bool,
  onChange: PropTypes.func,
  hasSelection: PropTypes.bool,
};

Checkbox.defaultProps = {
  checked: false,
  focus: false,
  hasSelection: false,
};
