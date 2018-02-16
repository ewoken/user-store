import config from 'config';

import logger from '@ewoken/backend-common/lib/logger';
import buildAMQPClient from './amqpClient';
import buildSequelize from './sequelize';
import buildRedisClient from './redisClient';
import i18n from './i18n';
import mailer from './mailer';

async function buildEnvironment() {
  logger.info('Building environment...');
  const amqpClient = await buildAMQPClient({
    url: config.get('environment.rabbitmq.url'),
    logger,
  });
  const sequelize = await buildSequelize({
    url: config.get('environment.mysql.url'),
    logger,
  });
  const redisClient = buildRedisClient({
    url: config.get('environment.redis.url'),
    logger,
  });

  return {
    i18n,
    logger,
    amqpClient,
    sequelize,
    redisClient,
    mailer,
    close() {
      sequelize.close();
      amqpClient.connection.close();
      redisClient.end(true);
    },
  };
}

export default buildEnvironment;
