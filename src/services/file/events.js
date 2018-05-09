import { omit } from 'ramda';

export const FILE = 'FILE';
export const UPLOADED = 'UPLOADED';
export const UPDATED = 'UPDATED';
export const DELETED = 'DELETED';

export function uploaded(file) {
  return {
    type: UPLOADED,
    entityType: FILE,
    entityId: file.id,
    authorUserId: file.uploaderId,
    createdAt: file.createdAt,
    payload: omit(['id', 'createdAt', 'updatedAt'], file),
  };
}

export function updated(file, updates) {
  return {
    type: UPDATED,
    entityType: FILE,
    entityId: file.id,
    createdAt: file.updatedAt,
    payload: updates,
    authorUserId: null,
  };
}

export function deleted(fileId) {
  return {
    type: DELETED,
    entityType: FILE,
    entityId: fileId,
    createdAt: new Date(),
    authorUserId: null,
  };
}
