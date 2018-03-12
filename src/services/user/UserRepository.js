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
      scopes: {
        withPasswordHash: {
          where: {
            deletedAt: null,
          },
          attributes: ['id', 'email', 'passwordHash', 'createdAt', 'updatedAt'],
        },
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
  constructor({ sequelize }) {
    this.sequelize = sequelize;
    this.User = defineUserSchema(sequelize);
  }

  async init() {
    await this.User.sync();
    return this;
  }

  async withinTransaction(f) {
    return this.sequelize.transaction(f);
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

  async getUserWhere(criteria, options = {}) {
    const { withPasswordHash = false, transaction } = options;
    const User = withPasswordHash
      ? this.User.scope('withPasswordHash')
      : this.User;
    const user = await User.findOne({ where: criteria, transaction });
    return user && user.toJSON();
  }

  getUserByEmail(email, options) {
    return this.getUserWhere({ email }, options);
  }

  getUserById(id, options) {
    return this.getUserWhere({ id }, options);
  }

  async updateUser(id, userUpdate, options = {}) {
    // TODO
    const { withPasswordHash = false, transaction } = options;
    const User = withPasswordHash
      ? this.User.scope('withPasswordHash')
      : this.User;
    const user = await User.findById(id, { transaction });

    Object.keys(userUpdate).forEach(key => {
      user[key] = userUpdate[key];
    });

    const savedUser = await user.save({ transaction });
    return savedUser.toJSON();
  }

  async deleteAllUsers() {
    assert(process.env.NODE_ENV === 'test');
    return this.User.destroy({ force: true });
  }
}

export default UserRepository;
