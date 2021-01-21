import * as React from 'react'
import { InputNumber } from 'kyligence-ui-react'
import { InputNumber as InputNumberNext } from 'kyligence-ui-react/next'

class Component extends React.Component<{}, {}> {
  onChange = (value) => { }
  render() {
    return (
      <div>
        <InputNumber className="className" style={{ width: 100 }} />
        <InputNumber size="large" step="1" max="10" min="1" />
        <InputNumber defaultValue={2} value={3} step={1} max={10} min={1} disabled={true} controls={true} size="small" onChange={this.onChange} />

        <InputNumberNext className="className" style={{ width: 100 }} />
        <InputNumberNext size="large" step="1" max="10" min="1" />
        <InputNumberNext defaultValue={2} value={3} step={1} max={10} min={1} disabled={true} controls={true} size="small" onChange={this.onChange} />
      </div>
    )
  }
}
