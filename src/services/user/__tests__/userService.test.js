/* global beforeAll afterAll describe test expect afterEach, beforeEach */

import initUserService from '../index'
import buildEnvironment from '../../../environment' // TODO ?

let environment
let userService
beforeAll(async () => {
  environment = await buildEnvironment()
  userService = await initUserService(environment)
  return userService.deleteAllUsers()
})

afterAll(() => {
  environment.close()
})

afterEach(async () => {
  await userService.deleteAllUsers()
})

describe('user service', () => {
  describe('signUp(newUser, user)', () => {
    const user = null
    test('should sign up an user', async () => {
      const newUser = {
        email: 'plop@plop.com',
        password: 'ploploploploploploploplop',
      }

      const insertedUser = await userService.signUp(newUser, user)
      expect(insertedUser).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: newUser.email,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      )
      expect(insertedUser.passwordHash).toBe(undefined)
    })

    test('should fail for a bad user', async () => {
      const badUser = {
        email: 'plop@plop.com',
        password: '',
      }
      await expect(userService.signUp(badUser, user)).rejects.toThrow(
        /password/,
      )
    })

    test('should fail for an existing email', async () => {
      const newUser = {
        email: 'plop@plop.com',
        password: 'helloworld',
      }
      await userService.signUp(newUser, user)
      await expect(userService.signUp(newUser, user)).rejects.toThrow(
        /plop@plop.com/,
      )
    })

    test('should fail if already logged', async () => {
      const newUser = {
        email: 'plop@plop.com',
        password: 'helloworld',
      }
      await expect(userService.signUp(newUser, newUser)).rejects.toThrow(
        /logged/,
      )
    })
  })

  describe('logIn(credentials, user)', () => {
    const testUser = {
      email: 'plop@plop.com',
      password: 'azertyuiop',
    }
    const user = null

    beforeEach(() => userService.signUp(testUser, user))

    test('should log in a user with good credentials', async () => {
      const result = await userService.logIn(testUser, user)
      expect(result).toMatchObject({ email: testUser.email })
      expect(result.passwordHash).toBe(undefined)
    })

    test('should fail with bad email', async () => {
      const credentials = { email: 'plopp@plop.com', password: 'azertyuiop' }
      await expect(userService.logIn(credentials, user)).rejects.toThrow(
        /Bad credentials/,
      )
    })

    test('should fail with bad password', async () => {
      const credentials = { email: 'plop@plop.com', password: 'azertyuiopm' }
      await expect(userService.logIn(credentials, user)).rejects.toThrow(
        /Bad credentials/,
      )
    })

    test('should fail if logged', async () => {
      await expect(userService.logIn(testUser, testUser)).rejects.toThrow(
        /logged/,
      )
    })
  })
})
