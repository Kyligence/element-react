/* @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import Popper from 'popper.js';
import { Component, PropTypes, Transition, View, MountBody } from '../../libs';

type State = {
  showPopper: boolean
};

export default class DropdownMenu extends Component {
  state: State;

  constructor(props: Object) {
    super(props);

    this.state = {
      showPopper: false
    }
  }

  onVisibleChange(visible: boolean): void {
    this.setState({
      showPopper: visible
    })
  }

  onEnter = (): void => {
    const parent = ReactDOM.findDOMNode(this.parent());
    const { positionFixed } = this.props;

    this.popperJS = new Popper(parent, this.refs.popper, {
      placement: this.placement(),
      modifiers: {
        computeStyle: {
          gpuAcceleration: false
        },
        preventOverflow: {
          boundariesElement: 'window',
        }
      },
      positionFixed,
    });
  }

  onAfterLeave = (): void => {
    this.popperJS.destroy();
  }

  parent(): Component {
    return this.context.component;
  }

  placement(): string {
    return `bottom-${this.parent().props.menuAlign}`;
  }

  renderDropDownMenu(): React.DOM {
    const { showPopper } = this.state;
    const { children } = this.props;
    return (
      <Transition name="el-zoom-in-top" onEnter={this.onEnter} onAfterLeave={this.onAfterLeave}>
        <View show={showPopper}>
          <ul ref="popper" style={this.style()} className={this.className('el-dropdown-menu')}>
            {children}
          </ul>
        </View>
      </Transition>
    )
  }

  render(): React.DOM {
    const { appendToBody } = this.props;

    return appendToBody
      ? <MountBody>{this.renderDropDownMenu()}</MountBody>
      : this.renderDropDownMenu();
  }
}

DropdownMenu.contextTypes = {
  component: PropTypes.any
};

DropdownMenu.propTypes = {
  appendToBody: PropTypes.bool,
}

DropdownMenu.defaultProps = {
  appendToBody: false,
};
