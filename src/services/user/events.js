import { omit } from 'ramda';

export const USER = 'USER';
export const SIGNED_UP = 'SIGNED_UP';
export const LOGGED_IN = 'LOGGED_IN';
export const LOGGED_OUT = 'LOGGED_OUT';
export const UPDATED = 'UPDATED';

// TODO
function userEvent(eventType) {
  return (user, payload) => ({
    entityType: USER,
    entityId: user.id,
    type: eventType,
    userId: user.id,
    createdAt: new Date(),
    payload,
  });
}

export const signedUp = user => ({
  entityType: USER,
  entityId: user.id,
  type: UPDATED,
  userId: user.id,
  createdAt: user.createdAt,
  payload: omit(['createdAt', 'updatedAt'])(user),
});
export const loggedIn = userEvent(LOGGED_IN);
export const loggedOut = userEvent(LOGGED_OUT);
export const updated = (user, updates) => ({
  entityType: USER,
  entityId: user.id,
  type: UPDATED,
  userId: user.id,
  createdAt: user.updatedAt,
  payload: updates,
});
