import { REFRESH_TOKEN_EXPIRES_IN, REFRESH_TOKEN_PREFIX } from '../constants/token.constants';
import { logger } from '../middlewares/logger';
import {
  IRedisBreaker,
  ITokenService,
  RefreshTokenPayload,
  SignupTokenPayload,
  TokenPair,
} from '../types/token.types';
import { Errors } from '../utils/errors';
import * as jwt from '../utils/jwt';
import { toSeconds } from '../utils/timeConverter';

export class TokenService implements ITokenService {
  constructor(private redisBreaker: IRedisBreaker) {}

  /*
    퍼사드 패턴으로 호출한 유틸 메서드로 반환 --------------------------------
*/

  // 회원가입 토큰----------------------------------------
  public verifySignupToken(token: string) {
    return jwt.verifySignupToken(token);
  }

  public generateSignupToken(payload: SignupTokenPayload, expiresIn?: string): string {
    return jwt.generateSignupToken(payload, expiresIn);
  }

  /*
    리프레쉬 토큰 -----------------------------------------------------------------------
*/
  public async generateRefreshToken(
    sub: string,
    expiresIn: string = REFRESH_TOKEN_EXPIRES_IN
  ): Promise<string> {
    try {
      const { token, tokenId, expiresInSeconds } = jwt.signRefreshToken(sub, expiresIn);

      // Redis에 저장 (토큰 무효화를 위해)
      const redisKey = `${REFRESH_TOKEN_PREFIX}${tokenId}`;
      const userTokenSetKey = `user_tokens:${sub}`;

      await Promise.all([
        this.redisBreaker.safeSetex(redisKey, expiresInSeconds, sub),
        this.redisBreaker.safeSadd(userTokenSetKey, tokenId),
        this.redisBreaker.safeExpire(userTokenSetKey, expiresInSeconds + toSeconds('1d')),
      ]);

      return token;
    } catch (err) {
      throw Errors.Internal('RefreshToken 생성중 오류 발생: ', err);
    }
  }

  //  확장 리팩토링 예정 -------------------
  public async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = jwt.verifyRefreshTokenSignature(token);

    const redisKey = `${REFRESH_TOKEN_PREFIX}${payload.tokenId}`;
    const storedSub = await this.redisBreaker.safeGet(redisKey);

    if (!storedSub) {
      // 나중에 보안 강화 확장 리팩토링
      throw Errors.Unauthorized('Refresh Token이 무효화되었거나 확인할 수 없습니다');
    }

    if (storedSub !== payload.sub) {
      throw Errors.Unauthorized('Refresh Token이 무효화되었습니다');
    }

    return payload;
  }

  public async generateTokenPair(userUuid: string): Promise<TokenPair> {
    const accessToken = jwt.generateMainToken({ sub: userUuid });
    const refreshToken = await this.generateRefreshToken(userUuid);

    return {
      accessToken,
      refreshToken,
    };
  }

  public async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const newTokenPair = await this.generateTokenPair(payload.sub);

    try {
      await this.revokeRefreshToken(refreshToken);
    } catch (err) {
      logger.error('기존 Refresh Token 무효화 실패', err);
    }

    return newTokenPair;
  }

  public async revokeRefreshToken(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verifyRefreshTokenForRevoke(token);

      const redisKey = `${REFRESH_TOKEN_PREFIX}${decoded.tokenId}`;
      const userTokenSetKey = `user_tokens:${decoded.sub}`;

      await Promise.all([
        this.redisBreaker.safeDel(redisKey),
        this.redisBreaker.safeSrem(userTokenSetKey, decoded.tokenId),
      ]);

      return true;
    } catch (err) {
      throw Errors.Internal('Refresh Token무효화 중 오류', err);
    }
  }

  public async revokeAllRefreshTokens(userUuid: string): Promise<boolean> {
    try {
      const userTokenSetKey = `user_tokens:${userUuid}`;
      const tokenIds = await this.redisBreaker.safeSmembers(userTokenSetKey);

      if (!tokenIds || tokenIds.length === 0) {
        logger.debug(`무효화 할 토큰 없음 (사용자: ${userUuid})`);
        return true;
      }

      const allowListKeys = tokenIds.map((tokenId) => `${REFRESH_TOKEN_PREFIX}${tokenId}`);

      await this.redisBreaker.safeDel(allowListKeys);
      await this.redisBreaker.safeDel(userTokenSetKey);

      logger.info(`모든 Refresh Token 무효화 완료 (사용자: ${userUuid})`);
      return true;
    } catch (error) {
      logger.warn(`모든 Refresh Token 무효화 중 예외 발생 (사용자: ${userUuid}):`, error);
      throw Errors.Internal('모든 refresh token무효화 실패', error);
      return false;
    }
  }
}
