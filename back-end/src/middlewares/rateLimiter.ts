import type { Request, Response } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

import { env } from '../config/env';
import { redisClient } from '../config/redis';
import { logger } from './logger';

// ✅ 간단하게 유지
const createRedisStore = (prefix: string) => {
  try {
    if (!redisClient.isOpen) {
      logger.warn('Redis 미연결, 메모리 store 사용');
      return undefined;
    }

    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: `rate_limit:${prefix}:`,
    });
  } catch (error) {
    logger.error('Redis store 생성 실패, 메모리 store 사용', error);
    return undefined;
  }
};

const commonConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  handler: (req: Request, res: Response) => {
    logger.warn({
      message: 'Rate limit exceeded',
      ip: req.ip,
      url: req.originalUrl,
    });

    res.status(429).json({
      success: false,
      message: '요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
};

export const rateLimiter: RateLimitRequestHandler = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: createRedisStore('general'),
  skip: (req) => env.NODE_ENV === 'development',
});

export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  store: createRedisStore('auth'),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900,
    });
  },
});

export const strictRateLimiter: RateLimitRequestHandler = rateLimit({
  ...commonConfig,
  windowMs: 60 * 1000,
  max: 10,
  store: createRedisStore('strict'),
});
