import { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { REFRESH_TOKEN_EXPIRES_IN } from '../constants/token.constants';
import { isUserRequest } from '../middlewares/auth';
import { User } from '../models';
import { OAuthCallbackResponse, SafeUser } from '../types/auth.types';
import { TokenPair } from '../types/token.types';
import { IAuthService } from '../types/user.types';
import { Errors } from '../utils/errors';
import { toSeconds } from '../utils/timeConverter';

export class AuthController {
  constructor(private authService: IAuthService) {}

  // 구글 OAuth 리디렉션
  public redirectToGoogle = (req: Request, res: Response) => {
    const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${env.BACKEND_URL}/api/v1/auth/google/callback&response_type=code&scope=email profile`;
    res.redirect(googleLoginUrl);
  };

  // 구글 OAuth 콜백 처리 (신규/기존 사용자 구분, 기존 사용자 바로 로그인)
  public handleGoogleCallback = async (req: Request, res: Response, next: NextFunction) => {
    const { code } = req.query; // 구글에서 보내준 인증 코드

    try {
      const oAuthCallbackResponse: OAuthCallbackResponse =
        await this.authService.handleGoogleCallback(code as string);

      if (oAuthCallbackResponse.type == 'pendingSignup') {
        // 신규 사용자 처리 로직 (회원가입 페이지로 리디렉션)
        return res.status(200).json({
          message: '신규 사용자입니다. 회원가입을 진행해주세요.',
          token: oAuthCallbackResponse.signupToken,
        });
      }

      // JWT 토큰을 쿠키에 저장
      res.cookie('jwt', oAuthCallbackResponse.token.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        maxAge: toSeconds(REFRESH_TOKEN_EXPIRES_IN),
      });

      res.redirect('/main');
    } catch (error) {
      next(error); // 에러 발생 시 errorHandler 미들웨어로 전달
    }
  };

  public handleGoogleSignup = async (req: Request, res: Response, next: NextFunction) => {
    const { token, isTermsAgreed } = req.body; // 프론트엔드에서 전달된 임시 토큰

    try {
      const signupResponse = await this.authService.handleGoogleSignup(token, isTermsAgreed);

      // JWT 토큰을 쿠키에 저장
      res.cookie('jwt', signupResponse.tokenPair.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        maxAge: toSeconds(REFRESH_TOKEN_EXPIRES_IN),
      });

      res.status(200).json({
        message: '회원가입 및 로그인 성공',
        token: signupResponse.tokenPair.accessToken,
        user: this.changeToSafeUser(signupResponse.user),
      });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshTokenCookie = req.cookies.jwt;
      if (!refreshTokenCookie) {
        throw Errors.Unauthorized('Refresh Token이 제공되지 않았습니다');
      }

      const newTokenPair: TokenPair = await this.authService.refreshToken(refreshTokenCookie);

      // 새로운 Refresh Token을 쿠키에 저장
      res.cookie('jwt', newTokenPair.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        maxAge: toSeconds(REFRESH_TOKEN_EXPIRES_IN),
      });

      res.status(200).json({
        message: '토큰 갱신 성공',
        accessToken: newTokenPair.accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isUserRequest(req)) {
        throw Errors.Internal('인증 실패');
      }

      const user = await this.authService.getUserByUuid(req.userUuid);

      res.status(200).json({
        message: '사용자 정보 조회 성공',
        user: this.changeToSafeUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshTokenCookie = req.cookies.jwt;
      if (!refreshTokenCookie) {
        throw Errors.Unauthorized('Refresh Token이 제공되지 않았습니다');
      }

      await this.authService.revokeRefreshToken(refreshTokenCookie);

      // 쿠키에서 JWT 토큰 삭제
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
      });

      res.status(200).json({ message: '로그아웃 성공' });
    } catch (error) {
      next(error);
    }
  };

  private changeToSafeUser(user: User): SafeUser {
    return {
      user_uuid: user.user_uuid,
      email: user.email,
      oauth_provider: user.oauth_provider,
      nickname: user.nickname,
      profile_image_url: user.profile_image_url,
      isTermsAgreed: user.isTermsAgreed,
      created_at: user.created_at,
    };
  }
}
