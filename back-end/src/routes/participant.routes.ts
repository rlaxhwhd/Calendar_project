import { Router } from 'express';

import { PARTICIPANT_ROUTES } from '../constants/routes.constants';
import { ParticipantController } from '../controllers/participant.controller';
import { optionalAuth } from '../middlewares';
import { authenticateParticipant } from '../middlewares/auth';

export const createParticipantRouter = (controller: ParticipantController): Router => {
  const router = Router({ mergeParams: true });

  /**
   * POST /api/v1/calendars/:slug/participants
   * 참가자 등록 (회원가입)
   *
   * Body: { nickname: string, password: string }
   * Response: { participant, participantToken }
   */
  router.post('/', optionalAuth, controller.registerParticipant);

  /**
   * POST /api/v1/calendars/:slug/participants/login
   * 참가자 로그인
   *
   * Body: { nickname: string, password: string }
   * Response: { participant, participantToken }
   */
  router.post(PARTICIPANT_ROUTES.LOGIN, optionalAuth, controller.loginParticipant);

  /**
   * GET /api/v1/calendars/:slug/participants
   * 캘린더의 모든 참가자 조회 (투표율 포함)
   *
   * Response: { participants: ParticipantWithVotes[] }
   */
  router.get('/', controller.getParticipants);

  /**
 * DELETE /api/v1/calendars/:slug/participants/self
 * 참가자 삭제 (본인만 가능, participantToken 필요)
 *

 */
  router.delete(
    PARTICIPANT_ROUTES.DELETE_SELF,
    authenticateParticipant,
    controller.deleteParticipantSelf
  );

  router.delete(
    PARTICIPANT_ROUTES.DELETE_BY_HOST,
    authenticateParticipant,
    controller.deleteParticipantAsHost
  );

  return router;
};
