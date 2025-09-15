// AvailabilityCalendar.tsx
// ──────────────────────────────────────────────────────────────────────────────
// Presentational-only calendar UI. No state management. No Tailwind/Bootstrap.
// Hook up your own logic via the provided props.

import { Main } from "@jsLib/class/Main";
import { PublicdataHolidays } from "@jsLib/class/PublicdataHolidays";
import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import "./AvailabilityCalendar.scss";

export interface AvailabilitySlot {
  start: string; // "09:00"
  end: string; // "10:00"
  label?: string;
}

/** PublicdataHolidays는 이전에 만든 클래스(공휴일 프록시 호출)를 사용 */
class CalendarMain extends Main {
  public iv_PublicdataHolidays: PublicdataHolidays;

  // 기존 props 대체 인스턴스 변수들
  private iv_today: Date = new Date();
  public get today() {
    return this.iv_today;
  }
  public iv_month: Date; // month
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
    this.iv_daySlots = {};

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
    this.iv_month = CalendarMain.sf_addMonths(this.iv_month, -1);
    this.im_syncHolidaysForMonth();
  };

  /** 기존: onNextMonth */
  public im_nextMonth = () => {
    this.iv_month = CalendarMain.sf_addMonths(this.iv_month, 1);
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
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);           // 로컬 자정
};

export default function AvailabilityCalendar() {
  const [lv_Obj] = useState(() => {
    return new CalendarMain();
  });

  lv_Obj.im_Prepare_Hooks(() => {});

  const monthLabel = lv_Obj.gv_monthLabel;
  const month = lv_Obj.iv_month;
  const blocked = lv_Obj.iv_blocked;
  const selectedDate = lv_Obj.iv_selectedDate;
  const daySlots = lv_Obj.iv_daySlots;

  const onDayToggle = lv_Obj.im_onDayToggle;
  const onPrevMonth = lv_Obj.im_prevMonth;
  const onNextMonth = lv_Obj.im_nextMonth;
  const weekendMatcher = { dayOfWeek: [0, 6] }; // 일, 토

  const slotsForSelected: AvailabilitySlot[] = selectedDate
    ? daySlots?.[selectedDate] ?? []
    : [];

  return (
    <section className="avail-cal" aria-label="Availability calendar">
      <header className="avail-cal__header">
        <button
          type="button"
          className="avail-cal__nav-btn avail-cal__nav-btn--prev"
          aria-label="Previous month"
          onClick={onPrevMonth}
        >
          ‹
        </button>
        <h2 className="avail-cal__month">{monthLabel}</h2>
        <button
          type="button"
          className="avail-cal__nav-btn avail-cal__nav-btn--next"
          aria-label="Next month"
          onClick={onNextMonth}
        >
          ›
        </button>
      </header>

      <div className="avail-cal__calendar" role="application">
        <DayPicker
          className="avail-cal__rdp"
          mode="single"
          month={month}
          onMonthChange={(Date:Date)=>{
            lv_Obj.iv_month = Date;
            lv_Obj.im_forceRender();
          }}          
          fixedWeeks
          showOutsideDays
          modifiers={{
            holiday: blocked,
            weekend: weekendMatcher,
            today: lv_Obj.today,
            selectedDate:selectedDate ? parseLocalISO(selectedDate) : undefined
          }}
          modifiersClassNames={{
            holiday: "rdp-holiday",
            weekend: "rdp-weekend",
            today: "rdp-today",
          }}
          onDayClick={(day, modifiers) => {
            if (modifiers.outside) return;
            onDayToggle?.(toLocalISO(day));
          }}
        />
        <div className="avail-cal__legend">
          <span className="legend-dot legend-dot--blocked" /> 불가
          <span className="legend-sep" />
          <span className="legend-dot legend-dot--ok" /> 가능
        </div>
      </div>
      <aside className="avail-cal__details" aria-live="polite">
        <h3 className="details__title">
          {selectedDate ? selectedDate : "선택한 날짜"}
        </h3>
        <ul className="details__list">
          {slotsForSelected.map((slot, i) => (
            <li key={i} className="slot-card">
              <div className="slot-card__label">Available</div>
              <div className="slot-card__time">{slot.label}</div>
              <div className="slot-card__icon" aria-hidden />
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
