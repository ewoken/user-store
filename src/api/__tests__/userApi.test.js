/* global beforeAll, afterAll, beforeEach, describe, test, expect */
import fetchApi, { clearCookies } from '@ewoken/backend-common/lib/fetchApi';
import getBaseUrl from '@ewoken/backend-common/lib/getBaseUrl';

import launchApp from '../../server';

let server;
const baseUrl = () => getBaseUrl(server);
const signUp = user =>
  fetchApi(`${baseUrl()}/users/signUp`, {
    method: 'POST',
    body: JSON.stringify(user),
    cookie: true,
  });
const logIn = credentials =>
  fetchApi(`${baseUrl()}/users/logIn`, {
    method: 'POST',
    body: JSON.stringify(credentials),
    cookie: true,
  });
const getMe = () =>
  fetchApi(`${baseUrl()}/users/me`, {
    method: 'GET',
    cookie: true,
  });
const logOut = () =>
  fetchApi(`${baseUrl()}/users/logOut`, {
    method: 'POST',
    cookie: true,
  });
const deleteAllUsers = () =>
  fetchApi(`${baseUrl()}/users`, {
    method: 'DELETE',
    cookie: true,
  });
const clearSession = () => clearCookies('localhost');

beforeAll(async () => {
  server = await launchApp();
});

beforeEach(async () => {
  await clearSession();
  await deleteAllUsers();
});

afterAll(async () => {
  await clearSession();
  await deleteAllUsers();
  return new Promise(resolve => {
    server.unref();
    server.destroy(resolve);
  });
});

const user = {
  email: 'plop@plop.com',
  password: 'helloworld',
};

describe('user api', () => {
  describe('POST /signUp', () => {
    test('should sign up a user', async () => {
      const returnedUser = await signUp(user);
      expect(returnedUser).toMatchObject({ email: user.email });
    });
  });

  describe('POST /logIn', () => {
    test('should log in a user', async () => {
      await signUp(user);
      const loggedUser = await logIn(user);
      expect(loggedUser).toMatchObject({ email: user.email });
    });
  });

  describe('GET /me', () => {
    test('should return the logged user', async () => {
      await signUp(user);
      await logIn(user);
      const loggedUser = await getMe();
      expect(loggedUser).toMatchObject({ email: user.email });
    });
  });

  describe('POST /logOut', () => {
    test('should log out', async () => {
      await signUp(user);
      await logIn(user);
      const loggedUser = await getMe();
      expect(loggedUser).toMatchObject({ email: user.email });
      const status = await logOut();
      expect(status).toEqual({ logOut: true });
    });
  });
});
