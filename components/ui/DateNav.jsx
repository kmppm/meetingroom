"use client";

import { addDaysISO, formatDateLong, todayISO } from "@/lib/time";
import { IconChevronLeft, IconChevronRight } from "./icons";

// Daftar hari libur nasional & cuti bersama (sumber: SKB 3 Menteri tahun 2026).
// Format kunci: "YYYY-MM-DD". type: "national" = libur nasional,
// "leave" = cuti bersama. Tahun berikutnya tinggal tambah/ganti daftar ini.
// Sabtu & Minggu tidak perlu dimasukkan, sudah terdeteksi otomatis.
const HOLIDAYS = {
  "2026-01-01": { type: "national", id: "Tahun Baru 2026 Masehi", en: "New Year's Day" },
  "2026-01-16": { type: "national", id: "Isra Mikraj Nabi Muhammad SAW", en: "Isra Mi'raj" },
  "2026-02-16": { type: "leave", id: "Tahun Baru Imlek", en: "Chinese New Year" },
  "2026-02-17": { type: "national", id: "Tahun Baru Imlek 2577 Kongzili", en: "Chinese New Year" },
  "2026-03-18": { type: "leave", id: "Hari Suci Nyepi", en: "Nyepi" },
  "2026-03-19": { type: "national", id: "Hari Suci Nyepi", en: "Nyepi" },
  "2026-03-20": { type: "leave", id: "Idul Fitri 1447 H", en: "Eid al-Fitr" },
  "2026-03-21": { type: "national", id: "Idul Fitri 1447 H", en: "Eid al-Fitr" },
  "2026-03-22": { type: "national", id: "Idul Fitri 1447 H", en: "Eid al-Fitr" },
  "2026-03-23": { type: "leave", id: "Idul Fitri 1447 H", en: "Eid al-Fitr" },
  "2026-03-24": { type: "leave", id: "Idul Fitri 1447 H", en: "Eid al-Fitr" },
  "2026-04-03": { type: "national", id: "Wafat Yesus Kristus", en: "Good Friday" },
  "2026-04-05": { type: "national", id: "Paskah", en: "Easter" },
  "2026-05-01": { type: "national", id: "Hari Buruh Internasional", en: "Labour Day" },
  "2026-05-14": { type: "national", id: "Kenaikan Yesus Kristus", en: "Ascension Day" },
  "2026-05-15": { type: "leave", id: "Kenaikan Yesus Kristus", en: "Ascension Day" },
  "2026-05-27": { type: "national", id: "Idul Adha 1447 H", en: "Eid al-Adha" },
  "2026-05-28": { type: "leave", id: "Idul Adha 1447 H", en: "Eid al-Adha" },
  "2026-05-31": { type: "national", id: "Hari Raya Waisak", en: "Vesak Day" },
  "2026-06-01": { type: "national", id: "Hari Lahir Pancasila", en: "Pancasila Day" },
  "2026-06-16": { type: "national", id: "Tahun Baru Islam 1448 H", en: "Islamic New Year" },
  "2026-08-17": { type: "national", id: "Hari Kemerdekaan RI", en: "Independence Day" },
  "2026-08-25": { type: "national", id: "Maulid Nabi Muhammad SAW", en: "Prophet's Birthday" },
  "2026-12-24": { type: "leave", id: "Natal", en: "Christmas" },
  "2026-12-25": { type: "national", id: "Hari Raya Natal", en: "Christmas Day" },
};

// Label penanda untuk tanggal terpilih (null = hari kerja biasa)
function getDayLabel(date, locale) {
  const en = locale === "en";
  const holiday = HOLIDAYS[date];

  if (holiday) {
    const name = en ? holiday.en : holiday.id;
    if (holiday.type === "leave") {
      return `${en ? "Collective leave" : "Cuti bersama"}: ${name}`;
    }
    return `${en ? "Public holiday" : "Libur nasional"}: ${name}`;
  }

  // Tanpa zona waktu: baca sebagai tanggal lokal supaya hari tidak bergeser
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  if (day === 0 || day === 6) {
    return en ? "Weekend" : "Akhir pekan";
  }

  return null;
}

// Dipakai komponen lain (mis. ScheduleGrid): true bila tanggal itu
// akhir pekan / libur nasional / cuti bersama ("tanggal merah")
export function isRedDate(date) {
  return getDayLabel(date, "id") !== null;
}

// Pill kecil penanda akhir pekan / hari libur
function DayNote({ label }) {
  return (
    <span className="btn btn-secondary dn-day-note" role="status">
      <span className="dn-day-note-dot" aria-hidden="true" />
      <span className="dn-day-note-text">{label}</span>
    </span>
  );
}

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
  // Penanda akhir pekan / hari libur untuk tanggal yang sedang dipilih
  const dayLabel = getDayLabel(date, locale);

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

        {dayLabel ? <DayNote label={dayLabel} /> : null}
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

          {dayLabel ? (
            <div className="dn-m-note-row">
              <DayNote label={dayLabel} />
            </div>
          ) : null}
        </div>
      ) : null}

      <style jsx>{`
        .date-nav-pill {
          --dn-red: var(--color-danger, #d92d20);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          row-gap: 10px;
        }

        .date-nav-pill :global(.date-nav-controls) {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          min-width: 0;
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

        /* ---------- Penanda akhir pekan / hari libur ---------- */
        /* Ukuran & desain ikut kelas .btn .btn-secondary (sama dengan tombol Today);
           di sini hanya dibuat tidak bisa diklik */
        .date-nav-pill :global(.dn-day-note) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          max-width: 100%;
          cursor: default;
          pointer-events: none;
          user-select: none;
          /* Nuansa merah lembut penanda tanggal merah (tidak mencolok) */
          color: color-mix(in srgb, var(--dn-red) 88%, #000);
          background: color-mix(in srgb, var(--dn-red) 7%, var(--color-surface));
          border-color: color-mix(in srgb, var(--dn-red) 30%, var(--color-surface));
        }

        .date-nav-pill :global(.dn-day-note-dot) {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--dn-red);
          flex-shrink: 0;
        }

        .date-nav-pill :global(.dn-day-note-text) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            flex: 1 1 100%;
            min-width: 0;
          }

          /* Pill akhir pekan / libur: satu baris sendiri di bawah kontrol */
          .date-nav-pill :global(.dn-m-note-row) {
            flex: 0 0 100%;
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