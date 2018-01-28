import config from 'config'
import express from 'express'
import uuid from 'uuid'

// middlewares
import bodyParser from 'body-parser'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import passport from 'passport'
import passportLocal from 'passport-local'
import session from 'express-session'
import configRedisStore from 'connect-redis'

import { errorHandlerMiddleware, logRequestMiddleware } from './utils/customMiddleWares'

import initServices from './services'
import buildApi from './api'
import buildBusInterface from './bus'

const LocalStrategy = passportLocal.Strategy

async function buildApp (environment) {
  const logger = environment.logger
  const app = express()
  const services = await initServices(environment)
  const RedisStore = configRedisStore(session)
  const sessionConfig = {
    ...config.get('app.session'),
    store: new RedisStore({ client: environment.redisClient }),
    logErrors: error => logger.error(error)
  }

  app.use((req, res, next) => {
    req.requestId = uuid()
    next()
  })
  app.use(helmet())
  app.use(compression())
  app.use(cors())
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(session(sessionConfig))
  app.use(passport.initialize())
  app.use(passport.session())

  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function (req, email, password, done) {
    services.userService.logIn({ email, password }, req.user)
      .then(user => done(null, user))
      .catch(err => done(err))
  }))

  passport.serializeUser((user, cb) => {
    cb(null, user)
  })

  passport.deserializeUser((user, cb) => {
    cb(null, user)
  })

  buildApi(app, services)
  buildBusInterface(environment, services)

  app.use(errorHandlerMiddleware(logger))
  app.use(logRequestMiddleware(logger))

  return app
}

export default buildApp
