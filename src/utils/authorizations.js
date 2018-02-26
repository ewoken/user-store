import { DomainError } from '@ewoken/backend-common/lib/errors';

export function isLogged(context) {
  return !!context.user;
}

// TODO @common
export function assertNotLogged(context) {
  const { user } = context;
  if (user) {
    throw new DomainError(`You are logged as ${user.email}`, { email: user });
  }
}

// TODO @common
export function assertLogged(context) {
  const { user } = context;
  if (!user) {
    throw new DomainError('You are not logged');
  }
  // assertInternal(User, user);
}
