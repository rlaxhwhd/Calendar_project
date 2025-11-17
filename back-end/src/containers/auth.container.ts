import dbpool from '../config/database';
import { redisClient } from '../config/redis';
import { AuthController } from '../controllers/auth.controller';
import { RedisBreaker } from '../infrastructure/redisBreaker';
import { logger } from '../middlewares/logger';
import { UserRepository } from '../repositories';
import { AuthService, TokenService } from '../services';
import { IRedisBreaker, ITokenService } from '../types/token.types';
import { IAuthService, IUserRepository } from '../types/user.types';

const db = dbpool;
const userRepository: IUserRepository = new UserRepository(db);

const redisBreaker: IRedisBreaker = new RedisBreaker(redisClient, logger);

const tokenService: ITokenService = new TokenService(redisBreaker);
const authService: IAuthService = new AuthService(userRepository, tokenService);
export const authController = new AuthController(authService);
