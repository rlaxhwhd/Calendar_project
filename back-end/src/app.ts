import express from 'express';
import helmet from 'helmet';

import { API_PREFIX } from './constants/routes.constants';
import {
  corsMiddleware,
  errorHandler,
  notFoundHandler,
  rateLimiter,
  registerMiddlewares,
  requestLogger,
} from './middlewares';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(corsMiddleware);
registerMiddlewares(app);

app.use(requestLogger);
app.use('/api/', rateLimiter);

app.use(API_PREFIX, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
