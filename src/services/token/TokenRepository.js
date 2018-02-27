import assert from 'assert';
import Sequelize from 'sequelize';
import safeUid from 'uid-safe';

import { TOKEN_LENGTH } from './types';

const { Op } = Sequelize;
const BASE64_LENGTH_TO_BYTES = length => length * 6 / 8;

function defineUserSchema(sequelize) {
  return sequelize.define(
    'Token',
    {
      id: {
        type: Sequelize.STRING(TOKEN_LENGTH),
        allowNull: false,
        primaryKey: true,
        defaultValue: () => safeUid.sync(BASE64_LENGTH_TO_BYTES(TOKEN_LENGTH)),
      },
      userId: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      createdAt: {
        type: Sequelize.DATE(6),
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      expiredAt: { type: Sequelize.DATE(6), allowNull: false },
    },
    {
      timestamps: false,
    },
  );
}

class TokenRepository {
  constructor({ sequelize }) {
    this.sequelize = sequelize;
    this.Token = defineUserSchema(sequelize);
  }

  async init() {
    await this.Token.sync();
    return this;
  }

  async withinTransaction(f) {
    return this.sequelize.transaction(f);
  }

  async createToken(token) {
    const createdToken = await this.Token.create(token);
    return createdToken.toJSON();
  }

  async getToken(tokenId, { transaction } = {}) {
    const token = await this.Token.findById(tokenId, { transaction });
    return token && token.toJSON();
  }

  async deleteToken(tokenId, { transaction } = {}) {
    return this.Token.destroy({ transaction, where: { id: tokenId } });
  }

  async deleteTokensByTypeAndUser({ type, userId }) {
    const deletedTokensCount = await this.Token.destroy({
      where: {
        type,
        userId,
      },
    });
    return deletedTokensCount;
  }

  async deleteAllExpiredTokens() {
    return this.Token.destroy({
      where: { expiredAt: { [Op.lt]: new Date() } },
    });
  }

  deleteAllTokens() {
    assert((process.env.NODE_ENV = 'test'));
    return this.Token.destroy({ where: {} });
  }
}

export default TokenRepository;
