import { omit } from 'ramda';
import { DateTime } from 'luxon';
import jwt from 'jsonwebtoken';
import config from 'config';
import MockDate from 'mockdate';

import buildEnvironment from '../../../environment';
import TokenService from '../index';
import { created, consumed } from '../events';

const secret = config.get('services.tokenService.secret');
const f = omit(['createdAt']);

let environment;
let tokenService;
let tokenServiceEvents;
beforeAll(async () => {
  environment = await buildEnvironment();
  tokenService = new TokenService(environment);
  await tokenService.init();
  tokenService.onEvent(event => {
    tokenServiceEvents.push(event);
  });
});

beforeEach(async () => {
  tokenServiceEvents = [];
  await tokenService.deleteAllTokens();
});

afterAll(async () => {
  await tokenService.deleteAllTokens();
  environment.close();
});

describe('tokenService', () => {
  const testTokenObject = {
    type: 'TEST',
    userId: 'u1',
    expiredAt: DateTime.local()
      .plus({ days: 1 })
      .toJSDate(),
  };
  const consume = (token, expectedType = 'TEST') =>
    tokenService.consumeToken({
      token,
      expectedType,
    });

  describe('.createToken(tokenInput)', () => {
    test('should create a token', async () => {
      const signedToken = await tokenService.createToken(testTokenObject);
      const tokenObject = jwt.verify(signedToken, secret);

      expect(tokenServiceEvents).toMatchObject([f(created(tokenObject, true))]);
    });

    test('should discard previous tokens when asked (by default)', async () => {
      const signedToken1 = await tokenService.createToken(testTokenObject);
      await tokenService.createToken(testTokenObject);

      await expect(consume(signedToken1)).rejects.toThrow(
        /Invalid or expired token/,
      );
    });
  });

  describe('.consumeToken(args)', () => {
    const expiredDate = DateTime.local()
      .plus({ days: 2 })
      .toJSDate();
    let signedToken;
    beforeEach(async () => {
      signedToken = await tokenService.createToken(testTokenObject);
    });

    test('should return the token when it is ok', async () => {
      const tokenObject = await consume(signedToken);
      expect(tokenObject).toMatchObject(omit(['expiredAt'], testTokenObject));
      expect(tokenServiceEvents).toMatchObject([
        f(created(tokenObject, true)),
        f(consumed(tokenObject)),
      ]);
    });
    test('should throw when token is not of the expected type', async () => {
      await expect(consume(signedToken, 'TEST2')).rejects.toThrow(
        /Invalid or expired token/,
      );
    });
    test('should throw when token is used twice', async () => {
      await consume(signedToken);
      await expect(consume(signedToken)).rejects.toThrow(
        /Invalid or expired token/,
      );
    });
    test('should throw an error when token is expired but not deleted', async () => {
      MockDate.set(expiredDate);
      await expect(consume(signedToken)).rejects.toThrow(
        /Invalid or expired token/,
      );
      MockDate.reset();
    });
    test('should throw an error when token is expired and deleted', async () => {
      MockDate.set(expiredDate);
      await tokenService.deleteAllExpiredTokens();
      await expect(consume(signedToken)).rejects.toThrow(
        /Invalid or expired token/,
      );
      MockDate.reset();
    });
    test('should throw an error when token signature is bad', async () => {
      await expect(consume('badtoken')).rejects.toThrow(
        /Invalid or expired token/,
      );
    });
  });
});
