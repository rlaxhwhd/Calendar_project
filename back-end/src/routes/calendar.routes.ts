import { Router } from 'express';

import { CALENDAR_ROUTES } from '../constants/routes.constants';
import { CalendarController } from '../controllers/calendar.controller';
import { authenticateParticipant, authenticateUser } from '../middlewares/auth';

export const createCalendarRouter = (controller: CalendarController): Router => {
  const router = Router();

  /**
   * 캘린더 생성 (Google 로그인 필요)
   * POST /api/v1/calendars
   */
  router.post('/', authenticateUser, controller.createCalendar);

  /**
   * 내 캘린더 목록 조회 (Google 로그인 필요)
   * GET /api/v1/calendars/my
   */
  router.get(CALENDAR_ROUTES.MY_CALENDAR_LIST, authenticateUser, controller.getMyCalendars);

  /**
   * Slug로 캘린더 조회 (인증 불필요)
   * GET /api/v1/calendars/:slug
   */
  router.get(CALENDAR_ROUTES.CALENDAR_SLUG, controller.getCalendarBySlug);

  /**
   * 캘린더 정보 수정 (방장만)
   * PATCH /api/v1/calendars/:slug
   */
  router.patch(CALENDAR_ROUTES.CALENDAR_SLUG, authenticateParticipant, controller.updateCalendar);

  /**
   * 캘린더 삭제 (방장만)
   * DELETE /api/v1/calendars/:slug
   */
  router.delete(CALENDAR_ROUTES.CALENDAR_SLUG, authenticateParticipant, controller.deleteCalendar);

  /**
   * 캘린더 마감 (방장만)
   * POST /api/v1/calendars/:slug/close
   */
  router.post(CALENDAR_ROUTES.CALENDAR_CLOSE, authenticateParticipant, controller.closeCalendar);

  return router;
};
