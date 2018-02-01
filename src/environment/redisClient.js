import redis from 'redis'

function buildRedisClient({ url, logger }) {
  const client = redis.createClient(url)

  client.on('error', error => {
    logger.error(error)
  })

  return client
}

export default buildRedisClient
