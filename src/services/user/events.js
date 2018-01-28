export const USER = 'USER'
export const SIGNED_UP = 'SIGNED_UP'
export const LOGGED_IN = 'LOGGED_IN'
export const LOGGED_OUT = 'LOGGED_OUT'

function _userEvent (eventType) {
  return (user, payload) => ({
    entityType: USER,
    entityId: user._id,
    type: eventType,
    userId: user._id,
    createdAt: new Date(),
    payload
  })
}

export const signedUp = user => _userEvent(SIGNED_UP)(user, user)
export const loggedIn = _userEvent(LOGGED_IN)
export const loggedOut = _userEvent(LOGGED_OUT)
