import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { tokenService } from '../containers/auth.container';
import { MainTokenPayload, ParticipantTokenPayload } from '../types/token.types';
import { Errors } from '../utils/errors';
import { asyncHandler } from './errorHandler';

export interface AuthRequest extends Request {
  userUuid: string;
  userRole: 'host' | 'guest';
  nickname?: string;
}

export interface UserRequest extends Request, MainTokenPayload {
  userUuid: MainTokenPayload['sub'];
  userRole: MainTokenPayload['role'];
}

export interface ParticipantRequest extends Request, ParticipantTokenPayload {
  participantUuid: ParticipantTokenPayload['sub'];
  userRole: ParticipantTokenPayload['role'];
  nickname: ParticipantTokenPayload['nickname'];
  calendarId: ParticipantTokenPayload['calendarId'];
  userUuid?: ParticipantTokenPayload['userUuid'];
}

export function isAuthRequest(req: Request): req is AuthRequest & {
  userUuid: string;
  userRole: 'host' | 'guest';
  nickname?: string;
} {
  return typeof req.userUuid === 'string' && (req.userRole === 'host' || req.userRole === 'guest');
}

export function isUserRequest(req: Request): req is UserRequest {
  return typeof req.userUuid === 'string' && (req.userRole === 'host' || req.userRole === 'guest');
}

export function isParticipantRequest(req: Request): req is ParticipantRequest {
  return typeof req.participantUuid === 'string' && typeof req.calendarId === 'string';
}

// JWT 토큰 검증
export const authenticateUser = asyncHandler(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw Errors.Unauthorized('인증 토큰이 필요합니다');
      }

      const decoded = tokenService.verifyMainToken(token);

      req.userUuid = decoded.sub;
      req.userRole = decoded.role;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw Errors.Unauthorized('토큰이 만료되었습니다');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw Errors.Unauthorized('유효하지 않은 토큰입니다');
      } else {
        throw error;
      }
    }
  }
);

export const authenticateParticipant = asyncHandler(
  async (req: ParticipantRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw Errors.Unauthorized('인증 토큰이 필요합니다');
      }

      const decoded = tokenService.verifyParticipantToken(token);

      req.participantUuid = decoded.sub;
      req.userRole = decoded.role;
      req.nickname = decoded.nickname;
      req.calendarId = decoded.calendarId;

      req.userUuid = decoded.userUuid;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw Errors.Unauthorized('토큰이 만료되었습니다');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw Errors.Unauthorized('유효하지 않은 토큰입니다');
      } else {
        throw error;
      }
    }
  }
);

// 역할 기반 권한 확인
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return next(Errors.Unauthorized('인증이 필요합니다'));
    }

    if (!allowedRoles.includes(req.userRole)) {
      return next(Errors.Forbidden('접근 권한이 없습니다'));
    }

    next();
  };
};

// Optional 인증 (로그인 여부와 관계없이)
export const optionalAuth = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = tokenService.verifyMainToken(token);
        req.userUuid = decoded.sub;
        req.userRole = decoded.role;
      }

      next();
    } catch (error) {
      // 토큰이 잘못되어도 계속 진행
      next();
    }
  }
);
