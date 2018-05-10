import Joi from 'joi';

export const UserId = Joi.string();
const email = Joi.string()
  .email()
  .trim()
  .max(255);
const password = Joi.string()
  .min(5)
  .max(100);
const createdAt = Joi.date();
const updatedAt = Joi.date();

export const UserInput = Joi.object({
  email: email.required(),
  password: password.required(),
});

export const User = Joi.object({
  id: UserId.required(),
  email: email.required(),
  passwordHash: Joi.string()
    .optional()
    .strip(),
  createdAt: createdAt.required(),
  updatedAt: updatedAt.required(),
});

export const Credentials = Joi.object({
  email: email.required(),
  password: password.required(),
});

export const UserUpdate = Joi.object({
  id: UserId.required(),
  password: password.required(),
  formerPassword: password.required(),
});

export const ResetEmailInput = Joi.object({
  email,
});

export const ResetPasswordInput = Joi.object({
  token: Joi.string().required(),
  password: password.required(),
});

export const TokenInput = Joi.object({
  token: Joi.string().required(),
});
