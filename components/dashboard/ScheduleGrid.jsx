"use client";

import { getUnitMeta } from "@/lib/units";
import {
  SLOT_STEP_MINUTES,
  generateGridSlots,
  minutesToTime,
  rangesOverlap,
  timeToMinutes,
  todayISO,
} from "@/lib/time";

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

export function ScheduleGrid({ date, bookings, onSlotClick, t }) {
  const segments = buildSegments(bookings);

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
              <div className="schedule-row" key={`${seg.startMinutes}-b`}>
                <div className="schedule-time">{timeLabel}</div>
                <div
                  className="schedule-slot booked"
                  style={{ borderLeftColor: unitMeta?.color }}
                >
                  <span className="schedule-slot-label">
                    {seg.booking.purpose || t.common.booked}
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
                <span className="schedule-slot-label">{t.common.available}</span>
              </button>
            </div>
          );
        })}
      </div>

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
          grid-template-columns: 108px 1fr;
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
          color: var(--color-ink-soft);
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

        @media (max-width: 860px) {
          .schedule-row {
            grid-template-columns: 84px 1fr;
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