import Joi from 'joi';

const email = Joi.string()
  .email()
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
  id: Joi.string().required(),
  email: email.required(),
  createdAt: createdAt.required(),
  updatedAt: updatedAt.required(),
});

export const Credentials = Joi.object({
  email: email.required(),
  password: password.required(),
});
