import ExtendableError from 'es6-error'

export class DomainError extends ExtendableError {
  constructor(message, payload) {
    super(message)
    this.payload = payload
  }
}

export class ValidationError extends ExtendableError {
  constructor(message, errors, object) {
    super(message)
    this.errors = errors
    this.object = object
  }
}

export class InternalError extends ExtendableError {
  constructor(message, payload) {
    super(message)
    this.payload = payload
  }
}

export function only(SpecificError, handler) {
  return function onlyHandler(error) {
    if (error instanceof SpecificError) {
      return handler(error)
    }
    throw error
  }
}
