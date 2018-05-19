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

Context.localSystem = {
  name: 'test',
  version: 'test',
  instanceId: 'test',
  token: 'test',
};

const f = omit(['createdAt']);
const credentials = {
  email: 'test@test.org',
  password: '1234567',
};
const emptyContext = new Context();

let maildev;
let environment;
let userService;
let userServiceEvents;
let user;
let loggedContext;
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
  user = await userService.signUp(credentials, emptyContext);
  loggedContext = new Context({ user });
});

afterAll(async () => {
  // clean after all to make environment clean
  await userService.deleteAllUsers();
  await new Promise(resolve => maildev.close(resolve));
  environment.close();
});

describe('userService', () => {
  describe('.signUp(newUser, context)', () => {
    test('should sign up an user', async () => {
      assertTest(User, user);
      expect(user.email).toEqual(credentials.email);

      const returnedUser = await userService.getUser(user.id, loggedContext);
      expect(returnedUser).toEqual(user);
      expect(userServiceEvents).toMatchObject([signedUp(user)]);
    });

    test('should fail for a bad user', async () => {
      const badUser = {
        email: 'plop@plop.com',
        password: '',
      };
      await expect(userService.signUp(badUser, emptyContext)).rejects.toThrow(
        /Validation/,
      );
    });

    test('should fail for an existing email', async () => {
      const newUser = {
        email: credentials.email,
        password: 'helloworld',
      };
      await expect(userService.signUp(newUser, emptyContext)).rejects.toThrow(
        /test@test.org/,
      );
    });

    test('should fail if already logged', async () => {
      await expect(
        userService.signUp(
          { email: 'plop@plop.com', password: '1234567' },
          loggedContext,
        ),
      ).rejects.toThrow(/logged/);
    });
  });

  describe('.logIn(credentials, context)', () => {
    test('should log in a user with good credentials', async () => {
      const loggedUser = await userService.logIn(credentials, emptyContext);
      assertTest(User, loggedUser);
      expect(loggedUser.email).toEqual(credentials.email);
      expect(userServiceEvents).toMatchObject([
        f(signedUp(loggedUser)),
        f(loggedIn(loggedUser)),
      ]);
    });

    test('should fail with bad email', async () => {
      const badCredentials = { email: 'plop@plop.com', password: '1234567' };
      await expect(
        userService.logIn(badCredentials, emptyContext),
      ).rejects.toThrow(/Bad credentials/);
    });

    test('should fail with bad password', async () => {
      const badCredentials = { email: 'test@test.org', password: '123456' };
      await expect(
        userService.logIn(badCredentials, emptyContext),
      ).rejects.toThrow(/Bad credentials/);
    });

    test('should fail if logged', async () => {
      await expect(
        userService.logIn(credentials, loggedContext),
      ).rejects.toThrow(/logged/);
    });
  });

  describe('.logInWithToken(token, context)', () => {
    let token;

    beforeEach(async () => {
      token = await userService.generateAuthToken(user.id);
    });

    test('should log in with a valid auth token', async () => {
      const loggedUser = await userService.logInWithToken(
        { token },
        emptyContext,
      );
      expect(loggedUser.id).toEqual(user.id);
    });

    test('should return logged user if logged and discard token', async () => {
      const loggedUser2 = await userService.logInWithToken(
        { token },
        loggedContext,
      );
      expect(loggedUser2).toEqual(user);
      await expect(
        userService.logInWithToken({ token }, emptyContext),
      ).rejects.toThrow(/Invalid or expired token/);
    });
  });

  describe('.getCurrentUser(args, context)', () => {
    test('should return the logged user', async () => {
      const loggedUser = await userService.getCurrentUser({}, loggedContext);
      expect(loggedUser).toEqual(user);
    });

    test('should return null if not logged', async () => {
      const loggedUser = await userService.getCurrentUser({}, emptyContext);
      expect(loggedUser).toEqual(null);
    });
  });

  describe('.getUser(id, context)', async () => {
    test('should return a user by id', async () => {
      const returnedUser = await userService.getUser(user.id, loggedContext);
      expect(returnedUser.passwordHash).toBeUndefined();
      expect(returnedUser).toEqual(user);
    });

    test('should return null when it not exists', async () => {
      const returnedUser = await userService.getUser(
        '7e9e3554-5460-4d49-a91b-277311e9bc0b',
        loggedContext,
      );
      expect(returnedUser).toBe(null);
    });

    test('should return null when it is not authorized', async () => {
      const returnedUser = await userService.getUser(
        '7e9e3554-5460-4d49-a91b-277311e9bc0b',
        loggedContext,
      );
      expect(returnedUser).toBe(null);
    });

    test('should return null when it is not logged', async () => {
      const returnedUser = await userService.getUser(
        '7e9e3554-5460-4d49-a91b-277311e9bc0b',
        emptyContext,
      );
      expect(returnedUser).toBe(null);
    });
  });

  describe('.update(userUpdate, context)', () => {
    test('should update user informations', async () => {
      const password = 'plopaaaaaaa';
      const returnedUser = await userService.updateUser(
        {
          id: user.id,
          formerPassword: credentials.password,
          password,
        },
        loggedContext,
      );
      const loggedUser = await userService.logIn(
        { email: credentials.email, password },
        emptyContext,
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
          emptyContext,
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('should fail when former password is wrong', async () => {
      await expect(
        userService.updateUser(
          {
            id: user.id,
            formerPassword: 'helloworld',
            password: 'helloworld',
          },
          loggedContext,
        ),
      ).rejects.toThrow(/Bad password/);
    });
  });

  describe('.logOut(args, context)', () => {
    test('should return a status OK when logged', async () => {
      const status = await userService.logOut({}, loggedContext);
      expect(status).toEqual({ logOut: true });
      expect(userServiceEvents).toMatchObject([
        f(signedUp(user)),
        f(loggedOut(user)),
      ]);
    });
  });

  describe('.sendResetPasswordEmail', () => {
    test('should send an email with a link to main-app', async () => {
      const response = await userService.sendResetPasswordEmail(
        { email: credentials.email },
        emptyContext,
      );
      expect(response).toEqual({ ok: true });
      const message = await new Promise(resolve =>
        maildev.on('new', emailMessage => {
          resolve(emailMessage);
        }),
      );
      expect(message.to[0].address).toEqual(credentials.email);
    });
    test('should not throw when email is not known', async () => {
      const response = await userService.sendResetPasswordEmail(
        { email: 'azerty@azerty.com' },
        emptyContext,
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
