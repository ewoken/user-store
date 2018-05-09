import path from 'path';
import fs from 'fs';

import express from 'express';
import multer from 'multer';
import config from 'config';
import safeUid from 'uid-safe';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';

import serviceToRoute from '@ewoken/backend-common/lib/api/serviceToRoute';
import { ValidationError } from '@ewoken/backend-common/lib/errors';

const fileApiConfig = config.get('api.files');

const FileStorageEnum = {
  Memory: 'MEMORY',
  Disk: 'DISK',
};

const storage = (() => {
  switch (fileApiConfig.storage) {
    case FileStorageEnum.Memory:
      return multer.memoryStorage();

    case FileStorageEnum.Disk:
    default:
      mkdirp.sync(fileApiConfig.path);
      return multer.diskStorage({
        destination(req, file, cb) {
          cb(null, fileApiConfig.path);
        },
        filename(req, file, cb) {
          cb(null, safeUid.sync(16 * 6 / 8)); // TODO
        },
      });
  }
})();

const FILE_FIELD = 'files';
const upload = multer({
  storage,
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

function buildFileApi(fileService) {
  const router = new express.Router();

  router.post(
    '/',
    (req, res, next) => {
      try {
        req.context.assertAuthentified();
      } catch (error) {
        next(error);
      }
      next();
    },
    upload.array(FILE_FIELD),
    async (req, res, next) => {
      try {
        if (req.files.length < 1) {
          throw new ValidationError({ files: 'required' });
        }

        const inputFiles = req.files.map(file => ({
          id: file.filename,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        }));
        const addedFile = await fileService.addFiles(inputFiles, req.context);
        res.json(addedFile);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get('/:id', async (req, res, next) => {
    try {
      const fileId = req.params.id;
      const [file] = await fileService.getFiles([fileId], req.context);
      if (file) {
        res.download(
          path.join(fileApiConfig.path, fileId),
          file.filename,
          error => next(error),
        );
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  });

  router.post('/getMetadata', serviceToRoute(fileService.getFiles));
  router.post(
    '/setDomainType',
    serviceToRoute(fileService.setDomainTypeToFiles),
  );

  router.delete(
    '/',
    serviceToRoute(async (fileIds, context) => {
      const res = await fileService.deleteFiles(fileIds, context);

      await Promise.all(
        fileIds.map(
          fileId =>
            new Promise((resolve, reject) => {
              fs.unlink(path.join(fileApiConfig.path, fileId), err => {
                if (err) reject(err);
                resolve();
              });
            }),
        ),
      );

      return res;
    }),
  );

  if (process.env.NODE_ENV === 'test') {
    router.delete(
      '/*',
      serviceToRoute(async () => {
        const res = await fileService.deleteAllFiles();

        await new Promise((resolve, reject) => {
          rimraf(path.join(fileApiConfig.path, './*'), (err, value) => {
            if (err) reject(err);
            resolve(value);
          });
        });

        return res;
      }),
    );
  }

  return router;
}

export default buildFileApi;
