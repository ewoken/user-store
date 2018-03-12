import { omit } from 'ramda';

export const EMAIL = 'EMAIL';
export const SENT = 'SENT';

export const sent = (
  emailMessage,
  { authorUserId = null, targetUserId = null } = {},
) => ({
  entityType: EMAIL,
  type: SENT,
  entityId: emailMessage.id,
  authorUserId,
  targetUserId,
  createdAt: new Date(),
  payload: omit(
    ['id', 'messageId', 'targetUserId', 'text', 'html'],
    emailMessage,
  ),
});
