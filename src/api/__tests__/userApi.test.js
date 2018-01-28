/* global beforeAll, afterAll, describe, test, expect */

import launchApp from '../../server'
import fetchApi from '../../utils/fetchApi'
import getBaseUrl from '../../utils/getBaseUrl'

let server
beforeAll(async () => {
  server = await launchApp()
})

afterAll(() => {
  return new Promise(resolve => {
    server.unref()
    server.destroy(resolve)
  })
})

describe('user api', () => {
  const baseUrl = () => getBaseUrl(server)

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
