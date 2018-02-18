import { values } from 'ramda';

import UserService from './user';

async function initServices(environment) {
  environment.logger.info('Init services...');
  const services = {
    userService: new UserService(environment),
  };

  const serviceList = values(services);
  await Promise.all(serviceList.map(service => service.init(services)));

  return services;
}

export default initServices;
