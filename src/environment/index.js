import config from 'config';

import logger from '@ewoken/backend-common/lib/logger';
import buildAMQPClient from './amqpClient';
import buildSequelize from './sequelize';
import buildRedisClient from './redisClient';

async function buildEnvironment() {
  logger.info('Building environment...');
  const amqpClient = await buildAMQPClient({
    url: config.get('rabbitmq.url'),
    logger,
  });
  const sequelize = await buildSequelize(config.get('mysql.url'));
  const redisClient = buildRedisClient({
    url: config.get('redis.url'),
    logger,
  });

  return {
    logger,
    amqpClient,
    sequelize,
    redisClient,
    close() {
      sequelize.close();
      amqpClient.connection.close();
      redisClient.end(true);
    },
  };
}

export default buildEnvironment;
