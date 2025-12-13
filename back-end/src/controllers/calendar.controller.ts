import { NextFunction, Request, Response } from 'express';

import { isParticipantRequest, isUserRequest } from '../middlewares/auth';
import { Calendar, SafeCalendar } from '../models';
import { ICalendarService } from '../services/calendar.service';
import { IParticipantService } from '../services/participant.service';
import { IUserService } from '../services/user.service';
import { ITokenService } from '../types/token.types';
import { Errors } from '../utils/errors';

export class CalendarController {
  constructor(
    private calendarService: ICalendarService,
    private userService: IUserService,
    private participantService: IParticipantService,
    private tokenService: ITokenService
  ) {}

  /**
   * 새로운 캘린더 생성 (링크 생성)
   * 캘린더 생성할때 방장의 닉네임도 같이 받음
   * POST /api/v1/calendars
   *
   * Body: {
   *   title: string,
   *   start_date: string (YYYY-MM-DD),
   *   end_date: string (YYYY-MM-DD),
   *   description?: string
   *   hostNickname: string
   * }
   */
  public createCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (isUserRequest(req)) {
        throw Errors.Internal('인증 실패');
      }
      const userUuid = req.userUuid;

      if (!userUuid) {
        throw Errors.Unauthorized('로그인이 필요합니다');
      }

      const { title, start_date, end_date, description, hostNickname } = req.body;

      if (!title || !start_date || !end_date || !hostNickname) {
        throw Errors.BadRequest('제목, 시작일, 종료일, 방장닉네임은 필수입니다');
      }

      const userId = await this.userService.getIdUsingUuid(userUuid);

      const result = await this.calendarService.createCalendar(
        userId,
        title,
        start_date,
        end_date,
        description,
        hostNickname
      );

      const participantToken = await this.tokenService.generateParticipantToken({
        sub: result.participantUuid,
        nickname: hostNickname,
        calendarId: result.calendar.slug,
        role: 'host',

        userUuid: userUuid,
      });

      res.status(201).json({
        message: '캘린더가 생성되었습니다',
        calendar: this.changeToSafeCalendar(result.calendar, result.participantUuid),
        shareUrl: result.shareUrl,
        participantToken: participantToken,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Slug로 캘린더 조회 (인증 불필요)
   * GET /api/v1/calendars/:slug
   */
  public getCalendarBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      if (!slug) {
        throw Errors.BadRequest('slug가 필요합니다');
      }

      const calendar = await this.calendarService.getCalendarBySlug(slug);

      const hostUuid = await this.participantService.getParticipantUuidById(calendar.owner_id);

      res.status(200).json({
        calendar: this.changeToSafeCalendar(calendar, hostUuid),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 내가 생성한 캘린더 목록 조회
   * GET /api/v1/calendars/my
   */
  public getMyCalendars = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (isUserRequest(req)) {
        throw Errors.Internal('인증 실패');
      }

      const userUuid = req.userUuid;

      if (!userUuid) {
        throw Errors.Unauthorized('로그인이 필요합니다');
      }

      const userId = await this.userService.getIdUsingUuid(userUuid);

      const calendars = await this.calendarService.getUserCalendars(userId);

      const safeCalendars = calendars.map((calendar) =>
        this.changeToSafeCalendar(calendar, userUuid)
      );

      res.status(200).json({
        calendars: safeCalendars,
        count: safeCalendars.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 캘린더 정보 수정 (방장만)
   * PATCH /api/v1/calendars/:slug
   *
   * Body: {
   *   title?: string,
   *   description?: string,
   *   start_date?: string,
   *   end_date?: string
   * }
   */
  public updateCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (isParticipantRequest(req)) {
        throw Errors.Internal('인증 실패');
      }
      const { slug } = req.params;

      const userUuid = req.participantUuid;
      const userRole = req.userRole;

      if (!slug) {
        throw Errors.BadRequest('slug가 필요합니다');
      }

      if (!userUuid || !userRole) {
        throw Errors.Internal('인증실패');
      }

      if (userRole !== 'host') {
        throw Errors.Forbidden('캘린더 수정은 방장만 가능합니다');
      }

      const { title, description, start_date, end_date } = req.body;

      if (!title && !description && !start_date && !end_date) {
        res.status(200).json({
          message: '변경사항이 없습니다',
        });
      }

      const userId = await this.participantService.getParticipantIdByUuid(userUuid);

      const calendar = await this.calendarService.updateCalendar(slug, userId, {
        title,
        description,
        start_date,
        end_date,
      });

      res.status(200).json({
        message: '캘린더가 수정되었습니다',
        calendar: this.changeToSafeCalendar(calendar, userUuid),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 캘린더 삭제 (방장만)
   * DELETE /api/v1/calendars/:slug
   */
  public deleteCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (isParticipantRequest(req)) {
        throw Errors.Internal('인증 실패');
      }
      const { slug } = req.params;

      const userUuid = req.participantUuid;
      const userRole = req.userRole;

      if (!slug) {
        throw Errors.BadRequest('slug가 필요합니다');
      }

      if (!userUuid || !userRole) {
        throw Errors.Internal('인증실패');
      }

      if (userRole !== 'host') {
        throw Errors.Forbidden('캘린더 수정은 방장만 가능합니다');
      }

      const userId = await this.participantService.getParticipantIdByUuid(userUuid);

      await this.calendarService.deleteCalendar(slug, userId);

      res.status(200).json({
        message: '캘린더가 삭제되었습니다',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 캘린더 마감 (방장만)
   * POST /api/v1/calendars/:slug/close
   */
  public closeCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (isParticipantRequest(req)) {
        throw Errors.Internal('인증 실패');
      }
      const { slug } = req.params;

      const userUuid = req.participantUuid;
      const userRole = req.userRole;

      if (!slug) {
        throw Errors.BadRequest('slug가 필요합니다');
      }

      if (!userUuid || !userRole) {
        throw Errors.Internal('인증실패');
      }

      if (userRole !== 'host') {
        throw Errors.Forbidden('캘린더 마감은 방장만 가능합니다');
      }

      const userId = await this.participantService.getParticipantIdByUuid(userUuid);

      const calendar = await this.calendarService.closeCalendar(slug, userId);

      res.status(200).json({
        message: '캘린더가 마감되었습니다',
        calendar: this.changeToSafeCalendar(calendar, userUuid),
      });
    } catch (error) {
      next(error);
    }
  };

  private changeToSafeCalendar(calendar: Calendar, hostUuid: string): SafeCalendar {
    return {
      slug: calendar.slug,
      title: calendar.title,
      description: calendar.description,
      start_date: calendar.start_date,
      end_date: calendar.end_date,
      is_closed: calendar.is_closed,
      hostUuid: hostUuid,
      created_at: calendar.created_at,
      expired_at: calendar.expried_at,
    };
  }
}
