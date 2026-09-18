"use client";

import { addDaysISO, formatDateLong, todayISO } from "@/lib/time";
import { IconChevronLeft, IconChevronRight } from "./icons";

export function DateNav({ date, onChange, t, locale }) {
  return (
    <div className="date-nav date-nav-pill">
      <button
        type="button"
        className="btn btn-secondary date-nav-arrow"
        aria-label={t.common.previousDay}
        onClick={() => onChange(addDaysISO(date, -1))}
      >
        <IconChevronLeft width="16" height="16" />
      </button>
      <button
        type="button"
        className="btn btn-secondary date-nav-arrow"
        aria-label={t.common.nextDay}
        onClick={() => onChange(addDaysISO(date, 1))}
      >
        <IconChevronRight width="16" height="16" />
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onChange(todayISO())}
      >
        {t.common.today}
      </button>
      <span className="date-nav-label">{formatDateLong(date, locale)}</span>
      <input
        type="date"
        className="input"
        style={{ marginLeft: "auto", maxWidth: 170 }}
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />

      <style jsx>{`
        .date-nav-pill :global(.btn) {
          border-radius: 999px;
        }

        .date-nav-pill :global(.date-nav-arrow) {
          width: 36px;
          height: 36px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .date-nav-pill :global(input.input) {
          border-radius: 999px;
          padding-left: 16px;
          padding-right: 12px;
        }
      `}</style>
    </div>
  );
}