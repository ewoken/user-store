import express from 'express'
import passport from 'passport'

import serviceToRoute from '../utils/serviceToRoute'

function buildUserApi (userService) {
  const router = new express.Router()

  router.post('/signUp', serviceToRoute(userService.signUp))

  router.post('/logIn',
    passport.authenticate('local'),
    function (req, res) {
      res.json(req.user)
    }
  )

  router.get('/account', (req, res) => {
    res.json(req.user)
  })

  router.post('/logOut', (req, res) => {
    req.logout()
    res.json({ logOut: 'OK' })
  })

  return router
}

export default buildUserApi
