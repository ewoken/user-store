import amqp from 'amqplib'

// TODO @common
async function buildAMQPClient({ url, logger }) {
  const connection = await amqp.connect(url)
  const channel = await connection.createChannel()

  channel.on('error', error => {
    logger.error(error)
  })

  return channel
}

export default buildAMQPClient
