/* global describe, test */
import { assertInput } from '../../../utils/assertInput'
import { User } from '../types'

describe('userSchema', () => {
  const user = {
    email: 'plop@plop.com',
    password: 'ploploploploploploploplop'
  }

  test('should validate an event object', () => {
    assertInput(User, user)
  })
})
