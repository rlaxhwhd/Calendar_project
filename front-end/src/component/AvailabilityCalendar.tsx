import { Main } from "@jsLib/class/Main";
import { PublicdataHolidays } from "@jsLib/class/PublicdataHolidays";
import { useSwipe } from "@jsLib/hooks/useSwipe";
import { uniqueId } from "lodash";
import React, { useRef, useState } from "react";
import { DayPicker, CalendarDay, Modifiers } from "react-day-picker";
import "./AvailabilityCalendar.scss";
import { WeekdaysWithCaption } from "./CustomHead";

export interface AvailabilitySlot {
  start: string; // "09:00"
  end: string; // "10:00"
  label?: string;
}

export const iv_daySlots: Record<string, AvailabilitySlot[]> = {
  "2025-09-03": [
    { start: "09:00", end: "10:00", label: "오전 상담" },
    { start: "14:00", end: "16:00", label: "미팅" },
  ],
  "2025-09-05": [
    { start: "10:30", end: "12:00" },
    { start: "13:30", end: "15:00", label: "후속 미팅" },
    { start: "16:00", end: "18:00" },
  ],
  "2025-09-09": [
    { start: "08:00", end: "09:30", label: "이른 미팅" },
    { start: "11:00", end: "12:00" },
  ],
  "2025-09-12": [{ start: "09:00", end: "11:30", label: "워크샵" }],
  "2025-09-16": [
    { start: "13:00", end: "14:00" },
    { start: "15:00", end: "17:30", label: "상담" },
  ],
  "2025-09-20": [{ start: "10:00", end: "12:00" }],
  "2025-09-23": [
    { start: "09:30", end: "10:30" },
    { start: "14:00", end: "15:30", label: "브리핑" },
  ],
  "2025-09-27": [
    { start: "09:00", end: "10:00" },
    { start: "10:30", end: "12:00" },
    { start: "13:00", end: "14:30" },
  ],
};

/** PublicdataHolidays는 이전에 만든 클래스(공휴일 프록시 호출)를 사용 */
class CalendarMain extends Main {
  public iv_PublicdataHolidays: PublicdataHolidays;

  // 기존 props 대체 인스턴스 변수들
  private iv_today: Date = new Date();
  public get today() {
    return this.iv_today;
  }
  private iv_month: Date; // month
  public get month() {
    return this.iv_month;
  }
  public set month(date: Date) {
    this.iv_month = date;
    window.iv_month = date;
  }
  public iv_blocked: Date[]; // blocked
  public iv_selectedDate: string | null; // selectedDate
  public iv_daySlots: Record<string, AvailabilitySlot[]>; // daySlots

  constructor() {
    super();
    this.iv_PublicdataHolidays = new PublicdataHolidays(
      this.im_forceRender.bind(this)
    );
    const now = new Date();
    this.iv_month = new Date(now.getFullYear(), now.getMonth(), 1);
    this.iv_blocked = [];
    this.iv_selectedDate = null;
    this.iv_daySlots = iv_daySlots;

    // 최초 월의 공휴일 동기화
    this.im_syncHolidaysForMonth();
  }

  /** 기존: monthLabel */
  public get gv_monthLabel(): string {
    // 예: "October 2019" (원문 스타일 유지)
    return this.iv_month.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    // 한국식이 필요하면: "ko-KR" 사용
  }

  /** 기존: onDayToggle */
  public im_onDayToggle = (dateISO: string) => {
    // 선택 토글/차단 토글 로직은 서비스 정책에 맞게.
    // 여기서는 "선택 날짜"만 토글, 차단은 별도 메서드로 분리.
    this.iv_selectedDate = this.iv_selectedDate === dateISO ? null : dateISO;
    this.im_forceRender();
  };

  public im_daySlotsToDates(opts?: {
    mode?: "local" | "utc"; // 기본 'local'
    includeEmpty?: boolean; // 기본 false (빈 배열 날짜 제외)
    sort?: boolean; // 기본 true (오름차순)
  }): Date[] {
    const { mode = "local", includeEmpty = false, sort = true } = opts ?? {};
    if (!this.iv_daySlots) return [];

    const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

    const toDate = (iso: string) => {
      const [y, m, d] = iso.split("-").map(Number);
      return mode === "utc"
        ? new Date(Date.UTC(y, m - 1, d)) // UTC 자정
        : new Date(y, m - 1, d); // 로컬 자정
    };

    const out: Date[] = [];
    for (const [iso, slots] of Object.entries(this.iv_daySlots)) {
      if (!ISO_DATE.test(iso)) continue; // 잘못된 키 스킵
      if (!includeEmpty && (!slots || slots.length === 0)) continue;
      out.push(toDate(iso));
    }
    if (sort) out.sort((a, b) => +a - +b);
    return out;
  }

  /** 차단 토글이 필요하면 */
  public im_toggleBlocked(dateISO: string) {
    const d = CalendarMain.sf_fromISO(dateISO);
    const idx = this.iv_blocked.findIndex((x) =>
      CalendarMain.sf_sameDate(x, d)
    );
    if (idx >= 0) this.iv_blocked.splice(idx, 1);
    else this.iv_blocked.push(d);
    this.im_forceRender();
  }

  /** 기존: onPrevMonth */
  public im_prevMonth = () => {
    this.month = CalendarMain.sf_addMonths(this.iv_month, -1);
    this.im_syncHolidaysForMonth();
  };

  /** 기존: onNextMonth */
  public im_nextMonth = () => {
    this.month = CalendarMain.sf_addMonths(this.iv_month, 1);
    this.im_syncHolidaysForMonth();
  };

  /** 현재 iv_month 기준 공휴일을 불러와 blocked로 반영 */
  private async im_syncHolidaysForMonth() {
    const y = this.iv_month.getFullYear();
    const m = String(this.iv_month.getMonth() + 1).padStart(2, "0");
    this.iv_PublicdataHolidays.im_setYearMonth(y, m);
    await this.iv_PublicdataHolidays.im_fetchHolidays();

    // 공휴일 → blocked 반영
    const days = this.iv_PublicdataHolidays.iv_holidays.map(
      (h) => CalendarMain.sf_fromYYYYMMDD(String(h.locdate)) // 20250914 → Date
    );
    this.iv_blocked = days;
    this.im_forceRender();
  }

  /** 유틸들 */
  public static sf_addMonths(d: Date, diff: number) {
    return new Date(d.getFullYear(), d.getMonth() + diff, 1);
  }
  public static sf_sameDate(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  public static sf_fromYYYYMMDD(s: string) {
    // "20250914" → Date(2025, 8, 14)
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(4, 6)) - 1;
    const d = Number(s.slice(6, 8));
    return new Date(y, m, d);
  }
  public static sf_toISO(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  public static sf_fromISO(s: string) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m as number) - 1, d);
  }
}

export const toLocalISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const parseLocalISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d); // 로컬 자정
};

export default function AvailabilityCalendar() {
  const [lv_Obj] = useState(() => {
    return new CalendarMain();
  });

  lv_Obj.im_Prepare_Hooks(() => {
    window.iv_month = new Date();
  });

  const month = lv_Obj.month;
  const blocked = lv_Obj.iv_blocked;
  const selectedDate = lv_Obj.iv_selectedDate;
  const daySlots = lv_Obj.iv_daySlots;

  const onDayToggle = lv_Obj.im_onDayToggle;
  const onPrevMonth = lv_Obj.im_prevMonth;
  const onNextMonth = lv_Obj.im_nextMonth;
  const wrapRef = useRef<HTMLDivElement>(null);

  useSwipe(wrapRef, {
    onSwipeLeft: onPrevMonth,
    onSwipeRight: onNextMonth,
  });
  const weekendMatcher = { dayOfWeek: [0, 6] }; // 일, 토

  const slotsForSelected: AvailabilitySlot[] = selectedDate
    ? daySlots?.[selectedDate] ?? []
    : [];

  const DayWithCount = (props: { day: CalendarDay; modifiers: Modifiers }) => {
    const { day, modifiers } = props;
    const iso = toLocalISO(day.date);
    const count = iv_daySlots[iso]?.length ?? 0;
    const iv_selectedDate = lv_Obj.iv_selectedDate;

    const showBadge = count > 0 && !modifiers.outside;
    return (
      <>
        <button
          className={`rdp-day_button ${
            iv_selectedDate === iso ? "rdp-selected" : ""
          }`}
          type="button"
          tabIndex={-1}
          aria-label="Sunday, August 31st, 2025"
          onClick={() => {
            if (modifiers.outside) return;
            onDayToggle?.(toLocalISO(day.date));
          }}
        >
          {day.date.getDate()}
          {showBadge && (
            <span className="slot-badge">
              {Array.from({ length: count })
                .slice(0, 3)
                .map((_, i) => (
                  <span key={i + iso} className="dot">
                    •
                  </span>
                ))}
            </span>
          )}
        </button>
      </>
    );
  };

  return (
    <section className="avail-cal cal-swipe" aria-label="Availability calendar">
      <header className="avail-cal__header">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Left arrow separated"
        >
          <path
            d="M20 12H8"
            stroke="#9AA0A6"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <path
            d="M10 6L4 12L10 18"
            stroke="#9AA0A6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="avail-cal__month">Junseok816</h2>
        <div className="cal-icons">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            color="#F44336"
            fill="currentColor"
            className="bi bi-heart-fill"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            color="#000000a8"
            fill="currentColor"
            className="bi bi-three-dots"
            viewBox="0 0 16 16"
          >
            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
          </svg>
        </div>
      </header>
      <div className="nav-header">
        <div className="items">SUMMARY</div>
        <div className="items nav-header__active">CALENDAR</div>
        <div className="items">REVIEWS</div>
      </div>
      <div className="avail-cal__calendar" role="application" ref={wrapRef}>
        <DayPicker
          className="avail-cal__rdp"
          mode="single"
          components={{
            DayButton: DayWithCount,
            Weekdays: WeekdaysWithCaption, // thead 안에 요일+년월 두 줄
          }}
          month={month}
          onMonthChange={(Date: Date) => {
            lv_Obj.month = Date;
            lv_Obj.im_forceRender();
          }}
          fixedWeeks
          showOutsideDays
          modifiers={{
            daySlots: lv_Obj.im_daySlotsToDates(),
            holiday: blocked,
            weekend: weekendMatcher,
            today: lv_Obj.today,
            selectedDate: selectedDate
              ? parseLocalISO(selectedDate)
              : undefined,
          }}
          modifiersClassNames={{
            daySlots: "rdp-dayslots",
            holiday: "rdp-holiday",
            weekend: "rdp-weekend",
            today: "rdp-today",
          }}
        />
      </div>
      <aside className="avail-cal__details" aria-live="polite">
        <h3 className="details__title">{selectedDate ? selectedDate : ""}</h3>
        <ul className="details__list">
          {slotsForSelected.map((slot, i) => (
            <li key={i} className="slot-card">
              <div className="slot-card__label">
                {slot.label ? slot.label : "입력되지 않은 일정"}
              </div>
              <div className="slot-card__time">
                {slot.start} - {slot.end}
              </div>
              <div className="slot-card__icon" aria-hidden />
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
