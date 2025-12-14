import { NextFunction, Request, Response } from 'express';

import { isAuthRequest, isParticipantRequest } from '../middlewares/auth';
import { logger } from '../middlewares/logger';
import { ParticipantServiceInput } from '../models';
import { ICalendarService } from '../services/calendar.service';
import { IParticipantService } from '../services/participant.service';
import { IUserService } from '../services/user.service';
import { getIO } from '../sockets';
import { ITokenService } from '../types/token.types';
import { Errors } from '../utils/errors';

export class ParticipantController {
  constructor(
    private participantService: IParticipantService,
    private calendarService: ICalendarService,
    private userService: IUserService,
    private tokenService: ITokenService
  ) {}

  /**
   * 참가자 등록 (닉네임 + 비밀번호)
   * POST /api/v1/calendars/:slug/participants
   *
   * Body: {
   *   nickname: string,
   *   password?: string
   * }
   */
  public registerParticipant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isAuthRequest(req)) {
        throw Errors.Internal('인증실패 혹은 잘못된 토큰');
      }
      const { slug } = req.params;
      const { nickname, password } = req.body;

      const userUuid = req.userUuid;

      if (!slug) {
        throw Errors.BadRequest('slug가 필요합니다');
      }

      if (!nickname) {
        throw Errors.BadRequest('닉네임은 필수입니다');
      }

      // 캘린더 존재 확인
      const calendar = await this.calendarService.getCalendarBySlug(slug);

      // 마감된 캘린더는 참가 불가
      if (calendar.is_closed) {
        throw Errors.BadRequest('마감된 캘린더에는 참가할 수 없습니다');
      }

      let participantServiceInput: ParticipantServiceInput;

      if (userUuid) {
        const userId = await this.userService.getIdUsingUuid(userUuid);

        participantServiceInput = {
          role: 'guest',
          calendarId: calendar.id,
          nickname: nickname,
          userId: userId,
        };
      } else {
        if (!password) {
          throw Errors.BadRequest('게스트는 비번이 필수입니다');
        }

        participantServiceInput = {
          role: 'guest',
          calendarId: calendar.id,
          nickname: nickname,
          password: password,
        };
      }

      const result = await this.participantService.registerParticipant(participantServiceInput);

      const accessToken = this.tokenService.generateParticipantToken({
        sub: result.participant.participant_uuid,
        nickname: result.participant.nickname,
        calendarId: slug,
        role: result.participant.role,

        userUuid: userUuid,
      });

      res.status(201).json({
        message: '참가자 등록이 완료되었습니다',
        participant: {
          uuid: result.participant.participant_uuid,
          nickname: result.participant.nickname,
          color_code: result.participant.color_code,
          joined_at: result.participant.joined_at,
          role: result.participant.role,
        },
        participantToken: accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 참가자 로그인 (닉네임 + 비밀번호)
   * POST /api/v1/calendars/:slug/participants/login
   *
   * Body: {
   *   nickname?: string,
   *   password?: string
   * }
   */
  public loginParticipant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isAuthRequest(req)) {
        throw Errors.Internal('인증실패 혹은 잘못된 토큰');
      }
      const { slug } = req.params;
      const { nickname, password } = req.body;
      const userUuid = req.userUuid;

      if (!slug) {
        throw Errors.BadRequest('slug가 필요합니다');
      }

      // 캘린더 존재 확인
      const calendar = await this.calendarService.getCalendarBySlug(slug);

      let result;
      if (userUuid) {
        const userId = await this.userService.getIdUsingUuid(userUuid);

        result = await this.participantService.loginGuestUserAsParticipant(calendar.id, userId);
      } else {
        if (!nickname || !password) {
          throw Errors.BadRequest('닉네임과 비밀번호는 필수입니다');
        }
        result = await this.participantService.loginParticipant(calendar.id, nickname, password);
      }

      const participantToken = await this.tokenService.generateParticipantToken({
        sub: result.participantUuid,
        nickname: result.participant.nickname,
        role: result.participant.role,
        calendarId: slug,

        userUuid: userUuid,
      });

      res.status(200).json({
        message: '로그인 성공',
        participant: {
          uuid: result.participant.participant_uuid,
          nickname: result.participant.nickname,
          color_code: result.participant.color_code,
          joined_at: result.participant.joined_at,
        },
        participantToken: participantToken,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 캘린더의 참가자 목록 조회 (투표 현황 포함)
   * GET /api/v1/calendars/:slug/participants
   */
  public getParticipants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      if (!slug) {
        throw Errors.BadRequest('slug가 필요합니다');
      }

      // 캘린더 존재 확인
      const calendar = await this.calendarService.getCalendarBySlug(slug);

      const participants = await this.participantService.getParticipantsWithVotes(calendar.id);

      // 비밀번호 해시 제거
      const sanitizedParticipants = participants.map((p) => ({
        uuid: p.participant_uuid,
        nickname: p.nickname,
        color_code: p.color_code,
        joined_at: p.joined_at,
        vote_count: p.vote_count,
        total_dates: p.total_dates,
        vote_rate: p.vote_rate,
      }));

      res.status(200).json({
        participants: sanitizedParticipants,
        count: sanitizedParticipants.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 참가자 삭제 (본인만, 비밀번호 확인)
   * DELETE /api/v1/calendars/:slug/participants/self
   *
   * Body: {
   * }
   */
  public deleteParticipantSelf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isParticipantRequest(req)) {
        throw Errors.Internal('인증실패 혹은 잘못된 토큰');
      }
      const { slug } = req.params;

      const targetUuid = req.participantUuid;
      const userRole = req.userRole;

      if (!slug) {
        throw Errors.BadRequest('slug가 필요합니다');
      }

      if (!targetUuid || !userRole) {
        throw Errors.Internal('인증정보가 없습니다.');
      }

      if (userRole === 'host') {
        throw Errors.BadRequest('방장은 방장을 삭제할 수 없습니다 캘린더 삭제 이용.');
      }

      // 캘린더 존재 확인
      const calendar = await this.calendarService.getCalendarBySlug(slug);

      const participantId = await this.participantService.getParticipantIdByUuid(targetUuid);

      await this.participantService.deleteParticipant(participantId, calendar.id);

      const io = getIO();

      const sockets = await io.in(slug).fetchSockets();

      for (const socket of sockets) {
        if (socket.data.sub === targetUuid) {
          socket.disconnect(true);
          logger.warn(`삭제된 유저(${targetUuid}) 소켓 연결 해제`);
        }
      }

      res.status(200).json({
        message: '참가자가 삭제되었습니다',
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteParticipantAsHost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isParticipantRequest(req)) {
        throw Errors.Internal('인증실패 혹은 잘못된 토큰');
      }
      const { slug, uuid } = req.params;
      const targetUuid = uuid;

      if (!slug) {
        throw Errors.BadRequest('slug가 필요합니다');
      }

      if (!targetUuid) {
        throw Errors.BadRequest('삭제할 타겟이 필요합니다');
      }

      const userParticipantUuid = req.participantUuid;
      const userParticipantRole = req.userRole;

      if (!userParticipantUuid || !userParticipantRole) {
        throw Errors.Internal('인증 실패');
      }

      if (userParticipantRole !== 'host') {
        throw Errors.Forbidden('강퇴 권한이 없음');
      }

      if (!req.userUuid) {
        throw Errors.Unauthorized('잘못된 토큰');
      }

      if (userParticipantUuid === targetUuid) {
        throw Errors.BadRequest('방장은 방장을 삭제할 수 없습니다 캘린더 삭제 이용.');
      }

      const calendar = await this.calendarService.getCalendarBySlug(slug);

      const targetId = await this.participantService.getParticipantIdByUuid(targetUuid);

      await this.participantService.deleteParticipant(targetId, calendar.id);

      const io = getIO();

      const sockets = await io.in(slug).fetchSockets();

      for (const socket of sockets) {
        if (socket.data.sub === targetUuid) {
          socket.disconnect(true);
          logger.warn(`삭제된 유저(${targetUuid}) 소켓 연결 해제`);
        }
      }

      res.status(200).json({
        message: '참가자가 삭제되었습니다',
      });
    } catch (error) {
      next(error);
    }
  };
}
