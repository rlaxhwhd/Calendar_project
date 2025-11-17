import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

import { Errors } from '../utils/errors';

// Body 검증
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 모든 에러 수집
      stripUnknown: true, // 정의되지 않은 필드 제거
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return next(Errors.ValidationError(message, error.details));
    }

    req.body = value; // 검증된 값으로 교체
    next();
  };
};

// Query 검증
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return next(Errors.ValidationError(message, error.details));
    }

    req.query = value;
    next();
  };
};

// Params 검증
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return next(Errors.ValidationError(message, error.details));
    }

    req.params = value;
    next();
  };
};

// 자주 사용하는 스키마 정의
export const schemas = {
  // UUID 검증
  uuidParam: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // 페이지네이션
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  // 날짜 범위
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  }),
};
