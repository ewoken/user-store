export const USER = 'USER'
export const SIGNED_UP = 'SIGNED_UP'
export const LOGGED_IN = 'LOGGED_IN'
export const LOGGED_OUT = 'LOGGED_OUT'

function userEvent(eventType) {
  return (user, payload) => ({
    entityType: USER,
    entityId: user.id,
    type: eventType,
    userId: user.id,
    createdAt: new Date(),
    payload,
  })
}

export const signedUp = user => userEvent(SIGNED_UP)(user, user)
export const loggedIn = userEvent(LOGGED_IN)
export const loggedOut = userEvent(LOGGED_OUT)
