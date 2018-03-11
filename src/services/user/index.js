import assert from 'assert';
import bcrypt from 'bcrypt';
import { DateTime } from 'luxon';

import { assertInput, format } from '@ewoken/backend-common/lib/assertSchema';
import { DomainError, only } from '@ewoken/backend-common/lib/errors';
import Service from '@ewoken/backend-common/lib/Service';

import { signedUp, loggedIn, loggedOut, updated } from './events';
import { UserId, UserInput, Credentials, User, UserUpdate } from './types';
import UserRepository, { ExistingEmailError } from './UserRepository';

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function checkPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

const EXISTING_EMAIL = 'EXISTING_EMAIL';
const BAD_CREDENTIALS = 'BAD_CREDENTIALS';
const BAD_PASSWORD = 'BAD_PASSWORD';

const AUTH_TOKEN_TYPE = 'AUTH_TOKEN_TYPE';

const omitPasswordLog = (arg0, ...args) => [
  {
    ...arg0,
    password: arg0.password ? '*********' : undefined,
    formerPassword: arg0.formerPassword ? '*******' : undefined,
  },
  ...args,
];

class UserService extends Service {
  constructor(environment) {
    const logConfig = {
      signUp: omitPasswordLog,
      logIn: omitPasswordLog,
      updateUser: omitPasswordLog,
    };
    super('UserService', environment, logConfig);
    this.userRepository = new UserRepository(environment);
    this.emailService = null;
    this.tokenService = null;
  }

  async init({ emailService, tokenService }) {
    this.emailService = emailService;
    this.tokenService = tokenService;
    await this.userRepository.init();
    return this;
  }

  async signUp(newUser, context) {
    context.assertNotLogged();
    assertInput(UserInput, newUser);

    const passwordHash = await hashPassword(newUser.password);
    const createdUser = await this.userRepository
      .createUser({
        email: newUser.email,
        passwordHash,
      })
      .catch(
        only(ExistingEmailError, error => {
          throw new DomainError(error.message, EXISTING_EMAIL, {
            email: newUser.email,
          });
        }),
      );

    this.dispatch(signedUp(createdUser));
    return format(User, createdUser);
  }

  async logIn(credentials, context) {
    context.assertNotLogged();
    assertInput(Credentials, credentials);
    const { email, password } = credentials;
    const registeredUser = await this.userRepository.getUserByEmail(email, {
      withPasswordHash: true,
    });

    if (!registeredUser) {
      throw new DomainError('Bad credentials', BAD_CREDENTIALS, { email });
    }
    const isPasswordOk = await checkPassword(
      password,
      registeredUser.passwordHash,
    );
    if (!isPasswordOk) {
      throw new DomainError('Bad credentials', BAD_CREDENTIALS, { email });
    }

    this.dispatch(loggedIn(registeredUser));
    return format(User, registeredUser);
  }

  async logInWithToken(token, context) {
    if (context.isLogged()) {
      await this.tokenService.deleteToken(token);
      return this.getCurrentUser(null, context);
    }

    const tokenObject = await this.tokenService.consumeToken(
      { token, expectedType: AUTH_TOKEN_TYPE },
      context,
    );
    const loggedUser = await this.userRepository.getUserById(
      tokenObject.userId,
    );

    this.dispatch(loggedIn(loggedUser));
    return format(User, loggedUser);
  }

  async logOut(args, context) {
    context.assertLogged();
    this.dispatch(loggedOut(context.user));
    return Promise.resolve({ logOut: true });
  }

  async updateUser(userUpdate, context) {
    assertInput(UserUpdate, userUpdate);
    context.assertLogged();
    context.assertToBeUser(userUpdate.id);
    const {
      userUpdated,
      updates,
    } = await this.userRepository.withinTransaction(async transaction => {
      const userToUpdate = await this.userRepository.getUserById(
        userUpdate.id,
        {
          transaction,
          withPasswordHash: true,
        },
      );

      const isPasswordOk = await checkPassword(
        userUpdate.formerPassword,
        userToUpdate.passwordHash,
      );
      if (!isPasswordOk) {
        throw new DomainError('Bad password for update', BAD_PASSWORD, {
          id: userUpdate.id,
        });
      }
      const passwordHash = await hashPassword(userUpdate.password);
      const newAttributes = { passwordHash };
      const newUser = await this.userRepository.updateUser(
        userToUpdate.id,
        {
          passwordHash,
        },
        { transaction },
      );

      return { userUpdated: newUser, updates: newAttributes };
    });

    this.dispatch(updated(userUpdated, updates));
    return format(User, userUpdated);
  }

  // eslint-disable-next-line class-methods-use-this
  async getCurrentUser(args, context) {
    if (context.isLogged()) {
      return format(User, context.user);
    }
    return null;
  }

  async getUser(id, context) {
    assertInput(UserId, id);
    if (context.isLogged() && context.user.id === id) {
      const returnedUser = await this.userRepository.getUserById(id);
      return format(User, returnedUser);
    }
    return null;
  }

  async generateAuthToken(userId, context) {
    // TODO authorizations
    const token = await this.tokenService.createToken(
      {
        userId,
        type: AUTH_TOKEN_TYPE,
        expiredAt: DateTime.local()
          .plus({ days: 1 })
          .toJSDate(),
      },
      context,
    );
    return token;
  }
  // async validateEmail(token, context) {}
  // async sendEmailValidation(user, context) {}
  // async sendResetPasswordEmail(userId, context) {}
  // async resetPassword(input, context) {}

  /**
   * delete all users (for test)
   * @return {Promise}
   */
  deleteAllUsers() {
    assert(process.env.NODE_ENV === 'test');
    return this.userRepository.deleteAllUsers();
  }
}

export default UserService;
