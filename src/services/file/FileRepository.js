import assert from 'assert';
import Sequelize from 'sequelize';
import safeUid from 'uid-safe';

import { FILE_ID_LENGTH } from './types';

const BASE64_LENGTH_TO_BYTES = length => length * 6 / 8;

function defineUserSchema(sequelize) {
  return sequelize.define(
    'File',
    {
      id: {
        type: Sequelize.STRING(FILE_ID_LENGTH),
        allowNull: false,
        primaryKey: true,
        defaultValue: () =>
          safeUid.sync(BASE64_LENGTH_TO_BYTES(FILE_ID_LENGTH)),
      },
      filename: { type: Sequelize.STRING, allowNull: false },
      mimeType: { type: Sequelize.STRING, allowNull: false },
      size: {
        // bytes
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      domainType: { type: Sequelize.STRING, allowNull: false },
      uploaderId: {
        // userId
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: { type: Sequelize.DATE(6), allowNull: false },
      updatedAt: { type: Sequelize.DATE(6), allowNull: false },
      deletedAt: { type: Sequelize.DATE(6), allowNull: true },
    },
    {
      timestamps: true,
      paranoid: true,
      defaultScope: {
        attributes: { exclude: ['deletedAt'] },
      },
    },
  );
}

class FileRepository {
  constructor({ sequelize }) {
    this.sequelize = sequelize;
    this.File = defineUserSchema(sequelize);
  }

  async init() {
    await this.File.sync();
    return this;
  }

  async withinTransaction(f) {
    return this.sequelize.transaction(f);
  }

  async createFiles(files) {
    const createdFiles = await this.File.bulkCreate(files, { validate: true });
    return createdFiles.map(file => file.toJSON());
  }

  async getFiles(fileIds, { transaction } = {}) {
    const files = await this.File.findAll({
      where: { id: fileIds },
      transaction,
    });
    return files.map(file => file.toJSON());
  }

  async updateFiles(fileIds, update, options = {}) {
    const { transaction } = options;
    await this.File.update(update, { where: { id: fileIds }, transaction });
    return this.getFiles(fileIds, options);
  }

  async deleteFile(fileId, { transaction } = {}) {
    return this.File.destroy({ where: { id: fileId }, transaction });
  }

  async deleteFiles(fileIds, { transaction } = {}) {
    return this.File.destroy({
      where: { id: fileIds },
      transaction,
    });
  }

  deleteAllFiles() {
    assert((process.env.NODE_ENV = 'test'));
    return this.File.destroy({ where: {}, force: true });
  }
}

export default FileRepository;
