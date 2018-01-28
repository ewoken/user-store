import { ValidationError, InternalError } from './errors'

export function assertInput (schema, inputValue) {
  const { error, value } = schema.validate(inputValue)
  if (error) {
    throw new ValidationError(error.message, error.details, error._object)
  }
  return value
}

export function assertInternal (schema, object) {
  const { error, value } = schema.validate(object)
  if (error) {
    throw new InternalError(error.message, { errors: error.details, object })
  }
  return value
}
