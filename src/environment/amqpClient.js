import amqp from 'amqplib'
import logger from 'winston'

async function buildAMQPClient (url) {
  const connection = await amqp.connect(url)
  const channel = await connection.createChannel()

  channel.on('error', (error) => {
    logger.error(error)
  })

  return channel
}

export default buildAMQPClient
