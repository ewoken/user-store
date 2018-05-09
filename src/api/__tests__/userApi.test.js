import getBaseUrl from '@ewoken/backend-common/lib/getBaseUrl';

import launchApp from '../../server';
import Client from '../client';

let server;
let client;
let user;
const credentials = {
  email: 'testApi@plop.com',
  password: 'helloworld',
};

beforeAll(async () => {
  server = await launchApp();
  client = new Client(getBaseUrl(server), { cookie: true });
});

beforeEach(async () => {
  await client.clearSession();
  await client.deleteAllUsers();
  user = await client.signUp(credentials);
});

afterAll(async () => {
  await client.clearSession();
  await client.deleteAllUsers();
  return new Promise(resolve => {
    server.unref();
    server.destroy(resolve);
  });
});

describe('user api', () => {
  describe('POST /signUp', () => {
    test('should sign up a user', async () => {
      expect(user).toMatchObject({ email: user.email });
    });
  });

  describe('POST /logIn', () => {
    test('should log in a user', async () => {
      const loggedUser = await client.logIn(credentials);
      expect(loggedUser).toMatchObject({ email: user.email });
    });
  });

  describe('POST /logInWithToken', () => {
    test('should log in a user with a token', async () => {
      const token = await client.generateAuthToken(user.id);
      await client.clearSession();
      const loggedUser = await client.logInWithToken(token);
      expect(loggedUser).toEqual(user);
    });
  });

  describe('GET /me', () => {
    test('should return the logged user', async () => {
      await client.logIn(credentials);
      const loggedUser = await client.getMe();
      expect(loggedUser).toMatchObject({ email: user.email });
    });
  });

  describe('GET /:id', () => {
    test('should return the logged user', async () => {
      await client.logIn(credentials);
      const returnedUser = await client.getUser(user.id);
      expect(returnedUser).toMatchObject({ email: user.email });
    });
  });

  describe('PATCH /:id', () => {
    test('should update user', async () => {
      await client.logIn(credentials);
      const password = 'ploplop';
      await client.updateUser(user.id, {
        formerPassword: credentials.password,
        password,
      });
      await client.logOut();
      await client.logIn({ email: user.email, password });
    });
  });

  describe('POST /logOut', () => {
    test('should log out', async () => {
      await client.logIn(credentials);
      const status = await client.logOut();
      expect(status).toEqual({ logOut: true });
      const loggedUser = await client.getMe();
      expect(loggedUser).toBeNull();
    });
  });
});
