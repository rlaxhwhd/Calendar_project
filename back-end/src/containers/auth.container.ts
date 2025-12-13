import { IUserService, UserService } from '@jsLib/services/user.service';

import dbpool from '../config/database';
import { redisClient } from '../config/redis';
import { AuthController } from '../controllers/auth.controller';
import { RedisBlacklistRepository, UserRepository } from '../repositories';
import { AuthService, TokenService } from '../services';
import { IRedisBlacklistRepository, ITokenService } from '../types/token.types';
import { IAuthService, IUserRepository } from '../types/user.types';

const db = dbpool;
export const userRepository: IUserRepository = new UserRepository(db);

const redisBlacklistRepository: IRedisBlacklistRepository = new RedisBlacklistRepository(
  redisClient
);

export const tokenService: ITokenService = new TokenService(redisBlacklistRepository);
export const userService: IUserService = new UserService(userRepository);

const authService: IAuthService = new AuthService(userRepository, tokenService);
export const authController = new AuthController(authService);
