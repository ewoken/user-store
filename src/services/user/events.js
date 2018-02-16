import { omit } from 'ramda';

export const USER = 'USER';
export const SIGNED_UP = 'SIGNED_UP';
export const LOGGED_IN = 'LOGGED_IN';
export const LOGGED_OUT = 'LOGGED_OUT';
export const UPDATED = 'UPDATED';

function userEvent(eventType) {
  return (user, payload) => ({
    entityType: USER,
    entityId: user.id,
    type: eventType,
    authorUserId: user.id,
    createdAt: new Date(),
    payload,
  });
}

export const signedUp = user => ({
  ...userEvent(SIGNED_UP)(user),
  createdAt: user.createdAt,
  payload: omit(['id', 'createdAt', 'updatedAt'])(user),
});
export const loggedIn = userEvent(LOGGED_IN);
export const loggedOut = userEvent(LOGGED_OUT);
export const updated = (user, updates) => ({
  ...userEvent(UPDATED)(user),
  createdAt: user.updatedAt,
  payload: updates,
});
