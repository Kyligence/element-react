/* @flow */

import React from 'react';
import { Component, PropTypes } from '../../libs';

type StatusType = 'wait' | 'process' | 'finish' | 'error' | 'success';

export default class Steps extends Component {
  static defaultProps = {
    direction: 'horizontal',
    finishStatus: 'finish',
    processStatus: 'process',
    active: 0
  };

  constructor(props: Object) {
    super(props);
    this.state = {
      width: 0,
    };
  }

  componentDidMount() {
    this.setStepWidth();
  }

  componentDidUpdate() {
    this.setStepWidth();
    setTimeout(() => {
      this.setLinesPosition();
    });
  }

  setStepWidth() {
    const { width: stateWidth } = this.state;
    const steps: Array<any> = Object.values(this.refs);
    const lastIcon: any = steps[steps.length - 1];
    const lastIconWidth: number = lastIcon && lastIcon.stepRef.current.offsetWidth + 1;
    const offsetLeft = Math.ceil(lastIconWidth / (steps.length - 1));
    const offsetWidth = 100 / (steps.length - 1);
    const width = `calc(${offsetWidth}% - ${offsetLeft}px)`;

    if (stateWidth !== width) {
      this.setState({ width });
    }
  }

  setLinesPosition() {
    const steps = Object.values(this.refs);
    steps.forEach((step: any, index) => {
      const nextStep: any = steps[index + 1];
      if (nextStep) {
        step.setLinePosition(nextStep.state.offsetLeft);
      }
    });
  }

  calcProgress(status: StatusType, index: number): Object {
    let step = 100;
    const style = {};
    style.transitionDelay = 150 * index + 'ms';

    const nextStatus = this.calStatus(index + 1);
    // 前后状态不一致时，并且当前status为完成，statusLine的长度才为50%
    if (nextStatus !== status) {
      if (status === this.props.finishStatus) {
        step = 100;
      } else if (['wait', 'process'].indexOf(status) !== -1) {
        step = 0;
        style.transitionDelay = -150 * index + 'ms';
      }
    }

    this.props.direction === 'vertical'
      ? (style.height = step + '%')
      : (style.width = step + '%');

    return style;
  }

  calStatus(index: number): StatusType {
    const { active, finishStatus, processStatus } = this.props;
    let status = 'wait';

    if (active > index) {
      status = finishStatus;
    } else if (active === index) {
      status = processStatus;
    }

    return status;
  }

  render(): React.DOM {
    const { children, space, direction } = this.props;
    const { width } = this.state;

    return (
      <div style={this.style()} className={this.className('el-steps')}>
        {React.Children.map(children, (child, index) => {
          const computedSpace = space
            ? `${space}px`
            : `${100 / children.length}%`;
          const style = direction === 'horizontal'
            ? { width: index === children.length - 1 ? 'auto' : width }
            : { height: index === children.length - 1 ? 'auto' : computedSpace };
          const status = this.calStatus(index);
          const lineStyle = this.calcProgress(status, index);
          return React.cloneElement(child, {
            ref: index,
            style,
            lineStyle,
            direction,
            status,
            stepNumber: index + 1
          });
        })}
      </div>
    );
  }
}

const statusMap = ['wait', 'process', 'finish', 'error', 'success'];

Steps.propTypes = {
  space: PropTypes.number,
  active: PropTypes.number,
  direction: PropTypes.oneOf(['vertical', 'horizontal']),
  finishStatus: PropTypes.oneOf(statusMap),
  processStatus: PropTypes.oneOf(statusMap)
};
