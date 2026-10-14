"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { getUnitMeta } from "@/lib/units";
import { getResourceMeta } from "@/lib/resources";
import {
  SLOT_STEP_MINUTES,
  generateGridSlots,
  minutesToTime,
  rangesOverlap,
  timeToMinutes,
  todayISO,
} from "@/lib/time";

// Label tooltip (hover di slot yang sudah dipesan)
const TIP_LABELS = {
  id: {
    time: "Jam",
    resource: "Ruangan / Meja",
    bookedBy: "Dipesan oleh",
    createdBy: "Dibuat oleh",
  },
  en: {
    time: "Time",
    resource: "Room / Table",
    bookedBy: "Booked by",
    createdBy: "Created by",
  },
};

const TIP_WIDTH = 300;
const TIP_EST_HEIGHT = 190;

// Keperluan di slot ditampilkan maksimal sekian kata, sisanya jadi "…"
// (teks lengkap tetap muncul di tooltip saat hover). Ubah angkanya kalau perlu.
const MAX_PURPOSE_WORDS = 3;

function truncateWords(text, max = MAX_PURPOSE_WORDS) {
  if (!text) return "";
  const tokens = text.trim().split(/\s+/);
  const kept = [];
  let words = 0;

  for (const token of tokens) {
    // Tanda baca berdiri sendiri seperti "-" tidak dihitung sebagai kata
    const isWord = /[\p{L}\p{N}]/u.test(token);
    if (isWord && words === max) {
      return kept.join(" ").replace(/[\s\-–—:,;]+$/, "") + "…";
    }
    kept.push(token);
    if (isWord) words++;
  }

  return kept.join(" ");
}

function buildSegments(bookings) {
  const slots = generateGridSlots();
  const segments = [];
  let i = 0;

  while (i < slots.length) {
    const slotStart = timeToMinutes(slots[i]);
    const slotEnd = slotStart + SLOT_STEP_MINUTES;
    const covering = bookings.find((b) =>
      rangesOverlap(slotStart, slotEnd, b.startMinutes, b.endMinutes)
    );

    if (covering) {
      segments.push({
        type: "booked",
        startMinutes: covering.startMinutes,
        endMinutes: covering.endMinutes,
        booking: covering,
      });
      while (
        i < slots.length &&
        rangesOverlap(
          timeToMinutes(slots[i]),
          timeToMinutes(slots[i]) + SLOT_STEP_MINUTES,
          covering.startMinutes,
          covering.endMinutes
        )
      ) {
        i++;
      }
    } else {
      segments.push({
        type: "free",
        startMinutes: slotStart,
        endMinutes: slotEnd,
      });
      i++;
    }
  }

  return segments;
}

function isPastSlot(date, startMinutes) {
  const now = new Date();
  const today = todayISO();
  if (date < today) return true;
  if (date > today) return false;
  return startMinutes < now.getHours() * 60 + now.getMinutes();
}

export function ScheduleGrid({ date, bookings, onSlotClick, t, locale }) {
  const segments = buildSegments(bookings);
  const [tip, setTip] = useState(null);
  const labels = locale === "en" ? TIP_LABELS.en : TIP_LABELS.id;
  // Label untuk slot kosong yang waktunya sudah lewat
  const pastLabel = locale === "en" ? "Past" : "Lewat";

  function showTip(e, booking, color) {
    const rect = e.currentTarget.getBoundingClientRect();
    const left = Math.max(
      12,
      Math.min(e.clientX, window.innerWidth - TIP_WIDTH - 12)
    );
    setTip({
      booking,
      color,
      left,
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      above: window.innerHeight - rect.bottom < TIP_EST_HEIGHT,
    });
  }

  const tipBooking = tip ? tip.booking : null;
  const tipUnit = tipBooking ? getUnitMeta(tipBooking.unit) : null;

  return (
    <div className="schedule-card">
      <div className="schedule">
        {segments.map((seg) => {
          const timeLabel = `${minutesToTime(seg.startMinutes)}–${minutesToTime(
            seg.endMinutes
          )}`;

          if (seg.type === "booked") {
            const unitMeta = getUnitMeta(seg.booking.unit);
            return (
              <div
                className="schedule-row is-booked"
                key={`${seg.startMinutes}-b`}
                onMouseEnter={(e) => showTip(e, seg.booking, unitMeta?.color)}
                onMouseLeave={() => setTip(null)}
              >
                <div className="schedule-time">{timeLabel}</div>
                <div
                  className="schedule-slot booked"
                  style={{ borderLeftColor: unitMeta?.color }}
                >
                  <span className="schedule-slot-label">
                    {truncateWords(seg.booking.purpose) || t.common.booked}
                  </span>
                  <span
                    className="slot-unit-badge"
                    style={{ background: unitMeta?.color }}
                  >
                    {unitMeta?.name}
                  </span>
                </div>
              </div>
            );
          }

          const past = isPastSlot(date, seg.startMinutes);

          return (
            <div className="schedule-row" key={`${seg.startMinutes}-f`}>
              <div className="schedule-time">{timeLabel}</div>
              <button
                type="button"
                className={`schedule-slot free${past ? " past" : ""}`}
                disabled={past}
                onClick={() => onSlotClick(minutesToTime(seg.startMinutes))}
              >
                <span className="schedule-slot-label">
                  {past ? pastLabel : t.common.available}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {tip && typeof document !== "undefined"
        ? createPortal(
            <div
              className="slot-tooltip"
              role="tooltip"
              style={{
                left: tip.left,
                ...(tip.above ? { bottom: tip.bottom } : { top: tip.top }),
              }}
            >
              <div className="slot-tooltip-title">
                {tipBooking.purpose || t.common.booked}
              </div>

              <div className="slot-tooltip-row">
                <span className="slot-tooltip-key">{labels.time}</span>
                <span className="slot-tooltip-val">
                  {tipBooking.startTime}–{tipBooking.endTime}
                </span>
              </div>

              <div className="slot-tooltip-row">
                <span className="slot-tooltip-key">{labels.resource}</span>
                <span className="slot-tooltip-val">
                  {getResourceMeta(tipBooking.resource).name}
                </span>
              </div>

              <div className="slot-tooltip-row">
                <span className="slot-tooltip-key">{labels.bookedBy}</span>
                <span className="slot-tooltip-val">
                  {tipBooking.unitName || tipUnit?.name}
                </span>
              </div>

              {tipBooking.createdBy === "admin" ? (
                <div className="slot-tooltip-row">
                  <span className="slot-tooltip-key">{labels.createdBy}</span>
                  <span className="slot-tooltip-val">
                    {tipBooking.createdByName || "Admin"}
                  </span>
                </div>
              ) : null}
            </div>,
            document.body
          )
        : null}

      <style jsx global>{`
        .schedule-card {
          background: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .schedule {
          background: var(--color-surface);
        }

        .schedule-row {
          display: grid;
          grid-template-columns: 108px minmax(0, 1fr);
          border-top: 1px solid var(--color-line);
        }

        .schedule-row:first-child {
          border-top: none;
        }

        .schedule-time {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 10px 10px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-ink-soft);
          background: var(--color-panel);
          border: 1px solid var(--color-line-strong);
          border-radius: 999px;
          white-space: nowrap;
        }

        .schedule-slot {
          padding: 10px 16px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border: none;
          width: 100%;
          min-width: 0;
          text-align: left;
          background: transparent;
          font-family: inherit;
          font-size: 13px;
          cursor: default;
        }

        .schedule-slot-label {
          min-width: 0;
        }

        .schedule-slot.free {
          cursor: pointer;
          color: var(--color-ink);
        }

        /* Titik hijau kecil penanda slot yang masih tersedia */
        .schedule-slot.free:not(.past) .schedule-slot-label::before {
          content: "";
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 8px;
          border-radius: 50%;
          background: var(--color-success);
          vertical-align: middle;
        }

        .schedule-slot.free:hover {
          background: var(--color-panel);
          color: var(--color-ink);
        }

        .schedule-slot.booked {
          cursor: default;
          font-weight: 600;
          border-left: 3px solid transparent;
        }

        /* Keperluan dibatasi satu baris, kelebihannya jadi "..." (detail ada di tooltip) */
        .schedule-slot.booked .schedule-slot-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .schedule-row.is-booked:hover .schedule-slot.booked {
          background: var(--color-panel);
        }

        .schedule-slot.past.free {
          cursor: not-allowed;
          color: var(--color-line-strong);
        }

        .schedule-slot.past.free:hover {
          background: transparent;
          color: var(--color-line-strong);
        }

        .slot-unit-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 999px;
          color: #fff;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ---------- Tooltip detail booking (hover) ---------- */

        .slot-tooltip {
          position: fixed;
          z-index: 300;
          width: 300px;
          max-width: calc(100vw - 24px);
          padding: 12px 14px;
          background: var(--color-surface);
          border: 1px solid var(--color-line-strong);
          border-radius: 12px;
          pointer-events: none;
          font-size: 12px;
        }

        .slot-tooltip-title {
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 700;
          color: var(--color-ink);
          word-break: break-word;
        }

        .slot-tooltip-row {
          display: grid;
          grid-template-columns: 96px 1fr;
          gap: 8px;
          padding: 3px 0;
        }

        .slot-tooltip-key {
          color: var(--color-ink-soft);
        }

        .slot-tooltip-val {
          font-weight: 600;
          color: var(--color-ink);
          word-break: break-word;
        }

        @media (max-width: 860px) {
          .schedule-row {
            grid-template-columns: 84px minmax(0, 1fr);
          }

          .schedule-time {
            margin: 8px 6px;
            padding: 3px 6px;
            font-size: 10px;
          }

          .schedule-slot {
            padding: 8px 10px;
            gap: 6px;
          }

          .schedule-slot-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .slot-unit-badge {
            font-size: 10px;
            padding: 2px 8px;
          }
        }
      `}</style>
    </div>
  );
}