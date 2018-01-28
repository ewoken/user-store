import enableDestroy from 'server-destroy'
import config from 'config'

import buildEnvironment from './environment'
import buildApp from './app'

import normalizePort from './utils/normalizePort'

async function launchApp () {
  const environment = await buildEnvironment()
  const app = await buildApp(environment)
  const logger = environment.logger
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
