/* @flow */

import React, { Children } from 'react';
import AsyncValidator from 'async-validator';
import { Component, PropTypes, Transition, View } from '../../libs';

type State = {
  error: ?string,
  validating: boolean
};

export default class FormItem extends Component {
  state: State;

  constructor(props: Object) {
    super(props);

    this.state = {
      error: null,
      validating: false
    }
    this.fieldRef = React.createRef();
  }

  getChildContext(): Object {
    return {
      form: this
    };
  }

  getErrorString(errors: any) {
    const error = errors && errors[0].message;
    const isEmptyError = errors && Object.prototype.toString.call(errors[0].message) === '[object Error]';
    let errorString;

    if (isEmptyError) {
      errorString = '';
    } else if (error) {
      errorString = error;
    } else {
      errorString = null;
    }

    return errorString;
  }

  componentDidMount() {
    const { prop } = this.props;

    if (prop) {
      this.parent().addField(this);

      this.initialValue = this.getInitialValue();
    }
  }

  componentWillUnmount(): void {
    this.parent().removeField(this);
  }

  parent(): Component {
    return this.context.component;
  }

  isRequired(): boolean {
    let rules = this.getRules();
    let isRequired = false;

    if (rules && rules.length) {
      rules.every(rule => {
        if (rule.required) {
          isRequired = true;

          return false;
        }
        return true;
      });
    }

    return isRequired;
  }

  onFieldBlur(): void {
    this.validate('blur');
  }

  onFieldChange(): void {
    setTimeout(() => {
      this.validate('change');
    });
  }

  validate(trigger: string, cb?: Function, options: Object = {}): boolean | void {
    const rules = this.getFilteredRule(trigger);

    if (!rules || rules.length === 0) {
      if (cb instanceof Function) {
        cb();
      }

      return true;
    }

    this.setState({ validating: true });

    const descriptor = { [this.props.prop]: rules };
    const validator = new AsyncValidator(descriptor);
    const model = { [this.props.prop]: this.fieldValue() };

    validator.validate(model, { ...options, firstFields: true }, errors => {
      this.setState({
        error: this.getErrorString(errors),
        validating: false
      }, () => {
        if (cb instanceof Function) {
          cb(errors);
        }
      });
    });
  }

  clearValidation() {
    this.setState({
      error: null,
      validating: false
    });
  }

  getInitialValue(): string | void {
    const value = this.parent().props.model[this.props.prop];

    if (value === undefined) {
      return value;
    } else {
      return JSON.parse(JSON.stringify(value));
    }
  }

  resetField(): void {
    const { children } = this.props;

    Children.map(children, child => {
      // 防止FormItem.children的外部触发setState调和作用
      // 防止造成合并state，引起只更新最后一个FormItem值的现象
      setTimeout(() => {
        const { onChange, onSelect } = child.props;
        if (onChange) onChange(this.initialValue);
        if (onSelect) onSelect(this.initialValue);
        setTimeout(() => {
          this.clearValidation();
        });
      });
    });
  }

  getRules(): Array<any> {
    let formRules = this.parent().props.rules;
    let selfRuels = this.props.rules;

    formRules = formRules ? formRules[this.props.prop] : [];
    return [].concat(selfRuels || formRules || []);
  }

  getFilteredRule(trigger: string): Array<any> {
    const rules = this.getRules();

    return rules.filter(rule => {
      if (!rule.trigger || trigger === '') return true;
      if (Array.isArray(rule.trigger)) {
        return rule.trigger.indexOf(trigger) > -1;
      } else {
        return rule.trigger === trigger;
      }
    }).map(rule => Object.assign({}, rule));
  }

  labelStyle(): { width?: number | string } {
    const ret = {};

    if (this.parent().props.labelPosition === 'top') return ret;

    const labelWidth = this.props.labelWidth || this.parent().props.labelWidth;

    if (labelWidth) {
      ret.width = parseInt(labelWidth);
    }

    return ret;
  }

  contentStyle(): { marginLeft?: number | string } {
    const ret = {};

    if (this.parent().props.labelPosition === 'top' || this.parent().props.inline) return ret;

    const labelWidth = this.props.labelWidth || this.parent().props.labelWidth;

    if (labelWidth) {
      ret.marginLeft = parseInt(labelWidth);
    }

    return ret;
  }

  fieldValue(): mixed {
    const model = this.parent().props.model;
    if (!model || !this.props.prop) { return; }
    const temp = this.props.prop.split(':');
    return temp.length > 1 ? model[temp[0]][temp[1]] : model[this.props.prop];
  }

  getDomNode() {
    return this.fieldRef.current;
  }

  render(): React.DOM {
    const { error, validating } = this.state;
    const { label, required } = this.props;

    return (
      <div ref={this.fieldRef} style={this.style()} className={this.className('el-form-item', {
        'is-error': error !== null,
        'is-empty-error': error === '',
        'is-validating': validating,
        'is-required': this.isRequired() || required
      })} onBlur={this.onFieldBlur.bind(this)} onChange={this.onFieldChange.bind(this)}>
        {
          label && (
            <label className="el-form-item__label" style={this.labelStyle()}>
              {
                typeof(label) === 'string'? 
                label + this.parent().props.labelSuffix :
                label
              }
            </label>
          )
        }
        <div className="el-form-item__content" style={this.contentStyle()}>
          {this.props.children}
          <Transition name="el-zoom-in-top">
            <View show={error}>
              <div className="el-form-item__error">{error}</div>
            </View>
          </Transition>
        </div>
      </div>
    )
  }
}

FormItem.contextTypes = {
  component: PropTypes.any
};

FormItem.childContextTypes = {
  form: PropTypes.any
};

FormItem.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  labelWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  prop: PropTypes.string,
  ref: PropTypes.string,
  required: PropTypes.bool,
  rules: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
};
