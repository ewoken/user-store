import enableDestroy from 'server-destroy'
import config from 'config'

import buildEnvironment from './environment'
import initServices from './services'
import buildBusInterface from './bus'
import buildApi from './api'

import normalizePort from './utils/normalizePort'

async function launchApp() {
  const environment = await buildEnvironment()
  const services = await initServices(environment)
  await buildBusInterface(environment, services)

  const app = await buildApi(environment, services)
  const { logger } = environment
  const port = normalizePort(config.get('server.port'))

  const server = app.listen(port, () => {
    logger.info('Server is listening on', { port })
  })
  enableDestroy(server)

  server.on('close', () => {
    environment.close()
    logger.info('Server closed')
  })

  process.on('SIGINT', () => server.close())
  process.on('SIGTERM', () => server.close())

  return server
}

if (require.main === module) {
  launchApp()
}

export default launchApp
