import buildUserApi from './userApi'

function buildApi (app, { userService }) {
  app.use('/user', buildUserApi(userService))
}

export default buildApi
