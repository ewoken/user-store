import { omit } from 'ramda';

export const TOKEN = 'TOKEN';
export const CREATED = 'CREATED';
export const CONSUMED = 'CONSUMED';

export const created = (token, discardPreviousTokens) => ({
  type: CREATED,
  entityType: TOKEN,
  entityId: token.id,
  authorUserId: null,
  targetUserId: token.userId,
  createdAt: token.createdAt,
  payload: {
    ...omit(['id', 'createdAt'], token),
    discardPreviousTokens,
  },
});

export const consumed = token => ({
  type: CONSUMED,
  entityType: TOKEN,
  entityId: token.id,
  authorUserId: token.userId,
  targetUserId: null,
  createdAt: new Date(),
  payload: null,
});
