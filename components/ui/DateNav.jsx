"use client";

import { addDaysISO, formatDateLong, todayISO } from "@/lib/time";
import { IconChevronLeft, IconChevronRight } from "./icons";

// Format ringkas untuk mobile, mis. "Sel, 14 Okt 2026" / "Wed, Oct 14, 2026"
function formatDateShort(iso, locale) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function IconCalendar() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

// hideLabel (opsional, default false): sembunyikan teks tanggal panjang ("Jumat, 9 Oktober 2026").
// mobileCompact (opsional, default false): di layar <= 860px tampilkan kontrol ringkas satu baris
//   ‹  [ tanggal (tap = buka kalender) ]  ›  [Today bila bukan hari ini]
//   Di desktop tampilan tetap sama seperti sebelumnya.
export function DateNav({
  date,
  onChange,
  t,
  locale,
  hideLabel = false,
  mobileCompact = false,
}) {
  const isToday = date === todayISO();

  return (
    <div
      className={`date-nav date-nav-pill${mobileCompact ? " is-compact" : ""}`}
    >
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

      {hideLabel ? null : (
        <span className="date-nav-label">{formatDateLong(date, locale)}</span>
      )}

      <input
        type="date"
        className="input date-nav-date-input"
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />

      {mobileCompact ? (
        <div className="dn-m">
          <button
            type="button"
            className="dn-m-arrow"
            aria-label={t.common.previousDay}
            onClick={() => onChange(addDaysISO(date, -1))}
          >
            <IconChevronLeft width="18" height="18" />
          </button>

          {/* Input date transparan menutupi label, jadi tap di mana pun membuka kalender native */}
          <div className="dn-m-date">
            <IconCalendar />
            <span className="dn-m-date-text">
              {formatDateShort(date, locale)}
            </span>
            <input
              type="date"
              className="dn-m-date-input"
              aria-label={formatDateLong(date, locale)}
              value={date}
              onChange={(e) => e.target.value && onChange(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="dn-m-arrow"
            aria-label={t.common.nextDay}
            onClick={() => onChange(addDaysISO(date, 1))}
          >
            <IconChevronRight width="18" height="18" />
          </button>

          {isToday ? null : (
            <button
              type="button"
              className="dn-m-today"
              onClick={() => onChange(todayISO())}
            >
              {t.common.today}
            </button>
          )}
        </div>
      ) : null}

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

        /* Kontrol mobile ringkas: tidak tampil di desktop */
        .date-nav-pill :global(.dn-m) {
          display: none;
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

          /* ---------- Varian ringkas ---------- */

          .date-nav-pill.is-compact > :global(.date-nav-controls),
          .date-nav-pill.is-compact > :global(.date-nav-label),
          .date-nav-pill.is-compact > :global(input.date-nav-date-input) {
            display: none;
          }

          .date-nav-pill.is-compact :global(.dn-m) {
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 1 1 100%;
            min-width: 0;
          }

          .date-nav-pill :global(.dn-m-arrow) {
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 50%;
            background: transparent;
            color: var(--color-ink);
            cursor: pointer;
          }

          .date-nav-pill :global(.dn-m-arrow:active) {
            background: var(--color-panel);
          }

          .date-nav-pill :global(.dn-m-date) {
            position: relative;
            flex: 1 1 0;
            min-width: 0;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 14px;
            border-radius: 999px;
            background: var(--color-panel);
            color: var(--color-ink);
            font-size: 14px;
            font-weight: 600;
          }

          .date-nav-pill :global(.dn-m-date-text) {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .date-nav-pill :global(.dn-m-date-input) {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            font-size: 16px; /* cegah auto-zoom di iOS */
          }

          .date-nav-pill :global(.dn-m-date-input::-webkit-calendar-picker-indicator) {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
          }

          .date-nav-pill :global(.dn-m-today) {
            flex-shrink: 0;
            height: 32px;
            padding: 0 12px;
            border: 1px solid var(--color-line-strong);
            border-radius: 999px;
            background: transparent;
            color: var(--color-ink);
            font-family: inherit;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }
        }
      `}</style>
    </div>
  );
}