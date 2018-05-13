import path from 'path';
import fs from 'fs';

import multer from 'multer';
import config from 'config';
import safeUid from 'uid-safe';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';

const FILE_ID_LENGTH = config.get('services.fileService.fileIdLength');

const FileStorageEnum = {
  Disk: 'DISK',
};
const FILE_FIELD = 'files';
const defaultMulterConfig = fileApiConfig => ({
  limits: {
    fieldNameSize: Buffer.from(FILE_FIELD).length,
    fields: 0,
    fileSize: fileApiConfig.limits.fileSize,
    files: fileApiConfig.limits.filesPerRequest,
    parts: fileApiConfig.limits.filesPerRequest,
    headerPairs: fileApiConfig.limits.filesPerRequest * 10,
  },
  fileFilter(req, file, callback) {
    callback(
      null,
      fileApiConfig.authorizedMimeTypes === true ||
        fileApiConfig.authorizedMimeTypes.includes(file.mimetype),
    );
  },
});

function getFilePath(dir, fileId) {
  return path.join(dir, fileId);
}

function deleteFilesFromDisk(dir, fileIds) {
  return Promise.all(
    fileIds.map(
      fileId =>
        new Promise((resolve, reject) => {
          fs.unlink(getFilePath(dir, fileId), err => {
            if (err) reject(err);
            resolve();
          });
        }),
    ),
  );
}

function deleteAllFilesFromDisk(dir) {
  return new Promise((resolve, reject) => {
    rimraf(path.join(dir, './*'), (err, value) => {
      if (err) reject(err);
      resolve(value);
    });
  });
}

function buildDiskStorage(fileApiConfig) {
  mkdirp.sync(fileApiConfig.path);
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, cb) {
        cb(null, fileApiConfig.path);
      },
      filename(req, file, cb) {
        cb(null, safeUid.sync(FILE_ID_LENGTH * 6 / 8)); // safeUid takes bytes length
      },
    }),
    ...defaultMulterConfig(fileApiConfig),
  });
  return {
    uploadMiddleware: upload.array(FILE_FIELD),
    deleteFiles: fileIds => deleteFilesFromDisk(fileApiConfig.path, fileIds),
    deleteAllFiles: () => deleteAllFilesFromDisk(fileApiConfig.path),
    getFilePath: fileId => getFilePath(fileApiConfig.path, fileId),
  };
}

function getStorage(fileApiConfig) {
  switch (fileApiConfig.storage) {
    default:
    case FileStorageEnum.Disk:
      return buildDiskStorage(fileApiConfig);
  }
}

export default getStorage;
