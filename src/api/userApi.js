import express from 'express';
import passport from 'passport';
import serviceToRoute from '@ewoken/backend-common/lib/api/serviceToRoute';

function buildUserApi(userService) {
  const router = new express.Router();

  router.post('/signUp', serviceToRoute(userService.signUp));

  router.post('/logIn', passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  router.get('/account', serviceToRoute(userService.getAccount));

  router.post('/logOut', async (req, res) => {
    const serviceResult = await userService.logOut(req.body, req.user);
    req.logout();
    res.json(serviceResult);
  });

  if (process.env.NODE_ENV === 'test') {
    // TODO @common
    router.delete('/', serviceToRoute(userService.deleteAllUsers));
  }

  return router;
}

export default buildUserApi;
