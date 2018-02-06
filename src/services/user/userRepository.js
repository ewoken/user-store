import assert from 'assert';
import Sequelize from 'sequelize';
import ExtendableError from 'es6-error';

function defineUserSchema(sequelize) {
  return sequelize.define(
    'User',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      passwordHash: { type: Sequelize.STRING, allowNull: false },
      createdAt: { type: Sequelize.DATE(6), allowNull: false },
      updatedAt: { type: Sequelize.DATE(6), allowNull: false },
      deletedAt: { type: Sequelize.DATE(6), allowNull: true },
    },
    {
      timestamps: true,
      paranoid: true,
      indexes: [{ fields: ['email'], unique: true }],
      defaultScope: {
        where: {
          deletedAt: null,
        },
        attributes: ['id', 'email', 'createdAt', 'updatedAt'],
      },
    },
  );
}

export class ExistingEmailError extends ExtendableError {
  constructor(email) {
    super(`The email ${email} is already used !`);
    this.email = email;
  }
}

class UserRepository {
  constructor() {
    this.sequelize = null;
    this.eventCollection = null;
  }

  async init(sequelize) {
    this.sequelize = sequelize;
    this.User = defineUserSchema(sequelize);
    await this.User.sync();
    return this;
  }

  async createUser(user) {
    const createdUser = await this.User.create(user).catch(
      Sequelize.UniqueConstraintError,
      () => {
        throw new ExistingEmailError(user.email);
      },
    );
    const userObject = createdUser.toJSON();
    return userObject;
  }

  async getUserByEmail(email) {
    const user = await this.User.scope(null).findOne({ where: { email } });
    return user && user.toJSON();
  }

  async getUserById(id) {
    const user = await this.User.findOne({ where: { id } });
    return user && user.toJSON();
  }

  async deleteAllUsers() {
    assert(process.env.NODE_ENV === 'test'); // TODO go to common
    return this.User.destroy({ force: true });
  }
}

export default new UserRepository();
