import path from 'path';

import getBaseUrl from '@ewoken/backend-common/lib/getBaseUrl';

import launchApp from '../../server';
import Client from '../client';
import userStoreIdentity from '../../identity';

let server;
let userClient;
let systemClient;
let fileMetas;
let url;
const credentials = { email: 'test@test.com', password: '1234567' };
const { token } = userStoreIdentity;
const filePaths = ['./data/test01.jpg', './data/test02.txt'].map(p =>
  path.join(__dirname, p),
);

beforeAll(async () => {
  server = await launchApp();
  url = getBaseUrl(server);
  userClient = new Client(url, { cookie: true });
  systemClient = new Client(url, { headers: { authorization: token } });

  await userClient.clearSession();
  await userClient.deleteAllUsers();
  await userClient.signUp(credentials);
  await userClient.logIn(credentials);
});

beforeEach(async () => {
  await userClient.deleteAllFiles();
  fileMetas = await userClient.addFiles(filePaths);
});

afterAll(async () => {
  await userClient.clearSession();
  await userClient.deleteAllUsers();
  await userClient.deleteAllFiles();
  return new Promise(resolve => {
    server.unref();
    server.destroy(resolve);
  });
});

describe('file api', () => {
  describe('POST /', () => {
    test('should add files', async () => {
      expect(fileMetas).toHaveLength(2);
    });

    test('should fail if not authorized', async () => {
      const userClient2 = new Client(url, { cookie: true });
      await userClient2.clearSession();
      await expect(userClient2.addFiles(filePaths)).rejects.toThrow(
        /Unauthorized/,
      );
    });

    test('should fail with no file', async () => {
      await expect(userClient.addFiles([])).rejects.toThrow(/Validation/);
    });
  });

  describe('GET /:id', () => {
    test('should get a file', async () => {
      const files = await Promise.all(
        fileMetas.map(fileMeta => userClient.getFile(fileMeta.id)),
      );

      files.forEach((file, index) => {
        expect(file.buffer.length).toEqual(fileMetas[index].size);
        expect(file.filename).toEqual(fileMetas[index].filename);
      });
    });

    test('should fail if file does not exist', async () => {
      expect(userClient.getFile('azertyuiopqsdfgh')).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('POST /getMetadata', () => {
    test('should return metadatas of files', async () => {
      const fileMetas2 = await systemClient.getMetadata(
        fileMetas.map(f => f.id),
      );
      expect(fileMetas2).toEqual(expect.arrayContaining(fileMetas));
    });
  });

  describe('POST /setDomainType', () => {
    test('should return metadatas of updated files', async () => {
      const TEST_TYPE = 'TEST_TYPE';
      const fileMetas2 = await systemClient.setDomainType({
        fileIds: fileMetas.map(f => f.id),
        domainType: TEST_TYPE,
      });
      expect(fileMetas2).toHaveLength(2);
      expect(fileMetas2.every(f => f.domainType === TEST_TYPE)).toBe(true);
    });
  });

  describe('DELETE /', () => {
    test('should delete files as system', async () => {
      const fileIds = fileMetas.map(f => f.id);
      const res = await systemClient.deleteFiles(fileIds);
      const fileMetas2 = await systemClient.getMetadata(fileIds);

      expect(res).toBe(2);
      expect(fileMetas2).toHaveLength(0);
    });
  });
});
