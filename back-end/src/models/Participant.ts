/**
 * 참가자 테이블 타입 정의
 * DB: participants
 */
export interface Participant {
  id: number;
  calendar_id: number;
  nickname: string;
  color_code: string; // hex 색상 (#FF5733)
  participant_token: string | null;
  joined_at: Date;
}

// INSERT용
export interface CreateParticipantInput {
  calendar_id: number;
  nickname: string;
  color_code: string;
  participant_token?: string;
}

// 닉네임 중복 체크용
export interface ParticipantCheckInput {
  calendar_id: number;
  nickname: string;
}

// 참가자 목록 조회용 (투표 현황 포함)
export interface ParticipantWithVotes extends Participant {
  vote_count: number; // 투표한 날짜 수
  total_dates: number; // 전체 날짜 수
  vote_rate: number; // 투표율 (%)
}
