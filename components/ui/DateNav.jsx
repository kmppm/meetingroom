"use client";

import { addDaysISO, formatDateLong, todayISO } from "@/lib/time";
import { IconChevronLeft, IconChevronRight } from "./icons";

export function DateNav({ date, onChange, t, locale }) {
  return (
    <div className="date-nav date-nav-pill">
      <div className="date-nav-controls">
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
      </div>

      <span className="date-nav-label">{formatDateLong(date, locale)}</span>

      <input
        type="date"
        className="input date-nav-date-input"
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />

      <style jsx>{`
        .date-nav-pill {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          row-gap: 10px;
        }

        .date-nav-pill :global(.date-nav-controls) {
          display: flex;
          align-items: center;
          gap: 8px;
        }

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

        .date-nav-pill :global(input.date-nav-date-input) {
          border-radius: 999px;
          padding-left: 16px;
          padding-right: 12px;
          margin-left: auto;
          max-width: 170px;
        }

        @media (max-width: 860px) {
          .date-nav-pill :global(.date-nav-controls) {
            order: 1;
          }

          .date-nav-pill :global(input.date-nav-date-input) {
            order: 2;
            margin-left: 8px;
            width: auto;
            max-width: 132px;
          }

          .date-nav-pill .date-nav-label {
            order: 3;
            flex-basis: 100%;
          }
        }
      `}</style>
    </div>
  );
}