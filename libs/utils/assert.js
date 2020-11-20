import { ExtendableError } from './errors'

class ErrorConditionFailed extends ExtendableError {
  constructor(...args) {
    super(args)
  }
}

export function require_condition(condition, msg = 'pre-condition failed', warning = false) {
  if (!condition) {
    if (warning) {
      /* eslint-disable no-console */
      console.warn(new ErrorConditionFailed(msg))
    } else {
      throw new ErrorConditionFailed(msg)
    }
  }
}
