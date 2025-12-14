/**
 * 캘린더 테이블 타입 정의
 * DB: calendars
 */
export interface Calendar {
  id: number;
  slug: string; // 랜덤 토큰 (Ab3dE9xR)
  title: string;
  description: string | null;
  start_date: Date; // 투표 가능 시작일
  end_date: Date; // 투표 가능 종료일
  is_closed: boolean; // 투표 마감 여부
  owner_id: number; // 방장 user ID
  created_at: Date;
  expired_at: Date;
}

export interface SafeCalendar {
  slug: string; // 랜덤 토큰 (Ab3dE9xR)
  title: string;
  description: string | null;
  start_date: Date; // 투표 가능 시작일
  end_date: Date; // 투표 가능 종료일
  is_closed: boolean; // 투표 마감 여부
  hostUuid: string; //useruuid가 아니라 participantuuid넣어야함
  created_at: Date;
  expired_at: Date;
}

// INSERT용
export interface CreateCalendarInput {
  slug: string;
  title: string;
  description?: string;
  start_date: Date | string; // Date 또는 'YYYY-MM-DD' 문자열
  end_date: Date | string;
  owner_id: number;
  expired_at: Date | string;
}

// UPDATE용
export interface UpdateCalendarInput {
  title?: string;
  description?: string;
  start_date?: Date | string;
  end_date?: Date | string;
  is_closed?: boolean;
  expired_at?: Date | string;
}

// 상세 조회용 (JOIN 결과)
export interface CalendarWithOwner extends Calendar {
  owner: {
    id: number;
    email: string;
    nickname: string | null;
    profile_image_url: string | null;
  };
}
