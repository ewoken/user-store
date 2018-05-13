import { omit } from 'ramda';
import faker from 'faker';

import buildEnvironment from '../../../environment';
import Context from '../../../utils/Context';
import FileService from '../index';
import { FILE_ID_LENGTH } from '../types';
import { uploaded, updated, deleted } from '../events';

const f = omit(['createdAt']);

function fakeFile(file) {
  const mimeType = faker.random.arrayElement([
    'image/jpeg',
    'image/png',
    'text/plain',
    'text/html',
  ]);
  const fileExt = faker.system.fileExt(mimeType);
  return {
    id: faker.random.alphaNumeric(FILE_ID_LENGTH),
    filename: faker.system.commonFileName(fileExt),
    mimeType,
    size: faker.random.number(),
    ...file,
  };
}

let environment;
let fileService;
let fileServiceEvents;
beforeAll(async () => {
  environment = await buildEnvironment();
  fileService = new FileService(environment);
  await fileService.init();
  fileService.onEvent(event => {
    fileServiceEvents.push(event);
  });
});

beforeEach(async () => {
  fileServiceEvents = [];
  await fileService.deleteAllFiles();
});

afterAll(async () => {
  await fileService.deleteAllFiles();
  environment.close();
});

describe('file service', () => {
  const systemContext = new Context({
    system: {
      name: 'test',
      version: 'test',
      instanceId: 'test',
    },
  });
  const userContext = new Context({
    user: {
      id: '1',
      email: 'plop@plop.com',
      createdAt: '2018-01-01T00:00:00.000Z',
      updatedAt: '2018-01-01T00:00:00.000Z',
    },
  });
  const emptyContext = new Context();

  function addFixtures(count) {
    const filesInput = Array.from({ length: count }, fakeFile);
    return fileService.addFiles(filesInput, systemContext);
  }

  describe('.addFiles', () => {
    test('should add files when called by a system', async () => {
      const files = Array.from({ length: 6 }, fakeFile);

      const addedFiles = await fileService.addFiles(files, systemContext);

      expect(addedFiles).toMatchObject(addedFiles);
      expect(addedFiles.every(addedFile => addedFile.uploaderId === null)).toBe(
        true,
      );
      expect(fileServiceEvents).toMatchObject(
        addedFiles.map(addedFile => f(uploaded(addedFile))),
      );
    });

    test('should add files when called by a logged user', async () => {
      const files = Array.from({ length: 6 }, fakeFile);

      const addedFiles = await fileService.addFiles(files, userContext);

      expect(addedFiles).toMatchObject(addedFiles);
      expect(
        addedFiles.every(
          addedFile => addedFile.uploaderId === userContext.user.id,
        ),
      ).toBe(true);
      expect(fileServiceEvents).toMatchObject(
        addedFiles.map(addedFile => f(uploaded(addedFile))),
      );
    });

    test('should fail when called by an unauthentified user', async () => {
      const files = Array.from({ length: 6 }, fakeFile);

      await expect(fileService.addFiles(files, emptyContext)).rejects.toThrow(
        /Unauthorized/,
      );
    });
  });

  describe('.getFiles', () => {
    let files;
    let fileIds;
    beforeEach(async () => {
      files = await addFixtures(6);
      fileIds = files.map(file => file.id);
    });

    test('should return all found files', async () => {
      fileIds.push('swt9zy8f3kz9cdrd');

      const returnedFiles = await fileService.getFiles(fileIds, systemContext);
      const returnedFiles2 = await fileService.getFiles(fileIds, userContext);

      expect(returnedFiles).toEqual(expect.arrayContaining(files));
      expect(returnedFiles2).toEqual(expect.arrayContaining(files));
    });

    test('should fail when called by a logged or unauthentified user', async () => {
      await expect(fileService.getFiles(fileIds, emptyContext)).rejects.toThrow(
        /Unauthorized/,
      );
    });
  });

  describe('.setDomainTypeToFiles', () => {
    let files;
    let fileIds;
    beforeEach(async () => {
      files = await addFixtures(6);
      fileIds = files.map(file => file.id);
    });

    test('should set a new domain type to all found files', async () => {
      fileIds.push('swt9zy8f3kz9cdrd');

      const TEST_FILE = 'TEST_FILE';
      const returnedFiles = await fileService.setDomainTypeToFiles(
        {
          fileIds,
          domainType: TEST_FILE,
        },
        systemContext,
      );

      expect(returnedFiles).toHaveLength(6);
      expect(returnedFiles.every(file => file.domainType === TEST_FILE)).toBe(
        true,
      );
      expect(fileServiceEvents.slice(6)).toMatchObject(
        returnedFiles.map(addedFile =>
          f(updated(addedFile, { domainType: TEST_FILE })),
        ),
      );
    });

    test('should fail when called by a logged or unauthentified user', async () => {
      await expect(
        fileService.setDomainTypeToFiles(fileIds, emptyContext),
      ).rejects.toThrow(/Unauthorized/);
      await expect(
        fileService.setDomainTypeToFiles(fileIds, userContext),
      ).rejects.toThrow(/Forbidden/);
    });
  });

  describe('.deleteFiles', () => {
    let files;
    let fileIds;
    beforeEach(async () => {
      files = await addFixtures(6);
      fileIds = files.map(file => file.id);
    });

    test('should delete all found files', async () => {
      fileIds.push('swt9zy8f3kz9cdrd');

      const deletedFileCount = await fileService.deleteFiles(
        fileIds,
        systemContext,
      );

      expect(deletedFileCount).toEqual(6);
      await expect(
        fileService.getFiles(fileIds, systemContext),
      ).resolves.toEqual([]);
      expect(fileServiceEvents.slice(6)).toMatchObject(
        fileIds.map(fileId => f(deleted(fileId))),
      );
    });

    test('should fail when called by a logged or unauthentified user', async () => {
      await expect(
        fileService.deleteFiles(fileIds, emptyContext),
      ).rejects.toThrow(/Unauthorized/);
      await expect(
        fileService.deleteFiles(fileIds, userContext),
      ).rejects.toThrow(/Forbidden/);
    });
  });
});
