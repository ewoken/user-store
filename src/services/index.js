import initUserService from './user'

async function initServices(environment) {
  environment.logger.info('Init services...')
  const services = {}

  services.userService = await initUserService(environment)

  return services
}

export default initServices
