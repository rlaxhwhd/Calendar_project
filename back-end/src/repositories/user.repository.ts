import dbpool from '../config/database';
import { CreateUserInput, User } from '../models';
import { IUserRepository } from '../types/user.types';
import { Errors } from '../utils/errors';

export class UserRepository implements IUserRepository {
  constructor(private pool = dbpool) {}

  async findByOauthId(provider: 'google' | 'kakao', oauthId: string): Promise<User | null> {
    const [rows]: any[] = await this.pool.query(
      'SELECT user_uuid, email, oauth_provider, nickname, profile_image_url  FROM users WHERE oauth_provider = ? AND oauth_id = ?',
      [provider, oauthId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  async findUserInfoByUuid(userUuid: string): Promise<User> {
    const [rows]: any[] = await this.pool.query(
      'SELECT user_uuid, email, oauth_provider, nickname, profile_image_url FROM users WHERE user_uuid = ?',
      [userUuid]
    );

    if (rows.length === 0) {
      throw Errors.NotFound('유저 조회 실패');
    }

    return rows[0];
  }

  async createUser(userData: CreateUserInput): Promise<number> {
    const {
      user_uuid,
      email,
      oauth_provider,
      oauth_id,
      nickname,
      profile_image_url,
      isTermsAgreed,
    } = userData;

    const [result]: any = await this.pool.query(
      'INSERT INTO users (user_uuid, email, oauth_provider, oauth_id, nickname, profile_image_url, isTermsAgreed) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_uuid, email, oauth_provider, oauth_id, nickname, profile_image_url, isTermsAgreed]
    );
    return result.affectedRows;
  }
}
