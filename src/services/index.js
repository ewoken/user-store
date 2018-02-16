import { values } from 'ramda';

import UserService from './user';

async function initServices(environment) {
  environment.logger.info('Init services...');
  const services = {
    userService: new UserService(environment),
  };

  const serviceList = values(services);
  // TODO inject services ⚠️ logger circular references
  await Promise.all(serviceList.map(service => service.init()));

  return services;
}

export default initServices;
