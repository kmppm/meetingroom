"use client";

import { useEffect, useState } from "react";
import { UNITS } from "@/lib/units";
import { RESOURCES, DEFAULT_RESOURCE, getResourceMeta } from "@/lib/resources";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import {
  ROOM_CLOSE_MINUTES,
  formatDateLong,
  minutesToTime,
  timeToMinutes,
} from "@/lib/time";

// resource (opsional): resource yang dipilih awal. Kalau tidak dikirim, default ke Sadiman.
export function BookingModal({
  date,
  initialStart,
  resource: initialResource,
  session,
  t,
  locale,
  onClose,
  onCreated,
}) {
  const isEn = locale === "en";

  const defaultEndMinutes = Math.min(
    timeToMinutes(initialStart) + 60,
    ROOM_CLOSE_MINUTES
  );

  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(minutesToTime(defaultEndMinutes));
  const [purpose, setPurpose] = useState("");
  const [resource, setResource] = useState(initialResource || DEFAULT_RESOURCE);
  const [unit, setUnit] = useState(session.role === "admin" ? "" : session.unit);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Semua booking di tanggal ini, dipakai untuk menyembunyikan jam yang sudah terpesan.
  // Diambil sendiri oleh modal supaya tetap benar walau ruangan diganti di dalam modal.
  const [dayBookings, setDayBookings] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/bookings?date=${date}`);
        const data = await res.json();
        if (!cancelled) setDayBookings(res.ok ? data.bookings : []);
      } catch (err) {
        if (!cancelled) setDayBookings([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const resourceBookings = dayBookings.filter(
    (b) => getResourceMeta(b.resource).code === resource
  );

  function handleResourceChange(code) {
    setResource(code);
    // Ketersediaan jam beda per ruangan, jadi pilihan jam direset.
    setStartTime("");
    setEndTime("");
  }

  function handleStartTimeChange(newStart) {
    setStartTime(newStart);
    if (endTime && endTime <= newStart) {
      setEndTime("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (session.role === "admin" && !unit) {
      setError(t.common.selectUnit);
      return;
    }
    if (!startTime || !endTime) {
      setError(t.errors.validation);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          purpose,
          resource,
          unit: session.role === "admin" ? unit : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "CONFLICT") setError(t.errors.conflict);
        else if (data.code === "VALIDATION" && /past/i.test(data.error || ""))
          setError(t.errors.past);
        else if (data.code === "VALIDATION") setError(t.errors.validation);
        else setError(data.error || t.errors.generic);
        setSubmitting(false);
        return;
      }
      onCreated(data.booking);
    } catch (err) {
      setError(t.errors.generic);
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-drag-handle" aria-hidden="true" />

        <h2 className="modal-title">{t.common.book}</h2>
        <p className="modal-subtitle">{formatDateLong(date, locale)}</p>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <div className="form-field">
          <label className="form-label">
            {isEn ? "Room / Table" : "Ruangan / Meja"}
          </label>
          <select
            className="select"
            value={resource}
            onChange={(e) => handleResourceChange(e.target.value)}
            required
          >
            {Object.values(RESOURCES).map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {session.role === "admin" ? (
          <div className="form-field">
            <label className="form-label">{t.common.selectUnit}</label>
            <select
              className="select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            >
              <option value="" disabled>
                {t.common.selectUnit}
              </option>
              {Object.values(UNITS).map((u) => (
                <option key={u.code} value={u.code}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="form-field">
          <label className="form-label">{isEn ? "Time" : "Waktu"}</label>
          <TimeSlotPicker
            startTime={startTime}
            endTime={endTime}
            onChange={(s, e) => {
              setStartTime(s);
              setEndTime(e);
            }}
            bookings={resourceBookings}
            date={date}
            hidePast
            compact
            locale={locale}
          />
        </div>

        <div className="form-field">
          <label className="form-label">{t.common.purpose}</label>
          <textarea
            className="textarea"
            placeholder={t.common.purposePlaceholder}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t.common.close}
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? t.common.loading : t.common.confirm}
          </button>
        </div>

        <style jsx>{`
          .modal-actions :global(.btn) {
            border-radius: 999px;
          }

          .modal-drag-handle {
            display: none;
          }

          @media (max-width: 860px) {
            .modal-overlay {
              align-items: flex-end;
              justify-content: center;
              padding: 0;
              z-index: 100;
            }

            .modal {
              position: fixed;
              left: 0;
              right: 0;
              bottom: 0;
              width: 100%;
              max-width: 100%;
              max-height: 88vh;
              overflow-y: auto;
              border-radius: 20px 20px 0 0;
              margin: 0;
              padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
              animation: sheet-slide-up 220ms ease-out;
            }

            .modal-drag-handle {
              display: block;
              width: 40px;
              height: 4px;
              border-radius: 999px;
              background: var(--color-line-strong);
              margin: 0 auto 10px;
            }

            .modal-title {
              margin-bottom: 2px;
            }

            .modal-subtitle {
              margin-bottom: 14px;
            }

            .form-label {
              margin-bottom: 4px;
            }

            .form-field {
              margin-bottom: 12px;
            }

            .form-row {
              margin-bottom: 12px;
              gap: 10px;
            }

            .textarea {
              min-height: 72px;
            }

            .modal-actions {
              margin-top: 4px;
            }
          }

          @keyframes sheet-slide-up {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .modal {
              animation: none;
            }
          }
        `}</style>
      </form>
    </div>
  );
}