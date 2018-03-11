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
import i18nextMiddleware from 'i18next-express-middleware';

import {
  errorHandlerMiddleware,
  logRequestMiddleware,
  addRequestIdMiddleware,
  notFoundMiddleware,
  debug as debugMiddleware,
} from '@ewoken/backend-common/lib/api/customMiddleWares';

import Context from '../utils/Context';
import buildUserApi from './userApi';

function buildApi({ redisClient, logger, i18n }, { userService }) {
  const app = express();
  const RedisStore = configRedisStore(session);
  const sessionConfig = {
    ...config.get('api.session'),
    store: new RedisStore({ client: redisClient }),
    logErrors: error => logger.error(error),
  };

  app.use(addRequestIdMiddleware());
  app.use(helmet());
  app.use(compression());
  app.use(cors(config.get('api.cors')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(i18nextMiddleware.handle(i18n));
  app.use((req, res, next) => {
    req.context = Context.fromReq(req);
    next();
  });
  app.use(debugMiddleware());

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
          .logIn({ email, password }, Context.fromReq(req))
          .then(user => done(null, user))
          .catch(err => done(err));
      },
    ),
  );
  passport.use(
    new BearerStrategy({ passReqToCallback: true }, (req, token, done) => {
      userService
        .logInWithToken(token, Context.fromReq(req))
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

  app.get('/locale', (req, res, next) => {
    res.json(req.t('locale'));
    next();
  });

  app.use(notFoundMiddleware());
  app.use(errorHandlerMiddleware(logger));
  app.use(logRequestMiddleware(logger));

  return app;
}

export default buildApi;
