/* global beforeAll afterAll describe test expect beforeEach */
import { omit } from 'ramda';
import { assertTest } from '@ewoken/backend-common/lib/assertSchema';

import buildEnvironment from '../../../environment';
import initUserService from '../index';
import { signedUp, loggedIn, loggedOut, updated } from '../events';
import { User } from '../types';

const f = omit(['createdAt']); // TODO

let environment;
let userService;
let userServiceEvents;
beforeAll(async () => {
  environment = await buildEnvironment();
  userService = await initUserService(environment);
  userService.bus.on('event', event => {
    userServiceEvents.push(event);
  });
});

beforeEach(async () => {
  userServiceEvents = [];
  // clean before each test because the last one may have failed
  await userService.deleteAllUsers();
});

afterAll(async () => {
  // clean after all to make environment clean
  await userService.deleteAllUsers();
  environment.close();
});

describe('user service', () => {
  describe('signUp(newUser, { user })', () => {
    const user = null;
    test('should sign up an user', async () => {
      const newUser = {
        email: 'plop@plop.com',
        password: 'ploploploploploploploplop',
      };

      const insertedUser = await userService.signUp(newUser, { user });
      assertTest(User, insertedUser);
      expect(insertedUser.email).toEqual(newUser.email);

      const returnedUser = await userService.getUser(insertedUser.id, {
        user: insertedUser,
      });
      expect(returnedUser).toEqual(insertedUser);
      expect(userServiceEvents).toMatchObject([signedUp(insertedUser)]);
    });

    test('should fail for a bad user', async () => {
      const badUser = {
        email: 'plop@plop.com',
        password: '',
      };
      await expect(userService.signUp(badUser, { user })).rejects.toThrow(
        /password/,
      );
    });

    test('should fail for an existing email', async () => {
      const newUser = {
        email: 'plop@plop.com',
        password: 'helloworld',
      };
      await userService.signUp(newUser, { user });
      await expect(userService.signUp(newUser, { user })).rejects.toThrow(
        /plop@plop.com/,
      );
    });

    test('should fail if already logged', async () => {
      const newUser = {
        email: 'plop@plop.com',
        password: 'helloworld',
      };
      await expect(
        userService.signUp(newUser, { user: newUser }),
      ).rejects.toThrow(/logged/);
    });
  });

  describe('logIn(credentials, { user })', () => {
    const testUser = {
      email: 'plop@plop.com',
      password: 'azertyuiop',
    };
    const user = null;

    beforeEach(() => userService.signUp(testUser, { user }));

    test('should log in a user with good credentials', async () => {
      const loggedUser = await userService.logIn(testUser, { user });
      assertTest(User, loggedUser);
      expect(loggedUser.email).toEqual(testUser.email);
      expect(userServiceEvents).toMatchObject([
        f(signedUp(loggedUser)),
        f(loggedIn(loggedUser)),
      ]);
    });

    test('should fail with bad email', async () => {
      const credentials = { email: 'plopp@plop.com', password: 'azertyuiop' };
      await expect(userService.logIn(credentials, { user })).rejects.toThrow(
        /Bad credentials/,
      );
    });

    test('should fail with bad password', async () => {
      const credentials = { email: 'plop@plop.com', password: 'azertyuiopm' };
      await expect(userService.logIn(credentials, { user })).rejects.toThrow(
        /Bad credentials/,
      );
    });

    test('should fail if logged', async () => {
      await expect(
        userService.logIn(testUser, { user: testUser }),
      ).rejects.toThrow(/logged/);
    });
  });

  describe('getCurrentUser(args, { user })', () => {
    const user = {
      id: '7e9e3554-5460-4d49-a91b-277311e9bc0b',
      email: 'plop@plop.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    test('should return the logged user', async () => {
      const loggedUser = await userService.getCurrentUser({}, { user });
      expect(loggedUser).toEqual(user);
    });
  });

  describe('getUser(id, { user })', async () => {
    const newUser = {
      email: 'plop@plop.com',
      password: 'helloworld',
    };
    let user;
    beforeEach(async () => {
      user = await userService.signUp(newUser, { user: null });
    });

    test('should return a user by id', async () => {
      const returnedUser = await userService.getUser(user.id, { user });
      expect(returnedUser.passwordHash).toBeUndefined();
      expect(returnedUser).toEqual(user);
    });

    test('should return null when it not exists', async () => {
      const returnedUser = await userService.getUser(
        '7e9e3554-5460-4d49-a91b-277311e9bc0b',
        { user },
      );
      expect(returnedUser).toBe(null);
    });

    test('should return null when it is not authorized', async () => {
      const returnedUser = await userService.getUser(
        '7e9e3554-5460-4d49-a91b-277311e9bc0b',
        { user },
      );
      expect(returnedUser).toBe(null);
    });
  });

  describe('update(userUpdate, { user })', () => {
    const credentials = {
      email: 'plop@plop.com',
      password: 'helloworld',
    };
    let user;
    beforeEach(async () => {
      user = await userService.signUp(credentials, { user: null });
    });

    test('should update user informations', async () => {
      const password = 'plopaaaaaaa';
      const returnedUser = await userService.updateUser(
        {
          id: user.id,
          formerPassword: credentials.password,
          password,
        },
        { user },
      );
      const loggedUser = await userService.logIn(
        { email: credentials.email, password },
        { user: null },
      );
      const updates = { passwordHash: expect.any(String) };
      expect(loggedUser).toEqual(returnedUser);
      expect(userServiceEvents).toMatchObject([
        f(signedUp(user)),
        f(updated(returnedUser, updates)),
        f(loggedIn(loggedUser)),
      ]);
    });

    test('should fail when former password is wrong', async () => {
      await expect(
        userService.updateUser(
          {
            id: user.id,
            formerPassword: 'plop',
            password: 'plop',
          },
          { user },
        ),
      ).rejects.toThrow(/password/);
    });
  });

  describe('logOut(args, { user })', () => {
    const user = {
      id: '7e9e3554-5460-4d49-a91b-277311e9bc0b',
      email: 'plop@plop.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    test('should return a status OK when logged', async () => {
      const status = await userService.logOut({}, { user });
      expect(status).toEqual({ logOut: true });
      expect(userServiceEvents).toMatchObject([f(loggedOut(user))]);
    });
  });
});
