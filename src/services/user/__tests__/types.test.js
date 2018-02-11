/* global describe, test */
import { assertInput } from '@ewoken/backend-common/lib/assertSchema';
import { UserInput } from '../types';

describe('userSchema', () => {
  const user = {
    email: 'plop@plop.com',
    password: 'ploploploploploploploplop',
  };

  test('should validate an user input object', () => {
    assertInput(UserInput, user);
  });

  // TODO add tests of other types
});
