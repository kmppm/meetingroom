"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { UNITS } from "@/lib/units";
import { RESOURCES, getResourceMeta } from "@/lib/resources";

// Section "form booking" di halaman Pemesanan Ruangan.
// Props:
// - session: sesi user (role, unit)
// - date: tanggal yang dipilih di halaman ("YYYY-MM-DD"), default hari ini
// - onDateChange: dipanggil saat user mengganti tanggal lewat kolom Tanggal di form
//   (tanggal di header halaman ikut berubah, karena memakai state yang sama)
// - bookings: semua booking pada tanggal itu (difilter di sini per ruangan yang dipilih)
// - resource: ruangan/meja yang dipilih ("" = belum dipilih)
// - onResourceChange: dipanggil saat user memilih ruangan di dropdown
// - onBooked: dipanggil setelah booking berhasil (supaya halaman memuat ulang daftar)
export function BookingForm({
  session,
  date,
  onDateChange,
  bookings,
  resource,
  onResourceChange,
  onBooked,
}) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [unit, setUnit] = useState(session.role === "admin" ? "" : session.unit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Booking pada tanggal + ruangan yang dipilih di form.
  // Dipakai untuk menyembunyikan jam yang sudah terpesan di pemilih jam.
  const resourceBookings = resource
    ? bookings.filter((b) => getResourceMeta(b.resource).code === resource)
    : [];

  // Ganti tanggal atau ruangan -> ketersediaan jam berubah, jadi pilihan jam direset.
  useEffect(() => {
    setStartTime("");
    setEndTime("");
  }, [date, resource]);

  // Notif "Booking confirmed" hilang otomatis setelah 3 detik.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

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
      onBooked();
    } catch (err) {
      setError(t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card booking-form-card" onSubmit={handleSubmit}>
      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="form-field">
        <label className="form-label">{t.common.date}</label>
        <input
          type="date"
          className="input"
          value={date}
          onClick={(e) => {
            // Buka kalender saat kolom diklik di mana saja, bukan hanya di ikon.
            try {
              e.currentTarget.showPicker?.();
            } catch (err) {
              // Browser yang tidak mengizinkan: biarkan perilaku bawaan.
            }
          }}
          onChange={(e) => {
            // Abaikan kalau dikosongkan, supaya tanggal tidak pernah kosong.
            if (e.target.value) onDateChange(e.target.value);
          }}
          required
        />
      </div>

      <div className="form-field">
        <label className="form-label">{isEn ? "Room / Table" : "Ruangan / Meja"}</label>
        <select
          className="select"
          value={resource}
          onChange={(e) => onResourceChange(e.target.value)}
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

      <style jsx global>{`
        .booking-form-card {
          padding: 22px;
        }

        @media (max-width: 860px) {
          /* Di mobile: card sendiri di dalam card utama (tanpa shadow). */
          .card.booking-form-card {
            border: 1px solid var(--color-line);
            border-radius: 12px;
            box-shadow: none;
            padding: 14px;
          }
        }
      `}</style>
    </form>
  );
}