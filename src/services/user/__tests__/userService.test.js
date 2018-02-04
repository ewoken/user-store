/* global beforeAll afterAll describe test expect beforeEach */

import initUserService from '../index';
import buildEnvironment from '../../../environment';

let environment;
let userService;
beforeAll(async () => {
  environment = await buildEnvironment();
  userService = await initUserService(environment);
});

beforeEach(async () => {
  // clean before each test because the last one may have failed
  await userService.deleteAllUsers();
});

afterAll(async () => {
  // clean after all to make environment clean
  // await userService.deleteAllUsers();
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
      expect(insertedUser).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: newUser.email,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
      expect(insertedUser.passwordHash).toBe(undefined);
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
      const result = await userService.logIn(testUser, { user });
      expect(result).toMatchObject({ email: testUser.email });
      expect(result.passwordHash).toBe(undefined);
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      expect(user).toMatchObject({ email: user.email });
      const returnedUser = await userService.getUser(user.id, { user });
      expect(returnedUser).toEqual(user);
    });

    test('should return null when not authorized', async () => {
      const returnedUser = await userService.getUser(
        '7e9e3554-5460-4d49-a91b-277311e9bc0b',
        { user },
      );
      expect(returnedUser).toBe(null);
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
    });
  });
});
