"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { DateNav } from "@/components/ui/DateNav";
import { TimeSelect } from "@/components/booking/TimeSelect";
import { UNITS, getUnitMeta } from "@/lib/units";
import { todayISO } from "@/lib/time";

export function BookingPageClient({ session }) {
  const { t, locale } = useLanguage();
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [unit, setUnit] = useState(session.role === "admin" ? "" : session.unit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadBookings(forDate) {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/bookings?date=${forDate}`);
      const data = await res.json();
      setBookings(res.ok ? data.bookings : []);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadBookings(date);
  }, [date]);

  // Kalau "jam mulai" diubah dan "jam selesai" yang sudah dipilih jadi tidak valid
  // (lebih awal/sama), reset "jam selesai" biar user pilih ulang.
  function handleStartTimeChange(newStart) {
    setStartTime(newStart);
    if (endTime && endTime <= newStart) {
      setEndTime("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

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
      setSuccess(t.booking.success);
      setStartTime("");
      setEndTime("");
      setPurpose("");
      loadBookings(date);
    } catch (err) {
      setError(t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="booking-page-fill">
      <div className="booking-card">
        <div className="booking-card-header">
          <div className="page-header">
            <h1 className="page-title">{t.booking.title}</h1>
            <p className="page-subtitle">{t.booking.subtitle}</p>
          </div>

          <DateNav date={date} onChange={setDate} t={t} locale={locale} />
        </div>

        <div className="booking-card-body">
          <div className="two-col">
            <form className="card" style={{ padding: 22 }} onSubmit={handleSubmit}>
              {error ? <div className="alert alert-error">{error}</div> : null}
              {success ? <div className="alert alert-success">{success}</div> : null}

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
                  <TimeSelect
                    value={startTime}
                    onChange={handleStartTimeChange}
                    placeholder="-- Jam mulai --"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">{t.common.endTime}</label>
                  <TimeSelect
                    value={endTime}
                    onChange={setEndTime}
                    minTime={startTime}
                    placeholder="-- Jam selesai --"
                  />
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

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? t.common.loading : t.common.book}
              </button>
            </form>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ marginTop: 0, fontSize: 14, fontWeight: 700 }}>
                {t.dashboard.subtitle}
              </h3>
              {loadingList ? (
                <div className="empty-state">{t.common.loading}</div>
              ) : bookings.length === 0 ? (
                <div className="empty-state">{t.common.noBookings}</div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {bookings.map((b) => {
                    const meta = getUnitMeta(b.unit);
                    return (
                      <li
                        key={b.id}
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px solid var(--color-line)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <span>
                          <strong>
                            {b.startTime}–{b.endTime}
                          </strong>{" "}
                          <span style={{ color: "var(--color-ink-soft)" }}>
                            {b.purpose || "—"}
                          </span>
                        </span>
                        <span className="unit-pill">
                          <span className="unit-dot" style={{ background: meta?.color }} />
                          {meta?.initials}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .booking-page-fill {
          position: absolute;
          top: 0;
          left: 0;
          right: 24px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
        }

        .booking-card {
          background: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .booking-card-header {
          flex-shrink: 0;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--color-line);
        }

        .booking-card-header .date-nav {
          margin-bottom: 0;
        }

        .booking-card-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}