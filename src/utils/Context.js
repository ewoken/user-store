import Joi from 'joi';

import { DomainError } from '@ewoken/backend-common/lib/errors';
import { assertInternal } from '@ewoken/backend-common/lib/assertSchema';

const LOGGED_ERROR = 'LOGGED_ERROR';
const UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR';
const FORBIDDEN_ERROR = 'FORBIDDEN_ERROR';

// TODO @common
export const ContextUser = Joi.object({
  id: Joi.string().required(),
  email: Joi.string().required(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
});

// TODO @common
export const ContextSystem = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().required(),
  instanceId: Joi.string().required(),
});

export const ContextInitializer = Joi.object({
  requestId: Joi.string().default(null),
  user: ContextUser,
  system: ContextSystem,
  t: Joi.func().default(i => i),
}).nand(['user', 'system']);

// TODO @common
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

  asSystem(system) {
    return new Context({
      ...this.context,
      user: null,
      system,
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
    if (!this.isAuthentified()) {
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

  isAuthentified() {
    return this.isLogged() || this.isSystem();
  }
}

export default Context;
