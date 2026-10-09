"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { DateNav } from "@/components/ui/DateNav";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { UNITS, getUnitMeta } from "@/lib/units";
import { RESOURCES, DEFAULT_RESOURCE, getResourceMeta } from "@/lib/resources";
import { todayISO } from "@/lib/time";

export function BookingPageClient({ session }) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [resource, setResource] = useState("");
  // Resource yang sedang dilihat di kartu "Jadwal yang sudah dipesan".
  // Sekarang terhubung dua arah dengan pilihan "Ruangan / Meja" di form.
  const [viewResource, setViewResource] = useState(DEFAULT_RESOURCE);
  const [unit, setUnit] = useState(session.role === "admin" ? "" : session.unit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Booking yang tampil di daftar = hanya milik resource yang sedang dilihat.
  // Booking lama tanpa field "resource" dianggap milik Sadiman (lewat getResourceMeta).
  const visibleBookings = bookings.filter(
    (b) => getResourceMeta(b.resource).code === viewResource
  );

  // Booking pada tanggal + ruangan yang dipilih di form.
  // Dipakai untuk menyembunyikan jam yang sudah terpesan di dropdown jam.
  const resourceBookings = resource
    ? bookings.filter((b) => getResourceMeta(b.resource).code === resource)
    : [];

  // Pilih di dropdown form -> tab jadwal ikut berpindah.
  function handleResourceSelect(code) {
    setResource(code);
    setViewResource(code);
    // Ketersediaan jam beda per ruangan, jadi pilihan jam direset.
    setStartTime("");
    setEndTime("");
  }

  // Klik tab jadwal -> dropdown form ikut terpilih.
  function handleTabClick(code) {
    setViewResource(code);
    if (code !== resource) {
      setResource(code);
      setStartTime("");
      setEndTime("");
    }
  }

  // Ganti tanggal -> ketersediaan jam berubah, jadi pilihan jam direset.
  function handleDateChange(newDate) {
    setDate(newDate);
    setStartTime("");
    setEndTime("");
  }

  // Daftar ketersediaan menampilkan SEMUA booking di tanggal itu (Sadiman + Heksagon),
  // jadi tidak difilter per resource.
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

  // Notif "Booking confirmed" hilang otomatis setelah 3 detik.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

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

    if (!resource) {
      setError(isEn ? "Please select a room or table." : "Pilih ruangan atau meja dulu.");
      return;
    }
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

          <DateNav date={date} onChange={handleDateChange} t={t} locale={locale} />
        </div>

        <div className="booking-card-body">
          <div className="two-col">
            <form className="card booking-form-card" onSubmit={handleSubmit}>
              {error ? <div className="alert alert-error">{error}</div> : null}
              {success ? <div className="alert alert-success">{success}</div> : null}

              <div className="form-field">
                <label className="form-label">
                  {isEn ? "Room / Table" : "Ruangan / Meja"}
                </label>
                <select
                  className="select"
                  value={resource}
                  onChange={(e) => handleResourceSelect(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {isEn ? "Room / Table" : "Ruangan / Meja"}
                  </option>
                  {Object.values(RESOURCES).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                      {r.maxPeople
                        ? ` (${isEn ? "max" : "maks."} ${r.maxPeople} ${
                            isEn ? "people" : "orang"
                          })`
                        : ""}
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
                  disabled={!resource}
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

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? t.common.loading : t.common.book}
              </button>
            </form>

            <div className="card booking-list-card">
              <h3 className="booked-title">
                {isEn ? "Booked schedule" : "Jadwal yang sudah dipesan"}
              </h3>

              <div className="booked-tabs">
                {Object.values(RESOURCES).map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    className={`btn booked-tab ${
                      viewResource === r.code ? "btn-primary" : "btn-secondary"
                    }`}
                    onClick={() => handleTabClick(r.code)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>

              {loadingList ? (
                <div className="empty-state">{t.common.loading}</div>
              ) : visibleBookings.length === 0 ? (
                <div className="empty-state">{t.common.noBookings}</div>
              ) : (
                <ul className="booked-list">
                  {visibleBookings.map((b) => {
                    const meta = getUnitMeta(b.unit);
                    return (
                      <li key={b.id} className="booked-item">
                        <span className="booked-time">
                          {b.startTime}–{b.endTime}
                        </span>
                        <span className="booked-info">
                          <span className="booked-purpose">
                            {b.purpose || t.common.booked}
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

        .booking-form-card,
        .booking-list-card {
          padding: 22px;
        }

        .booked-title {
          margin: 0 0 12px;
          font-size: 14px;
          font-weight: 700;
        }

        .booked-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 6px;
        }

        .booked-tabs .booked-tab {
          border-radius: 999px;
        }

        .booked-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .booked-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
        }

        .booked-item + .booked-item {
          border-top: 1px solid var(--color-line);
        }

        .booked-time {
          flex-shrink: 0;
          min-width: 112px;
          padding: 5px 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          color: var(--color-ink);
          background: var(--color-panel);
          border: 1px solid var(--color-line-strong);
          border-radius: 999px;
        }

        .booked-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .booked-purpose {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 860px) {
          .booking-page-fill {
            position: static;
            inset: auto;
            display: block;
          }

          .booking-card {
            flex: none;
            min-height: 0;
            border-radius: 16px;
          }

          .booking-card-header {
            padding: 16px 16px 12px;
          }

          .booking-card-body {
            flex: none;
            overflow-y: visible;
            padding: 16px;
          }

          .two-col {
            display: flex;
            flex-direction: column;
            gap: 0;
            align-items: stretch;
          }

          .card.booking-form-card,
          .card.booking-list-card {
            border: none;
            box-shadow: none;
            border-radius: 0;
            padding: 0;
          }

          .booking-form-card {
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--color-line);
          }
        }
      `}</style>
    </div>
  );
}