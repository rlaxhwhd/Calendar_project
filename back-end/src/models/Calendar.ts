/**
 * 캘린더 테이블 타입 정의
 * DB: calendars
 */
export interface Calendar {
  id: number;
  slug: string; // 랜덤 토큰 (Ab3dE9xR)
  title: string;
  description: string | null;
  owner_token: string;
  created_at: Date;
}

// INSERT용
export interface CreateCalendarInput {
  slug: string;
  title: string;
  description?: string;
  owner_token: string;
}

// UPDATE용
export interface UpdateCalendarInput {
  title?: string;
  description?: string;
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
