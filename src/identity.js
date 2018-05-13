import jwt from 'jsonwebtoken';
import git from 'git-rev-sync';
import config from 'config';

const secret = config.get('api.authorizationSecret');

const userStore = {
  name: 'user-store',
  version: git.long(),
  instanceId: '1',
};

export const IDENTITY_TOKEN = jwt.sign(userStore, secret);

export default userStore;
