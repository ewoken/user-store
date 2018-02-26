import express from 'express';
import passport from 'passport';
import serviceToRoute from '@ewoken/backend-common/lib/api/serviceToRoute';

function buildUserApi(userService) {
  const router = new express.Router();

  router.post('/signUp', serviceToRoute(userService.signUp));

  router.post('/logIn', passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  router.post(
    '/logInWithToken',
    passport.authenticate('bearer'),
    (req, res) => {
      res.json(req.user);
    },
  );

  // /:id with id !== 'me'
  router.get(/^\/(?!me)(.*)$/, serviceToRoute(userService.getUser));

  router.get('/me', serviceToRoute(userService.getCurrentUser));

  router.patch('/:id', serviceToRoute(userService.updateUser));

  router.post('/logOut', async (req, res) => {
    const serviceResult = await userService.logOut(req.body, {
      user: req.user,
    });
    req.logout();
    res.json(serviceResult);
  });

  if (process.env.NODE_ENV === 'test') {
    // TODO @common
    router.post('/generateToken/:userId', async (req, res) => {
      const token = await userService.generateAuthToken(req.params.userId);
      res.json(token);
    });
    router.delete('/', serviceToRoute(userService.deleteAllUsers));
  }

  return router;
}

export default buildUserApi;
