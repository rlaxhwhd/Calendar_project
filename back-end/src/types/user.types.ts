import { CreateUserInput, User } from '../models';
import { OAuthCallbackResponse } from './auth.types';
import { TokenPair } from './token.types';

export interface IUserRepository {
  findByOauthId(provider: 'google' | 'kakao', oauthId: string): Promise<User | null>;
  findUserInfoByUuid(userUuid: string): Promise<User>;
  createUser(userData: CreateUserInput): Promise<number>;
}

export interface IAuthService {
  handleGoogleCallback(code: string): Promise<OAuthCallbackResponse>;
  handleGoogleSignup(
    signUpToken: string,
    isTermsAgreed: boolean
  ): Promise<{ tokenPair: TokenPair; user: User }>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
  revokeRefreshToken(token: string): Promise<void>;
}
