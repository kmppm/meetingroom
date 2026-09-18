"use client";

import { useState } from "react";
import { UNITS } from "@/lib/units";
import {
  ROOM_OPEN_MINUTES,
  ROOM_CLOSE_MINUTES,
  formatDateLong,
  minutesToTime,
  timeToMinutes,
} from "@/lib/time";

// Step waktu khusus untuk dropdown di modal booking ini — sengaja dipisah dari
// SLOT_STEP_MINUTES (yang dipakai grid dashboard), supaya orang tetap bisa booking
// per 30 menit walaupun tampilan grid di dashboard per 1 jam.
const BOOKING_STEP_MINUTES = 30;

// Opsi "Start time": semua titik awal per 30 menit, mis. 06:00, 06:30, ..., 19:30
const START_TIME_OPTIONS = (() => {
  const options = [];
  for (
    let m = ROOM_OPEN_MINUTES;
    m < ROOM_CLOSE_MINUTES;
    m += BOOKING_STEP_MINUTES
  ) {
    options.push(minutesToTime(m));
  }
  return options;
})();

// Opsi "End time": satu langkah 30 menit setelah tiap slot, sampai jam tutup, mis. 06:30, ..., 20:00
const END_TIME_OPTIONS = (() => {
  const options = [];
  for (
    let m = ROOM_OPEN_MINUTES + BOOKING_STEP_MINUTES;
    m <= ROOM_CLOSE_MINUTES;
    m += BOOKING_STEP_MINUTES
  ) {
    options.push(minutesToTime(m));
  }
  return options;
})();

export function BookingModal({ date, initialStart, session, t, locale, onClose, onCreated }) {
  const defaultEndMinutes = Math.min(
    timeToMinutes(initialStart) + 60,
    ROOM_CLOSE_MINUTES
  );

  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(minutesToTime(defaultEndMinutes));
  const [purpose, setPurpose] = useState("");
  const [unit, setUnit] = useState(session.role === "admin" ? "" : session.unit);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (session.role === "admin" && !unit) {
      setError(t.common.selectUnit);
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
        <h2 className="modal-title">{t.common.book}</h2>
        <p className="modal-subtitle">{formatDateLong(date, locale)}</p>

        {error ? <div className="alert alert-error">{error}</div> : null}

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

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">{t.common.startTime}</label>
            <select
              className="select"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            >
              <option value="" disabled>
                -- {t.common.startTime} --
              </option>
              {START_TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">{t.common.endTime}</label>
            <select
              className="select"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            >
              <option value="" disabled>
                -- {t.common.endTime} --
              </option>
              {END_TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
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
      </form>
    </div>
  );
}