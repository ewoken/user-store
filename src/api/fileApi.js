import express from 'express';
import config from 'config';

import serviceToRoute from '@ewoken/backend-common/lib/api/serviceToRoute';
import { ValidationError } from '@ewoken/backend-common/lib/errors';
import getStorage from '../utils/fileStorages';

const fileApiConfig = config.get('api.file');

function buildFileApi(fileService) {
  const router = new express.Router();
  const fileStorage = getStorage(fileApiConfig);

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
    fileStorage.uploadMiddleware,
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
        res.download(fileStorage.getFilePath(file.id), file.filename, error =>
          next(error),
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

      await fileStorage.deleteFiles(fileIds);

      return res;
    }),
  );

  if (process.env.NODE_ENV === 'test') {
    router.delete(
      '/*',
      serviceToRoute(async () => {
        const res = await fileService.deleteAllFiles();

        await fileStorage.deleteAllFiles();

        return res;
      }),
    );
  }

  return router;
}

export default buildFileApi;
