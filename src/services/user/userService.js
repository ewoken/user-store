import assert from 'assert'
import { EventEmitter } from 'events'
import bcrypt from 'bcrypt'
import { pick } from 'rambda'

import { assertInput } from '../../utils/assertInput'
import { DomainError, only } from '../../utils/errors'

import { signedUp, loggedIn } from './events'
import { UserInput, Credentials } from './types'
import userRepository, { ExistingEmailError } from './userRepository'

const bus = new EventEmitter()

function _assertNotLogged (user) { // TODO go to common
  if (user) {
    throw new DomainError(`You are logged as ${user.email}`, { email: user })
  }
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
  deleteAllUsers
}
