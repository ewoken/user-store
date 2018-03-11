import { DomainError } from '@ewoken/backend-common/lib/errors';
import { assertInternal } from '@ewoken/backend-common/lib/assertSchema';
import { User } from '../services/user/types';

const LOGGED_ERROR = 'LOGGED_ERROR';
const UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR';
const FORBIDDEN_ERROR = 'FORBIDDEN_ERROR';

class Context {
  constructor(initializer = {}) {
    const { requestId = null, user = null, t = i => i } = initializer;
    this.requestId = requestId;
    this.user = user;
    this.t = t;
  }

  static fromReq(req) {
    const { user, requestId, t } = req;

    if (user) {
      assertInternal(User, user);
    }

    return new Context({
      requestId,
      user,
      t,
    });
  }

  assertNotLogged() {
    if (this.user) {
      const { email } = this.user;
      throw new DomainError(`You are logged as ${email}`, LOGGED_ERROR, {
        email,
      });
    }
  }

  assertLogged() {
    if (!this.user) {
      throw new DomainError('Unauthorized', UNAUTHORIZED_ERROR);
    }
  }

  assertToBeUser(userId) {
    if (this.user.id !== userId) {
      throw new DomainError('Forbidden', FORBIDDEN_ERROR, {
        userId: this.user.id,
      });
    }
  }

  isLogged() {
    return !!this.user;
  }
}

export default Context;
