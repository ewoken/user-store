import Sequelize from 'sequelize'
import ExtendableError from 'es6-error'

function defineUserSchema (sequelize) {
  return sequelize.define('User', {
    _id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    passwordHash: { type: Sequelize.STRING, allowNull: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
    deletedAt: { type: Sequelize.DATE, allowNull: true }
  }, {
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['email'], unique: true }
    ],
    defaultScope: {
      where: {
        deletedAt: null
      },
      attributes: ['_id', 'email', 'createdAt', 'updatedAt']
    }
  })
}

export class ExistingEmailError extends ExtendableError {
  constructor (email) {
    super(`The email ${email} is already used !`)
    this.email = email
  }
}

class UserRepository {
  constructor () {
    this.sequelize = null
    this.eventCollection = null
  }

  async init (sequelize) {
    this.sequelize = sequelize
    this.User = defineUserSchema(sequelize)
    await this.User.sync()
    return this
  }

  async createUser (user) {
    const createdUser = await this.User.create(user)
      .catch(Sequelize.UniqueConstraintError, () => {
        throw new ExistingEmailError(user.email)
      })
    const userObject = createdUser.toJSON()
    delete userObject.passwordHash
    return userObject
  }

  async findUserByEmail (email, withPassword) {
    const user = await this.User.scope(null).findOne({ where: { email } })
    return user && user.toJSON()
  }

  async deleteAllUsers () {
    return this.User.destroy({ force: true })
  }
}

export default new UserRepository()
