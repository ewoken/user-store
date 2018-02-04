import assert from 'assert';
import { EventEmitter } from 'events';
import bcrypt from 'bcrypt';
import { pick } from 'rambda';

import {
  assertInput,
  assertInternal,
} from '@ewoken/backend-common/lib/assertInput';
import { DomainError, only } from '@ewoken/backend-common/lib/errors';

import { signedUp, loggedIn, loggedOut } from './events';
import { UserInput, Credentials, User } from './types';
import userRepository, { ExistingEmailError } from './userRepository';

const bus = new EventEmitter();

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

const formatUser = pick(['id', 'email', 'createdAt', 'updatedAt']);

/**
 * Sign up a new user
 * @param  {UserInput} newUser new user
 * @param  {User} user    current logged user
 * @return {User}         created user
 */
async function signUp(newUser, user) {
  assertNotLogged(user);
  assertInput(UserInput, newUser);

  const passwordHash = await bcrypt.hash(newUser.password, 10);
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

  bus.emit('event', signedUp(createdUser));
  return formatUser(createdUser);
}

/**
 * Log a user in
 * @param  {Credentials} credentials credentials of the user
 * @param  {User} user        current logged user
 * @return {Object}             logged user + sessionId
 */
async function logIn(credentials, user) {
  assertNotLogged(user);
  assertInput(Credentials, credentials);
  const { email, password } = credentials;
  const registeredUser = await userRepository.getUserByEmail(email);

  if (!registeredUser) {
    throw new DomainError('Bad credentials', { email });
  }
  const isPasswordOk = await bcrypt.compare(
    password,
    registeredUser.passwordHash,
  );
  if (!isPasswordOk) {
    throw new DomainError('Bad credentials', { email });
  }

  bus.emit('event', loggedIn(registeredUser));
  return formatUser(registeredUser);
}

async function logOut(args, user) {
  assertLogged(user);
  bus.emit('event', loggedOut(user));
  return Promise.resolve({ logOut: true });
}

async function getCurrentUser(args, user) {
  assertLogged(user);
  return Promise.resolve(user);
}

/**
 * delete all users (for test)
 * @return {Promise}
 */
function deleteAllUsers() {
  assert(process.env.NODE_ENV === 'test'); // TODO go to common
  return userRepository.deleteAllUsers();
}

export default {
  bus,

  signUp,
  logIn,
  logOut,
  getCurrentUser,
  deleteAllUsers,
};
