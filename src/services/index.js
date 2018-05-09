import { values } from 'ramda';

import UserService from './user';
import TokenService from './token';
import EmailService from './email';
import FileService from './file';

async function initServices(environment) {
  environment.logger.info('Init services...');
  const services = {
    userService: new UserService(environment),
    tokenService: new TokenService(environment),
    emailService: new EmailService(environment),
    fileService: new FileService(environment),
  };

  const serviceList = values(services);
  await Promise.all(serviceList.map(service => service.init(services)));

  return services;
}

export default initServices;
