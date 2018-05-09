import jwt from 'jsonwebtoken';

import { DomainError } from '@ewoken/backend-common/lib/errors';
import Context from './Context';

const INVALID_AUTHORIZATION_TOKEN = 'INVALID_AUTHORIZATION_TOKEN';

// TODO improve
export default function authorizationTokenMiddlewareFactory({ secret }) {
  return function authorizationTokenMiddleware(req, res, next) {
    const signedToken = req.headers.authorization;
    if (signedToken) {
      try {
        req.context.assertNotLogged();
        const token = jwt.verify(signedToken, secret);
        req.system = token;
        req.context = Context.fromReq(req);
        next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          next(
            new DomainError('Invalid token', INVALID_AUTHORIZATION_TOKEN, {
              token: signedToken,
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
