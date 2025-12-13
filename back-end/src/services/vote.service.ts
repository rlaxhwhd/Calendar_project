import { TransactionManager } from '../infrastructure/transaction.manager';
import { DateVoteStatus } from '../models/Vote';
import { IDateOptionRepository } from '../repositories/dateOption.repository';
import { IVoteRepository } from '../repositories/vote.repository';
import { Errors } from '../utils/errors';

export interface IVoteService {
  submitVotes(participantId: number, calendarId: number, selectedDates: string[]): Promise<number>;
  getVotesByParticipant(participantId: number): Promise<any[]>;
  getVoteStatusByCalendar(calendarId: number): Promise<DateVoteStatus[]>;
  deleteVotes(participantId: number): Promise<void>;
}

export class VoteService implements IVoteService {
  constructor(
    private voteRepository: IVoteRepository,
    private dateOptionRepository: IDateOptionRepository
  ) {}

  /**
   * 참가자의 투표 제출 (복수 날짜)
   */
  async submitVotes(
    participantId: number,
    calendarId: number,
    selectedDates: string[]
  ): Promise<number> {
    return TransactionManager.run(async (connection) => {
      if (!selectedDates || selectedDates.length === 0) {
        throw Errors.BadRequest('최소 하나 이상의 날짜를 선택해야 합니다');
      }

      // 날짜 옵션 ID 조회
      const dateOptionIds: number[] = [];

      for (const dateStr of selectedDates) {
        const dateOption = await this.dateOptionRepository.findByCalendarAndDate(
          calendarId,
          dateStr,
          connection
        );

        if (!dateOption) {
          throw Errors.BadRequest(`유효하지 않은 날짜입니다: ${dateStr}`);
        }

        if (!dateOption.is_enabled) {
          throw Errors.BadRequest(`비활성화된 날짜입니다: ${dateStr}`);
        }

        dateOptionIds.push(dateOption.id);
      }

      // 투표 일괄 저장 (기존 투표 삭제 후 새로 저장)
      const count = await this.voteRepository.upsertVotes(
        participantId,
        dateOptionIds,
        'available', // 기본값: 가능,
        connection
      );

      return count;
    });
  }

  /**
   * 참가자의 투표 내역 조회
   */
  async getVotesByParticipant(participantId: number): Promise<any[]> {
    const votes = await this.voteRepository.findAllByParticipant(participantId);

    // 날짜 정보 포함해서 반환
    const result = [];
    for (const vote of votes) {
      const dateOption = await this.dateOptionRepository.findById(vote.date_option_id);
      if (dateOption) {
        result.push({
          vote_id: vote.id,
          date_value: dateOption.date_value,
          vote_type: vote.vote_type,
          created_at: vote.created_at,
        });
      }
    }

    return result;
  }

  /**
   * 캘린더의 날짜별 투표 현황 조회
   */
  async getVoteStatusByCalendar(calendarId: number): Promise<DateVoteStatus[]> {
    return await this.voteRepository.getDateVoteStatus(calendarId);
  }

  /**
   * 참가자의 모든 투표 삭제
   */
  async deleteVotes(participantId: number): Promise<void> {
    await this.voteRepository.deleteAllByParticipant(participantId);
  }
}
