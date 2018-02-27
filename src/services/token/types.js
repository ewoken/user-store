import Joi from 'joi';
import config from 'config';

export const TOKEN_LENGTH = config.get('services.tokenService.tokenLength');

export const TokenId = Joi.string().length(TOKEN_LENGTH);

export const TokenInput = Joi.object({
  type: Joi.string().required(),
  userId: Joi.string().required(),
  createdAt: Joi.date().default(() => new Date(), 'set to now'),
  expiredAt: Joi.date().required(),
  discardPreviousTokens: Joi.boolean().default(true),
});

export const TokenObject = Joi.object({
  id: TokenId.required(),
  type: Joi.string().required(),
  userId: Joi.string().required(),
  createdAt: Joi.date().strip(),
  expiredAt: Joi.date().strip(),
});

export const ConsumeInput = Joi.object({
  token: Joi.string().required(),
  expectedType: Joi.string().required(),
});
