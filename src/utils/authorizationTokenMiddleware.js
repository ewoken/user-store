import jwt from 'jsonwebtoken';
import { omit } from 'ramda';

import { DomainError } from '@ewoken/backend-common/lib/errors';
import Context from './Context';

const INVALID_AUTHORIZATION_TOKEN = 'INVALID_AUTHORIZATION_TOKEN';

// TODO improve + @common
export default function authorizationTokenMiddlewareFactory({ secret }) {
  return function authorizationTokenMiddleware(req, res, next) {
    const token = req.headers.authorization;
    if (token) {
      try {
        req.context.assertNotLogged();
        const tokenData = omit(['iat'], jwt.verify(token, secret));
        req.system = {
          token,
          ...tokenData,
        };
        req.context = Context.fromReq(req);
        next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          next(
            new DomainError('Invalid token', INVALID_AUTHORIZATION_TOKEN, {
              token,
            }),
          );
        } else {
          throw error;
        }
      }
    } else {
      next();
    }
  };
}
