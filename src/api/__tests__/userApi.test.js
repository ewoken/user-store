/* global beforeAll, afterAll, afterEach, describe, test, expect */

import launchApp from '../../server'
import fetchApi from '../../utils/fetchApi'
import getBaseUrl from '../../utils/getBaseUrl'

let server
const baseUrl = () => getBaseUrl(server) // TODO @common
const deleteAllUsers = () => fetchApi(`${baseUrl()}/user`, {
  method: 'DELETE'
})

beforeAll(async () => {
  server = await launchApp()
  await deleteAllUsers()
})

afterAll(() => {
  return new Promise(resolve => {
    server.unref()
    server.destroy(resolve)
  })
})

afterEach(async () => {
  await deleteAllUsers()
})

describe('user api', () => {
  describe('POST /signUp', () => {
    const signUpUser = user => fetchApi(`${baseUrl()}/user/signUp`, {
      method: 'POST',
      body: JSON.stringify(user)
    })

    test('should sign up a user', async () => {
      const user = {
        email: 'plop@plop.com',
        password: 'helloworld'
      }
      const returnedUser = await signUpUser(user)
      expect(returnedUser).toMatchObject({ email: user.email })
    })
  })
})
