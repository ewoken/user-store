import Joi from 'joi'

const email = Joi.string().email().max(255)
const password = Joi.string().min(5).max(100)
const createdAt = Joi.date()
const updatedAt = Joi.date()

export const UserInput = Joi.object({
  email,
  password
})

export const User = Joi.object({
  _id: Joi.string(),
  email,
  createdAt,
  updatedAt
})

export const Credentials = Joi.object({
  email,
  password
})
