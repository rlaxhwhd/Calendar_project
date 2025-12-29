import React from "react";
import { DayPicker, useDayPicker, type WeekdaysProps } from "react-day-picker";

export function WeekdaysWithCaption(props: WeekdaysProps) {
  const weekdayNames = ["S", "M", "T", "W", "T", "F", "S"];  
  const monthLabel = window.iv_month?.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  return (
    <thead>
      <tr
        {...props}
        className={`rdp-weekdays ${props.className ?? ""}`}
        aria-hidden="true"
      >
        {weekdayNames.map((w, i) => (
          <th key={i} className="rdp-weekday" scope="col" aria-label={w}>
            {w}
          </th>
        ))}
      </tr>
      <tr className="rdp-month_inline">
        <th className="rdp-month_inline_cell" colSpan={7}>{monthLabel}</th>
      </tr>
    </thead>
  );
}


