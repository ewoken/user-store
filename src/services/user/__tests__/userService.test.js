// TODO factorize
import { omit } from 'ramda';
import MailDev from 'maildev';
import config from 'config';

import { assertTest } from '@ewoken/backend-common/lib/assertSchema';

import buildEnvironment from '../../../environment';
import UserService from '../index';
import TokenService from '../../token';
import EmailService from '../../email';
import { signedUp, loggedIn, loggedOut, updated } from '../events';
import { User } from '../types';
import Context from '../../../utils/Context';

const f = omit(['createdAt']);

let maildev;
let environment;
let userService;
let userServiceEvents;
beforeAll(async () => {
  maildev = new MailDev({
    smtp: config.get('environment.mailer.options.port'),
    silent: true,
  });
  await new Promise((resolve, reject) =>
    maildev.listen(err => {
      if (err) {
        reject(err);
      }
      resolve();
    }),
  );

  environment = await buildEnvironment();
  userService = new UserService(environment);
  const services = {
    emailService: new EmailService(environment),
    tokenService: new TokenService(environment),
  };
  await userService.init(services);
  await services.tokenService.init(services);
  await services.emailService.init(services);

  userService.onEvent(event => {
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
  await new Promise(resolve => maildev.close(resolve));
  environment.close();
});

describe('userService', () => {
  describe('.signUp(newUser, context)', () => {
    const context = new Context();
    test('should sign up an user', async () => {
      const newUser = {
        email: 'plop@plop.com',
        password: 'ploploploploploploploplop',
      };

      const insertedUser = await userService.signUp(newUser, context);
      assertTest(User, insertedUser);
      expect(insertedUser.email).toEqual(newUser.email);

      const returnedUser = await userService.getUser(
        insertedUser.id,
        new Context({ user: insertedUser }),
      );
      expect(returnedUser).toEqual(insertedUser);
      expect(userServiceEvents).toMatchObject([signedUp(insertedUser)]);
    });

    test('should fail for a bad user', async () => {
      const badUser = {
        email: 'plop@plop.com',
        password: '',
      };
      await expect(userService.signUp(badUser, context)).rejects.toThrow(
        /Validation/,
      );
    });

    test('should fail for an existing email', async () => {
      const newUser = {
        email: 'plop@plop.com',
        password: 'helloworld',
      };
      await userService.signUp(newUser, context);
      await expect(userService.signUp(newUser, context)).rejects.toThrow(
        /plop@plop.com/,
      );
    });

    test('should fail if already logged', async () => {
      const newUser = {
        id: '1',
        email: 'plop@plop.com',
        createdAt: '2018-01-01T00:00:00.000Z',
        updatedAt: '2018-01-01T00:00:00.000Z',
      };
      const context2 = new Context({ user: newUser });
      await expect(
        userService.signUp(
          { email: newUser.email, password: '1234567' },
          context2,
        ),
      ).rejects.toThrow(/logged/);
    });
  });

  describe('.logIn(credentials, context)', () => {
    const testCredentials = {
      email: 'plop@plop.com',
      password: 'azertyuiop',
    };
    const context = new Context();
    let testUser;

    beforeEach(async () => {
      testUser = await userService.signUp(testCredentials, context);
    });

    test('should log in a user with good credentials', async () => {
      const loggedUser = await userService.logIn(testCredentials, context);
      assertTest(User, loggedUser);
      expect(loggedUser.email).toEqual(testCredentials.email);
      expect(userServiceEvents).toMatchObject([
        f(signedUp(loggedUser)),
        f(loggedIn(loggedUser)),
      ]);
    });

    test('should fail with bad email', async () => {
      const credentials = { email: 'plopp@plop.com', password: 'azertyuiop' };
      await expect(userService.logIn(credentials, context)).rejects.toThrow(
        /Bad credentials/,
      );
    });

    test('should fail with bad password', async () => {
      const credentials = { email: 'plop@plop.com', password: 'azertyuiopm' };
      await expect(userService.logIn(credentials, context)).rejects.toThrow(
        /Bad credentials/,
      );
    });

    test('should fail if logged', async () => {
      const context2 = new Context({ user: testUser });
      await expect(userService.logIn(testUser, context2)).rejects.toThrow(
        /logged/,
      );
    });
  });

  describe('.logInWithToken(token, context)', () => {
    const credentials = { email: 'plop@plop.com', password: 'azertyuiop' };
    const context = new Context();
    let currentUser;
    let token;

    beforeEach(async () => {
      currentUser = await userService.signUp(credentials, context);
      token = await userService.generateAuthToken(currentUser.id);
    });

    test('should log in with a valid auth token', async () => {
      const loggedUser = await userService.logInWithToken({ token }, context);
      expect(loggedUser.id).toEqual(currentUser.id);
    });

    test('should return logged user if logged and discard token', async () => {
      const loggedUser = await userService.logIn(credentials, context);
      const loggedUser2 = await userService.logInWithToken({ token }, context);
      expect(loggedUser2).toEqual(loggedUser);
      await expect(
        userService.logInWithToken({ token }, context),
      ).rejects.toThrow(/Invalid or expired token/);
    });
  });

  describe('.getCurrentUser(args, context)', () => {
    const user = {
      id: '7e9e3554-5460-4d49-a91b-277311e9bc0b',
      email: 'plop@plop.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const context = new Context({ user });

    test('should return the logged user', async () => {
      const loggedUser = await userService.getCurrentUser({}, context);
      expect(loggedUser).toEqual(user);
    });

    test('should return null if not logged', async () => {
      const loggedUser = await userService.getCurrentUser({}, new Context());
      expect(loggedUser).toEqual(null);
    });
  });

  describe('.getUser(id, context)', async () => {
    const newUser = {
      email: 'plop@plop.com',
      password: 'helloworld',
    };
    const context = new Context();
    let user;
    beforeEach(async () => {
      context.user = null;
      user = await userService.signUp(newUser, context);
      context.user = user;
    });

    test('should return a user by id', async () => {
      const returnedUser = await userService.getUser(user.id, context);
      expect(returnedUser.passwordHash).toBeUndefined();
      expect(returnedUser).toEqual(user);
    });

    test('should return null when it not exists', async () => {
      const returnedUser = await userService.getUser(
        '7e9e3554-5460-4d49-a91b-277311e9bc0b',
        context,
      );
      expect(returnedUser).toBe(null);
    });

    test('should return null when it is not authorized', async () => {
      const returnedUser = await userService.getUser(
        '7e9e3554-5460-4d49-a91b-277311e9bc0b',
        context,
      );
      expect(returnedUser).toBe(null);
    });

    test('should return null when it is not logged', async () => {
      const notLoggedContext = new Context();
      const returnedUser = await userService.getUser(
        '7e9e3554-5460-4d49-a91b-277311e9bc0b',
        notLoggedContext,
      );
      expect(returnedUser).toBe(null);
    });
  });

  describe('.update(userUpdate, context)', () => {
    const credentials = {
      email: 'plop@plop.com',
      password: 'helloworld',
    };
    const context = new Context();
    let user;
    beforeEach(async () => {
      context.user = null;
      user = await userService.signUp(credentials, context);
      context.user = user;
    });

    test('should update user informations', async () => {
      const password = 'plopaaaaaaa';
      const returnedUser = await userService.updateUser(
        {
          id: user.id,
          formerPassword: credentials.password,
          password,
        },
        context,
      );
      const loggedUser = await userService.logIn(
        { email: credentials.email, password },
        new Context(),
      );
      const updates = { passwordHash: expect.any(String) };
      expect(loggedUser).toEqual(returnedUser);
      expect(userServiceEvents).toMatchObject([
        f(signedUp(user)),
        f(updated(returnedUser, updates)),
        f(loggedIn(loggedUser)),
      ]);
    });

    test('should fail if not authorized', async () => {
      await expect(
        userService.updateUser(
          {
            id: user.id,
            formerPassword: credentials.password,
            password: '1234567',
          },
          new Context(),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('should fail when former password is wrong', async () => {
      await expect(
        userService.updateUser(
          {
            id: user.id,
            formerPassword: 'plop',
            password: 'plop',
          },
          context,
        ),
      ).rejects.toThrow(/Validation/);
    });
  });

  describe('.logOut(args, context)', () => {
    const user = {
      id: '7e9e3554-5460-4d49-a91b-277311e9bc0b',
      email: 'plop@plop.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const context = new Context({ user });

    test('should return a status OK when logged', async () => {
      const status = await userService.logOut({}, context);
      expect(status).toEqual({ logOut: true });
      expect(userServiceEvents).toMatchObject([f(loggedOut(user))]);
    });
  });

  describe('.sendResetPasswordEmail', () => {
    test('should send an email with a link to main-app', async () => {
      const context = new Context();
      const email = 'azerty@azerty.com';
      await userService.signUp({ email, password: '1234567' }, context);
      const response = await userService.sendResetPasswordEmail(
        { email },
        context,
      );
      expect(response).toEqual({ ok: true });
      const message = await new Promise(resolve =>
        maildev.on('new', emailMessage => {
          resolve(emailMessage);
        }),
      );
      expect(message.to[0].address).toEqual(email);
    });
    test('should not throw when email is not known', async () => {
      const response = await userService.sendResetPasswordEmail(
        { email: 'azerty@azerty.com' },
        new Context(),
      );
      expect(response).toEqual({ ok: true });
    });
  });

  describe('.resetPassword', () => {
    test.skip('should update user password', () => {
      throw new Error('TODO');
    });
  });
});
