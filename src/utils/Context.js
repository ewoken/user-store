import Joi from 'joi';

import { DomainError } from '@ewoken/backend-common/lib/errors';
import { assertInternal } from '@ewoken/backend-common/lib/assertSchema';
import { User } from '../services/user/types';

const LOGGED_ERROR = 'LOGGED_ERROR';
const UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR';
const FORBIDDEN_ERROR = 'FORBIDDEN_ERROR';

export const ContextInitializer = Joi.object({
  requestId: Joi.string().default(null),
  user: User,
  system: Joi.object(),
  t: Joi.func().default(i => i),
}).nand(['user', 'system']);

class Context {
  constructor(initializer = {}) {
    const { requestId, user = null, system = null, t } = assertInternal(
      ContextInitializer,
      initializer,
    );

    this.requestId = requestId;
    this.user = user;
    this.system = system;
    this.t = t;
  }

  static fromReq(req) {
    const { user, requestId, system, t } = req;

    return new Context({
      requestId,
      user,
      system,
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
    this.assertLogged();
    if (this.user.id !== userId) {
      throw new DomainError('Forbidden', FORBIDDEN_ERROR, {
        userId: this.user.id,
      });
    }
  }

  assertAuthentified() {
    if (!this.user && !this.system) {
      throw new DomainError('Unauthorized', UNAUTHORIZED_ERROR);
    }
  }

  assertIsSystem() {
    if (this.user) {
      throw new DomainError('Forbidden', FORBIDDEN_ERROR, {
        userId: this.user.id,
      });
    } else if (!this.system) {
      throw new DomainError('Unauthorized', UNAUTHORIZED_ERROR);
    }
  }

  isLogged() {
    return !!this.user;
  }

  isSystem() {
    return !!this.system;
  }
}

export default Context;
