import Joi from 'joi';
import config from 'config';

export const TEMPORARY_FILE_TYPE = 'TEMPORARY_FILE_TYPE';
export const FILE_ID_LENGTH = config.get('services.fileService.fileIdLength');

export const FileId = Joi.string().length(FILE_ID_LENGTH);
export const FileIds = Joi.array()
  .single()
  .items(FileId)
  .min(1)
  .max(10)
  .unique();
const DomainType = Joi.string();

export const FileInput = Joi.object({
  id: FileId.required(),
  filename: Joi.string().required(),
  mimeType: Joi.string().required(),
  size: Joi.number().required(),
  domainType: DomainType.default(TEMPORARY_FILE_TYPE),
});

export const FileInputs = Joi.array()
  .single()
  .items(FileInput)
  .min(1)
  .max(10)
  .unique((file1, file2) => file1.id === file2.id);

export const SetDomainTypeInput = Joi.object({
  fileIds: FileIds.required(),
  domainType: DomainType.required().not(TEMPORARY_FILE_TYPE),
});

export const File = FileInput.keys({
  uploaderId: Joi.string()
    .allow(null)
    .required(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
});
