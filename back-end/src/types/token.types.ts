import { GoogleProfileData } from '../types/auth.types';

export interface MainTokenPayload {
  sub: string; // user_uuid
  role: 'host';
}

export interface SignupTokenPayload {
  googleProfile: GoogleProfileData;
}

export interface RefreshTokenPayload {
  sub: string; // user_uuid
  tokenId: string;
  role: 'host';
}

export type TokenPayload = MainTokenPayload;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface IRedisBreaker {
  safeGet(key: string): Promise<string | null>;
  safeSetex(key: string, seconds: number, value: string): Promise<void>;
  safeDel(key: string | string[]): Promise<void>;
  safeSadd(key: string, member: string | string[]): Promise<void>;
  safeSrem(key: string, member: string | string[]): Promise<void>;
  safeSmembers(key: string): Promise<string[]>;
  safeExpire(key: string, seconds: number): Promise<void>;
}

export interface ITokenService {
  verifySignupToken(token: string): SignupTokenPayload;
  generateSignupToken(payload: SignupTokenPayload, expiresIn?: string): string;
  generateRefreshToken(sub: string, expiresIn?: string): Promise<string>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
  generateTokenPair(userUuid: string): Promise<TokenPair>;
  refreshAccessToken(refreshToken: string): Promise<TokenPair>;
  revokeRefreshToken(token: string): Promise<boolean>;
  revokeAllRefreshTokens(userUuid: string): Promise<boolean>;
}
