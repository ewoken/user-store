/* global describe, test */
import { assertInput } from '../../../utils/assertInput';
import { UserInput } from '../types';

describe('userSchema', () => {
  const user = {
    email: 'plop@plop.com',
    password: 'ploploploploploploploplop',
  };

  test('should validate an event object', () => {
    assertInput(UserInput, user);
  });
});
