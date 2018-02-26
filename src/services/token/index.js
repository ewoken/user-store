import assert from 'assert';
import { DateTime } from 'luxon';
import { pick } from 'ramda';
import jwt from 'jsonwebtoken';
import config from 'config';

import Service from '@ewoken/backend-common/lib/Service';
import {
  assertInput,
  assertInternal,
  format,
} from '@ewoken/backend-common/lib/assertSchema';
import { DomainError } from '@ewoken/backend-common/lib/errors';

import TokenRepository from './TokenRepository';

import { TokenInput, TokenObject, ConsumeInput } from './types';
import { created, consumed } from './events';

const secret = config.get('services.tokenService.secret');

function isExpired(token) {
  return (
    !token ||
    (token.expiredAt &&
      DateTime.fromJSDate(token.expiredAt).diffNow().milliseconds < 0)
  );
}

function signToken(token) {
  return jwt.sign(format(TokenObject, token), secret, { noTimestamp: true });
}

function unsignToken(signedToken) {
  let token;
  try {
    token = jwt.verify(signedToken, secret);
  } catch (e) {
    if (e.name === 'JsonWebTokenError') {
      throw new DomainError('Bad signed token', { token: signedToken });
    } else {
      throw e;
    }
  }
  return assertInternal(TokenObject, token);
}

class TokenService extends Service {
  constructor(environment) {
    super('EmailService', environment);
    this.tokenRepository = new TokenRepository(environment);
  }

  async init() {
    await this.tokenRepository.init();
    return this;
  }

  async createToken(tokenInput) {
    const { discardPreviousTokens, ...newToken } = assertInput(
      TokenInput,
      tokenInput,
    );

    if (discardPreviousTokens) {
      await this.tokenRepository.deleteTokensByTypeAndUser(
        pick(['userId', 'type'], tokenInput),
      );
    }

    const tokenObject = await this.tokenRepository.createToken(newToken);

    this.dispatch(created(tokenObject, discardPreviousTokens));
    return signToken(tokenObject);
  }

  async consumeToken(args) {
    assertInput(ConsumeInput, args);
    const { token, expectedType } = args;
    const unsignedToken = unsignToken(token);
    const tokenId = unsignedToken.id;

    if (unsignedToken.type !== expectedType) {
      throw new DomainError('Bad token type');
    }

    const consumedToken = await this.tokenRepository.withinTransaction(
      async transaction => {
        const tokenObject = await this.tokenRepository.getToken(tokenId, {
          transaction,
        });

        if (!tokenObject) {
          return null;
        }

        await this.tokenRepository.deleteToken(tokenId, { transaction });
        return tokenObject;
      },
    );

    if (isExpired(consumedToken)) {
      throw new DomainError('Invalid or expired token', { tokenId });
    }
    this.dispatch(consumed(consumedToken));
    return consumedToken;
  }

  async deleteAllExpiredTokens() {
    const deletedCount = await this.tokenRepository.deleteAllExpiredTokens();
    return deletedCount;
  }

  async deleteAllTokens() {
    assert(process.env.NODE_ENV === 'test'); // TODO @common
    return this.tokenRepository.deleteAllTokens();
  }
}

export default TokenService;
