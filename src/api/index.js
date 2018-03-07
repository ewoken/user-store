import config from 'config';
import express from 'express';

// middlewares
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import passport from 'passport';
import passportLocal from 'passport-local';
import passportHttpBearer from 'passport-http-bearer';
import session from 'express-session';
import configRedisStore from 'connect-redis';

import {
  errorHandlerMiddleware,
  logRequestMiddleware,
  addRequestId,
  notFoundMiddleware,
} from '@ewoken/backend-common/lib/api/customMiddleWares';

import buildUserApi from './userApi';

function buildApi({ redisClient, logger }, { userService }) {
  const app = express();
  const RedisStore = configRedisStore(session);
  const sessionConfig = {
    ...config.get('api.session'),
    store: new RedisStore({ client: redisClient }),
    logErrors: error => logger.error(error),
  };

  app.use(addRequestId());
  app.use(helmet());
  app.use(compression());
  app.use(cors(config.get('api.cors')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  const LocalStrategy = passportLocal.Strategy;
  const BearerStrategy = passportHttpBearer.Strategy;
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      (req, email, password, done) => {
        userService
          .logIn(
            { email, password },
            { user: req.user, requestId: req.requestId },
          )
          .then(user => done(null, user))
          .catch(err => done(err));
      },
    ),
  );
  passport.use(
    new BearerStrategy({ passReqToCallback: true }, (req, token, done) => {
      userService
        .logInWithToken(token, { user: req.user, requestId: req.requestId })
        .then(user => done(null, user))
        .catch(err => done(err));
    }),
  );

  passport.serializeUser((user, cb) => {
    cb(null, user);
  });

  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });

  app.use('/users', buildUserApi(userService));

  app.use(notFoundMiddleware());
  app.use(errorHandlerMiddleware(logger));
  app.use(logRequestMiddleware(logger));

  return app;
}

export default buildApi;
