import assert from 'assert';
import bcrypt from 'bcrypt';

import { assertInput, format } from '@ewoken/backend-common/lib/assertSchema';
import { DomainError, only } from '@ewoken/backend-common/lib/errors';
import Service from '@ewoken/backend-common/lib/Service';

import { assertLogged, assertNotLogged } from '../../utils/authorizations';

import { signedUp, loggedIn, loggedOut, updated } from './events';
import { UserId, UserInput, Credentials, User, UserUpdate } from './types';
import UserRepository, { ExistingEmailError } from './UserRepository';

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function checkPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

class UserService extends Service {
  constructor(environment) {
    super('UserService', environment);
    this.userRepository = new UserRepository(environment);
  }

  async init() {
    await this.userRepository.init();
    return this;
  }

  /**
   * Sign up a new user
   * @param  {UserInput} newUser new user
   * @param  {User} user    current logged user
   * @return {User}         created user
   */
  async signUp(newUser, context) {
    assertNotLogged(context);
    assertInput(UserInput, newUser);

    const passwordHash = await hashPassword(newUser.password);
    const createdUser = await this.userRepository
      .createUser({
        email: newUser.email,
        passwordHash,
      })
      .catch(
        only(ExistingEmailError, error => {
          throw new DomainError(error.message, { email: newUser.email });
        }),
      );

    this.dispatch(signedUp(createdUser));
    return format(User, createdUser);
  }

  /**
   * Log a user in
   * @param  {Credentials} credentials credentials of the user
   * @param  {User} user        current logged user
   * @return {Object}             logged user
   */
  async logIn(credentials, context) {
    assertNotLogged(context);
    assertInput(Credentials, credentials);
    const { email, password } = credentials;
    const registeredUser = await this.userRepository.getUserByEmail(email, {
      withPasswordHash: true,
    });

    if (!registeredUser) {
      throw new DomainError('Bad credentials', { email });
    }
    const isPasswordOk = await checkPassword(
      password,
      registeredUser.passwordHash,
    );
    if (!isPasswordOk) {
      throw new DomainError('Bad credentials', { email });
    }

    this.bus.emit('event', loggedIn(registeredUser));
    return format(User, registeredUser);
  }

  async logOut(args, context) {
    assertLogged(context);
    this.dispatch(loggedOut(context.user));
    return Promise.resolve({ logOut: true });
  }

  async updateUser(userUpdate, context) {
    assertInput(UserUpdate, userUpdate);
    assertLogged(context);
    if (userUpdate.id !== context.user.id) {
      throw new DomainError('Not authorized');
    }
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
        throw new DomainError('Bad password for update', {
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
    assertLogged(context);
    return format(User, context.user);
  }

  async getUser(id, context) {
    assertInput(UserId, id);
    assertLogged(context);
    if (context.user.id === id) {
      const returnedUser = await this.userRepository.getUserById(id);
      return format(User, returnedUser);
    }
    return null;
  }

  /**
   * delete all users (for test)
   * @return {Promise}
   */
  deleteAllUsers() {
    assert(process.env.NODE_ENV === 'test'); // TODO @common
    return this.userRepository.deleteAllUsers();
  }
}

export default UserService;
