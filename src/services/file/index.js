import assert from 'assert';
import { merge } from 'ramda';

import Service from '@ewoken/backend-common/lib/Service';
import { assertInput, format } from '@ewoken/backend-common/lib/assertSchema';

import FileRepository from './FileRepository';
import { FileInputs, File, FileIds, SetDomainTypeInput } from './types';
import { uploaded, updated, deleted } from './events';

class FileService extends Service {
  constructor(environment) {
    super('FileService', environment);
    this.fileRepository = new FileRepository(environment);
  }

  async init() {
    await this.fileRepository.init();
    return this;
  }

  async addFiles(fileInputs, context) {
    context.assertAuthentified();
    const files = assertInput(FileInputs, fileInputs);
    const uploaderId = context.isSystem() ? null : context.user.id;
    const filesToAdd = files.map(
      merge({
        uploaderId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const addedFiles = await this.fileRepository.createFiles(filesToAdd);

    addedFiles.forEach(addedFile => this.dispatch(uploaded(addedFile)));
    return addedFiles.map(format(File));
  }

  async getFiles(fileIdsInput) {
    const fileIds = assertInput(FileIds, fileIdsInput);

    const files = await this.fileRepository.getFiles(fileIds);
    return files.map(format(File));
  }

  async setDomainTypeToFiles(args, context) {
    context.assertIsSystem();
    const { fileIds, domainType } = assertInput(SetDomainTypeInput, args);
    const update = { domainType };

    const files = await this.fileRepository.updateFiles(fileIds, update);
    files.forEach(file => this.dispatch(updated(file, update)));
    return files.map(format(File));
  }

  async deleteFiles(fileIdsInput, context) {
    context.assertIsSystem();
    const fileIds = assertInput(FileIds, fileIdsInput);

    const deletedFileCount = await this.fileRepository.deleteFiles(fileIds);
    fileIds.forEach(fileId => this.dispatch(deleted(fileId)));
    return deletedFileCount;
  }

  async deleteAllFiles() {
    assert(process.env.NODE_ENV === 'test');
    return this.fileRepository.deleteAllFiles();
  }
}

export default FileService;
