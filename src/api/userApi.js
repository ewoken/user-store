import express from 'express';
import passport from 'passport';
import serviceToRoute from '@ewoken/backend-common/lib/api/serviceToRoute';

function buildUserApi(userService) {
  const router = new express.Router();

  router.post('/signUp', serviceToRoute(userService.signUp));

  router.post('/logIn', passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  router.post('/logInWithToken', serviceToRoute(userService.logInWithToken));

  // /:id with id !== 'me'
  router.get(/^\/(?!me)(.*)$/, serviceToRoute(userService.getUser));

  router.get('/me', serviceToRoute(userService.getCurrentUser));

  router.patch('/:id', serviceToRoute(userService.updateUser));

  router.post('/logOut', async (req, res, next) => {
    try {
      const serviceResult = await userService.logOut(req.body, req.context);
      req.logout();
      res.json(serviceResult);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/sendResetPasswordEmail',
    serviceToRoute(userService.sendResetPasswordEmail),
  );

  router.post('/resetPassword', serviceToRoute(userService.resetPassword));

  if (process.env.NODE_ENV === 'test') {
    router.post('/generateToken/:userId', async (req, res) => {
      const token = await userService.generateAuthToken(req.params.userId);
      res.json(token);
    });
    router.delete('/', serviceToRoute(userService.deleteAllUsers));
  }

  return router;
}

export default buildUserApi;
