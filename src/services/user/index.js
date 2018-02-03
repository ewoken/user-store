import withLogger from '@ewoken/backend-common/lib/withLoggerService';

import userService from './userService';
import userRepository from './userRepository';

async function initUserService({ sequelize, logger }) {
  logger.info('Init user service');
  await userRepository.init(sequelize);

  return withLogger(logger)({
    serviceName: 'userService',
    service: userService,
  });
}

export default initUserService;
