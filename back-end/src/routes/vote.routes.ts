import { Router } from 'express';

import { VOTE_ROUTES } from '../constants/routes.constants';
import { VoteController } from '../controllers/vote.controller';
import { authenticateParticipant } from '../middlewares/auth';

export const createVoteRouter = (controller: VoteController): Router => {
  const router = Router({ mergeParams: true });

  /**
   * POST /api/v1/calendars/:slug/votes
   * 투표 제출 (복수 날짜 선택)
   *
   * Headers: { x-participant-token: string }
   * Body: { selectedDates: string[] (YYYY-MM-DD) }
   * Response: { message, votedCount, selectedDates }
   */
  router.post('/', authenticateParticipant, controller.submitVotes);

  /**
   * GET /api/v1/calendars/:slug/votes
   * 캘린더의 투표 현황 조회 (날짜별)
   *
   * Response: { calendar, voteStatus: DateVoteStatus[] }
   */
  router.get('/', controller.getVoteStatus);

  /**
   * GET /api/v1/calendars/:slug/votes/:participantId
   * 특정 참가자의 투표 내역 조회
   *
   * Response: { participant, votes, voteCount }
   */
  router.get(VOTE_ROUTES.CHECK_VOTE, controller.getParticipantVotes);
  return router;
};
