import assert from 'assert'
import { EventEmitter } from 'events'
import bcrypt from 'bcrypt'
import { pick } from 'rambda'

import { assertInput, assertInternal } from '../../utils/assertInput'
import { DomainError, only } from '../../utils/errors'

import { signedUp, loggedIn, loggedOut } from './events'
import { UserInput, Credentials, User } from './types'
import userRepository, { ExistingEmailError } from './userRepository'

const bus = new EventEmitter()

function _assertNotLogged (user) { // TODO @common
  if (user) {
    throw new DomainError(`You are logged as ${user.email}`, { email: user })
  }
}
function _assertLogged (user) { // TODO @common
  if (user) {
    assertInternal(User, user)
    return
  }
  throw new DomainError('You are not logged')
}

const _formatUser = pick(['_id', 'email', 'createdAt', 'updatedAt'])

/**
 * Sign up a new user
 * @param  {UserInput} newUser new user
 * @param  {User} user    current logged user
 * @return {User}         created user
 */
async function signUp (newUser, user) {
  _assertNotLogged(user)
  assertInput(UserInput, newUser)

  const passwordHash = await bcrypt.hash(newUser.password, 10)
  const createdUser = await userRepository.createUser({
    email: newUser.email,
    passwordHash
  }).catch(only(ExistingEmailError, error => {
    throw new DomainError(error.message, { email: newUser.email })
  }))

  bus.emit('event', signedUp(createdUser))
  return _formatUser(createdUser)
}

/**
 * Log a user in
 * @param  {Credentials} credentials credentials of the user
 * @param  {User} user        current logged user
 * @return {Object}             logged user + sessionId
 */
async function logIn (credentials, user) {
  _assertNotLogged(user)
  assertInput(Credentials, credentials)
  const { email, password } = credentials
  const registeredUser = await userRepository.findUserByEmail(email)

  if (!registeredUser) {
    throw new DomainError('Bad credentials', { email })
  }
  const isPasswordOk = await bcrypt.compare(password, registeredUser.passwordHash)
  if (!isPasswordOk) {
    throw new DomainError('Bad credentials', { email })
  }

  bus.emit('event', loggedIn(registeredUser))
  return _formatUser(registeredUser)
}

async function logOut (args, user) {
  _assertLogged(user)
  bus.emit('event', loggedOut(user))
  return Promise.resolve({ logOut: true })
}

async function getAccount (args, user) {
  _assertLogged(user)
  return Promise.resolve(user)
}

/**
 * delete all users (for test)
 * @return {Promise}
 */
function deleteAllUsers () {
  assert(process.env.NODE_ENV === 'test') // TODO go to common
  return userRepository.deleteAllUsers()
}

export default {
  bus,

  signUp,
  logIn,
  logOut,
  getAccount,
  deleteAllUsers
}
