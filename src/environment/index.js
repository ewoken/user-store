import config from 'config'

import buildAMQPClient from './amqpClient'
import buildSequelize from './sequelize'
import logger from './logger'

async function buildEnvironment () {
  logger.info('Building environment...')
  const amqpClient = await buildAMQPClient(config.get('rabbitmq.url'))
  const sequelize = await buildSequelize(config.get('mysql.url'))

  return {
    amqpClient,
    sequelize,
    logger,
    close () {
      sequelize.close()
      amqpClient.connection.close()
    }
  }
}

export default buildEnvironment
