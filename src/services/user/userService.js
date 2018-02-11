import assert from 'assert';
import { EventEmitter } from 'events';
import bcrypt from 'bcrypt';

import {
  assertInput,
  assertInternal,
  format,
} from '@ewoken/backend-common/lib/assertSchema';
import { DomainError, only } from '@ewoken/backend-common/lib/errors';

import { signedUp, loggedIn, loggedOut, updated } from './events';
import { UserId, UserInput, Credentials, User, UserUpdate } from './types';
import userRepository, { ExistingEmailError } from './userRepository';

// TODO maybe in ./events
const bus = new EventEmitter();
function dispatch(event) {
  bus.emit('event', event);
}

function assertNotLogged(user) {
  // TODO @common
  if (user) {
    throw new DomainError(`You are logged as ${user.email}`, { email: user });
  }
}
function assertLogged(user) {
  // TODO @common
  if (user) {
    assertInternal(User, user);
    return;
  }
  throw new DomainError('You are not logged');
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function checkPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Sign up a new user
 * @param  {UserInput} newUser new user
 * @param  {User} user    current logged user
 * @return {User}         created user
 */
async function signUp(newUser, { user }) {
  assertNotLogged(user);
  assertInput(UserInput, newUser);

  const passwordHash = await hashPassword(newUser.password);
  const createdUser = await userRepository
    .createUser({
      email: newUser.email,
      passwordHash,
    })
    .catch(
      only(ExistingEmailError, error => {
        throw new DomainError(error.message, { email: newUser.email });
      }),
    );

  dispatch(signedUp(createdUser));
  return format(User, createdUser);
}

/**
 * Log a user in
 * @param  {Credentials} credentials credentials of the user
 * @param  {User} user        current logged user
 * @return {Object}             logged user
 */
async function logIn(credentials, { user }) {
  assertNotLogged(user);
  assertInput(Credentials, credentials);
  const { email, password } = credentials;
  const registeredUser = await userRepository.getUserByEmail(email, {
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

  bus.emit('event', loggedIn(registeredUser));
  return format(User, registeredUser);
}

async function logOut(args, { user }) {
  assertLogged(user);
  dispatch(loggedOut(user));
  return Promise.resolve({ logOut: true });
}

async function updateUser(userUpdate, { user }) {
  assertInput(UserUpdate, userUpdate);
  assertLogged(user);
  if (userUpdate.id !== user.id) {
    throw new DomainError('Not authorized');
  }
  const { userUpdated, updates } = await userRepository.withinTransaction(
    async transaction => {
      const userToUpdate = await userRepository.getUserById(userUpdate.id, {
        transaction,
        withPasswordHash: true,
      });

      const isPasswordOk = await checkPassword(
        userUpdate.formerPassword,
        userToUpdate.passwordHash,
      );
      if (!isPasswordOk) {
        throw new DomainError('Bad password for update', { id: userUpdate.id });
      }
      const passwordHash = await hashPassword(userUpdate.password);
      const newAttributes = { passwordHash };
      const newUser = await userRepository.updateUser(
        userToUpdate.id,
        {
          passwordHash,
        },
        { transaction },
      );

      return { userUpdated: newUser, updates: newAttributes };
    },
  );

  dispatch(updated(userUpdated, updates));
  return format(User, userUpdated);
}

async function getCurrentUser(args, { user }) {
  assertLogged(user);
  return format(User, user);
}

async function getUser(id, { user }) {
  assertInput(UserId, id);
  assertLogged(user);
  if (user.id === id) {
    const returnedUser = await userRepository.getUserById(id);
    return format(User, returnedUser);
  }
  return null;
}

/**
 * delete all users (for test)
 * @return {Promise}
 */
function deleteAllUsers() {
  assert(process.env.NODE_ENV === 'test'); // TODO @common
  return userRepository.deleteAllUsers();
}

export default {
  bus,

  signUp,
  logIn,
  logOut,
  getCurrentUser,
  getUser,
  updateUser,

  // test
  deleteAllUsers,
};
