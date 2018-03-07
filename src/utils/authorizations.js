import { DomainError } from '@ewoken/backend-common/lib/errors';
import { assertInternal } from '@ewoken/backend-common/lib/assertSchema';
import { User } from '../services/user/types';

const LOGGED_ERROR = 'LOGGED_ERROR';
const NOT_LOGGED_ERROR = 'NOT_LOGGED_ERROR';

export function isLogged(context) {
  if (context.user) {
    assertInternal(User, context.user);
    return true;
  }
  return false;
}

// TODO @common
export function assertNotLogged(context) {
  const { user } = context;
  if (user) {
    throw new DomainError(`You are logged as ${user.email}`, LOGGED_ERROR, {
      email: user.email,
    });
  }
}

// TODO @common
export function assertLogged(context) {
  const { user } = context;
  if (!user) {
    throw new DomainError('You are not logged', NOT_LOGGED_ERROR);
  }
  // assertInternal(User, user);
}
