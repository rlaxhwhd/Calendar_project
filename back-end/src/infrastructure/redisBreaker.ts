import Opossum from 'opossum';
import { RedisClientType } from 'redis';
import { Logger } from 'winston';

import { IRedisBreaker } from '../types/token.types';
import { Errors } from '../utils/errors';

// --- 서킷 브레이커 옵션 ---
const breakerOptions = {
  timeout: 3000, // 3초 내 응답 없으면 실패
  errorThresholdPercentage: 50, // 10초간 50% 이상 실패 시 차단
  resetTimeout: 30000, // 30초 후 Half-Open 상태로 전환
  rollingCountTimeout: 10000, // 10초 간격으로 상태 점검
  rollingCountBuckets: 10, // 1초 단위 버킷
  volumeThreshold: 5, // 최소 5회 호출 후 상태 점검
};

export class RedisBreaker implements IRedisBreaker {
  private redisGetBreaker: Opossum<[string], string | null>;
  private redisSetBreaker: Opossum<[string, number, string], string | null>;
  private redisDelBreaker: Opossum<[string | string[]], number>;
  private redisSaddBreaker: Opossum<[string, string | string[]], number>;
  private redisSremBreaker: Opossum<[string, string | string[]], number>;
  private redisSmembersBreaker: Opossum<[string], string[]>;
  private redisExpireBreaker: Opossum<[string, number], number>;

  constructor(
    private redis: RedisClientType,
    private logger: Logger
  ) {
    this.redisGetBreaker = new Opossum<[string], string | null>(
      (key: string) => this.redis.get(key),
      breakerOptions
    );

    this.redisSetBreaker = new Opossum<[string, number, string], string | null>(
      (key: string, seconds: number, value: string) => this.redis.setEx(key, seconds, value),
      breakerOptions
    );

    this.redisDelBreaker = new Opossum<[string | string[]], number>(
      (key: string | string[]) => this.redis.del(key),
      breakerOptions
    );

    this.redisSaddBreaker = new Opossum<[string, string | string[]], number>(
      (key: string, member: string | string[]) => this.redis.sAdd(key, member),
      breakerOptions
    );

    this.redisSremBreaker = new Opossum<[string, string | string[]], number>(
      (key: string, member: string | string[]) => this.redis.sRem(key, member),
      breakerOptions
    );

    this.redisSmembersBreaker = new Opossum<[string], string[]>(
      (key: string) => this.redis.sMembers(key),
      breakerOptions
    );

    this.redisExpireBreaker = new Opossum<[string, number], number>(
      (key: string, seconds: number) => this.redis.expire(key, seconds),
      breakerOptions
    );

    this.setupEventListeners();
  }
  public async safeGet(key: string): Promise<string | null> {
    try {
      return await this.redisGetBreaker.fire(key);
    } catch (error) {
      this.logger.error(`Redis safeGet 실패 [${key}]:`, error);
      throw Errors.Internal(`Redis safeGet 실패: ${error}`);
    }
  }

  public async safeSetex(key: string, seconds: number, value: string): Promise<void> {
    try {
      await this.redisSetBreaker.fire(key, seconds, value);
    } catch (error) {
      this.logger.error(`Redis safeSetex 실패 [${key}]:`, error);
      throw Errors.Internal(`Redis safeSetex 실패: ${error}`);
    }
  }

  public async safeDel(key: string | string[]): Promise<void> {
    try {
      await this.redisDelBreaker.fire(key);
    } catch (error) {
      this.logger.error(`Redis safeDel 실패 [${key}]:`, error);
      throw Errors.Internal(`Redis safeDel 실패: ${error}`);
    }
  }

  public async safeSadd(key: string, member: string | string[]): Promise<void> {
    try {
      await this.redisSaddBreaker.fire(key, member);
    } catch (error) {
      this.logger.error(`Redis safeSadd 실패 [${key}]:`, error);
      throw Errors.Internal(`Redis safeSadd 실패: ${error}`);
    }
  }

  public async safeSrem(key: string, member: string | string[]): Promise<void> {
    try {
      await this.redisSremBreaker.fire(key, member);
    } catch (error) {
      this.logger.error(`Redis safeSrem 실패 [${key}]:`, error);
      throw Errors.Internal(`Redis safeSrem 실패: ${error}`);
    }
  }

  public async safeSmembers(key: string): Promise<string[]> {
    try {
      return await this.redisSmembersBreaker.fire(key);
    } catch (error) {
      this.logger.error(`Redis safeSmembers 실패 [${key}]:`, error);
      throw Errors.Internal(`Redis safeSmembers 실패: ${error}`);
    }
  }

  public async safeExpire(key: string, seconds: number): Promise<void> {
    try {
      await this.redisExpireBreaker.fire(key, seconds);
    } catch (error) {
      this.logger.error(`Redis safeExpire 실패 [${key}]:`, error);
      throw Errors.Internal(`Redis safeExpire 실패: ${error}`);
    }
  }

  private setupEventListeners() {
    this.redisGetBreaker.on('open', () =>
      this.logger.error('[CircuitBreaker] Redis GET Breaker가 OPEN 상태입니다.')
    );
    this.redisGetBreaker.on('close', () =>
      this.logger.info('[CircuitBreaker] Redis GET Breaker가 CLOSED 상태입니다.')
    );
    this.redisGetBreaker.on('failure', (err) =>
      this.logger.warn('[CircuitBreaker] Redis GET이 실패했습니다.', err)
    );

    this.redisSetBreaker.on('open', () =>
      this.logger.error('[CircuitBreaker] Redis SETEX Breaker가 OPEN 상태입니다.')
    );
    this.redisSetBreaker.on('failure', (err) =>
      this.logger.warn('[CircuitBreaker] Redis SETEX가 실패했습니다.', err)
    );

    this.redisSaddBreaker.on('open', () =>
      this.logger.error('[CircuitBreaker] Redis SADD Breaker가 OPEN 상태입니다.')
    );
    this.redisSaddBreaker.on('failure', (err) =>
      this.logger.warn('[CircuitBreaker] Redis SADD가 실패했습니다.', err)
    );

    this.redisSmembersBreaker.on('open', () =>
      this.logger.error('[CircuitBreaker] Redis SMEMBERS Breaker가 OPEN 상태입니다.')
    );
    this.redisSmembersBreaker.on('failure', (err) =>
      this.logger.warn('[CircuitBreaker] Redis SMEMBERS가 실패했습니다.', err)
    );
  }
}
