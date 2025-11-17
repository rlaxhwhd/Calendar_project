import { Router } from 'express';

import { AUTH_ROUTES, PROXY_ROUTES } from '../constants/routes.constants';
import { authController } from '../containers/auth.container';
import { createAuthRouter } from './auth.routes';
import publicdata from './proxy/publicdata';

const router = Router();
const authRouter = createAuthRouter(authController);

router.use(PROXY_ROUTES.PUBLIC_DATA, publicdata);
router.use(AUTH_ROUTES.BASE, authRouter);

export default router;
