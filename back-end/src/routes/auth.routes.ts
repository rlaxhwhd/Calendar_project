import { Router } from 'express';

import { AUTH_ROUTES } from '../constants/routes.constants';
import { AuthController } from '../controllers/auth.controller';

export const createAuthRouter = (controller: AuthController): Router => {
  const router = Router();

  router.get(AUTH_ROUTES.GOOGLE, controller.redirectToGoogle);
  router.get(AUTH_ROUTES.GOOGLE_CALLBACK, controller.handleGoogleCallback);
  router.post(AUTH_ROUTES.SIGNUP, controller.handleGoogleSignup);
  router.post(AUTH_ROUTES.REFRESH, controller.refreshToken);
  router.post(AUTH_ROUTES.LOGOUT, controller.logout);

  return router;
};
