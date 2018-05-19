import jwt from 'jsonwebtoken';
import git from 'git-rev-sync';
import config from 'config';

const secret = config.get('api.authorizationSecret');

const identityData = {
  name: 'user-store',
  version: git.long(),
  instanceId: '1',
};

const identity = {
  ...identityData,
  token: jwt.sign(identityData, secret),
};

export default identity;
