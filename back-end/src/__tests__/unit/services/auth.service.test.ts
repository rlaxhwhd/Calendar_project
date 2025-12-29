import { AuthService } from '../../../services';
import { ITokenService } from '../../../types/token.types';
import { IUserRepository } from '../../../types/user.types';

const mockUserRepository: jest.Mocked<IUserRepository> = {
  findByOauthId: jest.fn(),
  findUserInfoByUuid: jest.fn(),
  getIdUsingUuid: jest.fn(),
  createUser: jest.fn(),
};

const mockTokenService: jest.Mocked<ITokenService> = {
  verifySignupToken: jest.fn(),
  verifyMainToken: jest.fn(),
  verifyUserToken: jest.fn(),
  generateParticipantToken: jest.fn(),
  verifyParticipantToken: jest.fn(),
  generateSignupToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  generateTokenPair: jest.fn(),
  refreshAccessToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  revokeAllRefreshTokens: jest.fn(),
};
