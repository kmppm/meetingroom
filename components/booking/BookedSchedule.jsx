"use client";

import { useLanguage } from "@/components/layout/LanguageProvider";
import { getUnitMeta } from "@/lib/units";
import { RESOURCES, getResourceMeta } from "@/lib/resources";

// Nama pendek khusus tampilan mobile, mis. "Ruangan Meeting Sadiman" -> "Ruangan Sadiman"
function shortResourceName(name) {
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? `${words[0]} ${words[words.length - 1]}` : name;
}

// Section "Jadwal yang sudah dipesan" di halaman Pemesanan Ruangan.
// Props:
// - bookings: semua booking pada tanggal yang dipilih (difilter di sini per tab)
// - loading: true saat daftar sedang dimuat
// - viewResource: ruangan/meja yang sedang dilihat (tab aktif)
// - onTabChange: dipanggil saat user mengklik tab ruangan
export function BookedSchedule({ bookings, loading, viewResource, onTabChange }) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";

  // Booking lama tanpa field "resource" dianggap milik Sadiman (lewat getResourceMeta).
  const visibleBookings = bookings.filter(
    (b) => getResourceMeta(b.resource).code === viewResource
  );

  return (
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
            aria-label={r.name}
            onClick={() => onTabChange(r.code)}
          >
            <span className="booked-name-full">{r.name}</span>
            <span className="booked-name-short" aria-hidden="true">
              {shortResourceName(r.name)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">{t.common.loading}</div>
      ) : visibleBookings.length === 0 ? (
        <div className="empty-state">{t.common.noBookings}</div>
      ) : (
        <ul className="booked-list">
          {visibleBookings.map((b, index) => {
            const meta = getUnitMeta(b.unit);
            return (
              <li key={b.id} className="booked-item">
                <span className="booked-no" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="booked-time">
                  {b.startTime}–{b.endTime}
                </span>
                <span className="booked-info">
                  <span className="booked-purpose">{b.purpose || t.common.booked}</span>
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

      <style jsx global>{`
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

        .booked-name-short {
          display: none;
        }

        /* Nomor urut: bulatan dengan gaya yang sama seperti kapsul jam
           (latar panel + garis tepi) */
        .booked-no {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--color-panel);
          border: 1px solid var(--color-line-strong);
          color: var(--color-ink);
          font-size: 12px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
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
          font-size: 13px;
          font-weight: 400;
          color: var(--color-ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 860px) {
          /* Di mobile: card sendiri di dalam card utama (tanpa shadow). */
          .card.booking-list-card {
            border: 1px solid var(--color-line);
            border-radius: 12px;
            box-shadow: none;
            padding: 14px;
          }

          /* Tab ruangan: satu baris, nama pendek, tinggi 36px */
          .booked-tabs {
            flex-wrap: nowrap;
            gap: 6px;
          }

          .booked-tabs .booked-tab {
            flex: 1 1 0;
            min-width: 0;
            height: 36px;
            padding: 0 8px;
            font-size: 13px;
            line-height: 1;
            white-space: nowrap;
          }

          /* Item booking: nomor di kiri, jam, keperluan, lalu unit */
          .booked-item {
            gap: 8px;
          }

          .booked-time {
            min-width: 0;
            padding: 4px 10px;
          }

          .booked-name-full {
            display: none;
          }

          .booked-name-short {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
}