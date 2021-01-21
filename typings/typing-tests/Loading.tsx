import * as React from 'react'
import { Loading } from 'kyligence-ui-react'
import { Loading as LoadingNext } from 'kyligence-ui-react/next'

class Component extends React.Component<{}, {}> {
  render() {
    return (
      <div>
        <Loading className="className" style={{ width: 100 }} />
        <Loading />
        <Loading fullscreen={true} />
        <Loading text="text" />
        <Loading loading={false} />

        <LoadingNext className="className" style={{ width: 100 }} />
        <LoadingNext />
        <LoadingNext fullscreen={true} />
        <LoadingNext text="text" />
        <LoadingNext loading={false} />
      </div>
    )
  }
}
