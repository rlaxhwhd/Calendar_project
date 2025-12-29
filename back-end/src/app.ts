import fs from 'fs';
import path from 'path';
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

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
  })
);
app.use(corsMiddleware);
registerMiddlewares(app);

app.use(requestLogger);
app.use('/api/', rateLimiter);

app.use(API_PREFIX, routes);

const staticRoot = path.resolve(process.cwd(), 'build');
const staticIndex = path.join(staticRoot, 'index.html');
if (fs.existsSync(staticIndex)) {
  app.use(express.static(staticRoot));
  app.get('*', (req, res, next) => {    
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(staticIndex);
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
