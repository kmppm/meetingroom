"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { useLoginModal } from "@/components/layout/LoginModalContext";
import { DateNav } from "@/components/ui/DateNav";
import { ScheduleGrid } from "./ScheduleGrid";
import { ScheduleSkeleton } from "./ScheduleSkeleton";
import { NextSlotBanner } from "./NextSlotBanner";
import { BookingModal } from "@/components/booking/BookingModal";
import { RESOURCES, DEFAULT_RESOURCE } from "@/lib/resources";
import { todayISO } from "@/lib/time";

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

// Info penanda untuk tanggal terpilih (null = hari kerja biasa)
function getDayInfo(date, locale) {
  const en = locale === "en";
  const holiday = HOLIDAYS[date];

  if (holiday) {
    const name = en ? holiday.en : holiday.id;
    if (holiday.type === "leave") {
      return { label: `${en ? "Collective leave" : "Cuti bersama"}: ${name}` };
    }
    return { label: `${en ? "Public holiday" : "Libur nasional"}: ${name}` };
  }

  // Tanpa zona waktu: baca sebagai tanggal lokal supaya hari tidak bergeser
  const day = new Date(`${date}T00:00:00`).getDay();
  if (day === 0 || day === 6) {
    return { label: en ? "Weekend" : "Akhir pekan" };
  }

  return null;
}

// Nama pendek khusus tampilan mobile, mis. "Ruangan Meeting Sadiman" -> "Ruangan Sadiman"
function shortResourceName(name) {
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? `${words[0]} ${words[words.length - 1]}` : name;
}

export function DashboardClient({ session }) {
  const { t, locale } = useLanguage();
  const requestLogin = useLoginModal();
  const [date, setDate] = useState(todayISO());
  // `resource` dipakai untuk tombol pilih ruangan saat layar sempit
  // (di layar lebar kedua ruangan tampil berdampingan)
  const [resource, setResource] = useState(DEFAULT_RESOURCE);
  // { [kodeRuangan]: daftar booking }
  const [bookingsByResource, setBookingsByResource] = useState({});
  const [loading, setLoading] = useState(true);
  // { resource, start } saat modal booking terbuka
  const [modalTarget, setModalTarget] = useState(null);
  const [success, setSuccess] = useState("");
  // Nomor permintaan terakhir: hasil dari permintaan yang sudah usang diabaikan
  const requestIdRef = useRef(0);

  // Ambil booking SEMUA ruangan dengan SATU permintaan (tanpa ?resource=),
  // lalu dibagi per ruangan di sini. Ini menghemat command Redis dan request.
  // silent = true: dipakai penyegaran otomatis, tanpa tampilan loading dan
  // tanpa mengosongkan jadwal kalau permintaannya gagal.
  async function loadBookings(forDate, silent = false) {
    const requestId = ++requestIdRef.current;
    if (!silent) setLoading(true);
    try {
      let list = null;
      try {
        const res = await fetch(`/api/bookings?date=${forDate}`);
        const data = await res.json();
        if (res.ok) list = data.bookings;
      } catch {
        // gagal: ditangani di bawah (list tetap null)
      }

      // Ada permintaan yang lebih baru (mis. tanggal sudah diganti): abaikan
      if (requestId !== requestIdRef.current) return;

      setBookingsByResource((prev) => {
        if (list === null) return silent ? prev : {};
        const next = {};
        for (const r of Object.values(RESOURCES)) next[r.code] = [];
        for (const b of list) {
          const code = b.resource || DEFAULT_RESOURCE;
          if (next[code]) next[code].push(b);
        }
        // Tidak ada yang berubah: pertahankan data lama (tanpa render ulang)
        if (silent && JSON.stringify(prev) === JSON.stringify(next)) return prev;
        return next;
      });
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings(date);
  }, [date]);

  // Penyegaran otomatis supaya booking orang lain ikut muncul.
  // Hemat command database:
  // - jeda 60 detik
  // - berhenti saat tab tidak dibuka
  // - berhenti kalau tidak ada aktivitas (mouse/keyboard/sentuh) selama 5 menit
  // - begitu tab dibuka lagi atau ada aktivitas, langsung menyegarkan sekali
  useEffect(() => {
    const POLL_MS = 60 * 1000;
    const IDLE_MS = 5 * 60 * 1000;
    let lastActive = Date.now();

    function refresh() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActive > IDLE_MS) return;
      loadBookings(date, true);
    }

    function markActive() {
      const wasIdle = Date.now() - lastActive > IDLE_MS;
      lastActive = Date.now();
      if (wasIdle) refresh();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        lastActive = Date.now();
        refresh();
      }
    }

    const timer = setInterval(refresh, POLL_MS);
    const activityEvents = ["pointerdown", "pointermove", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((ev) =>
      window.addEventListener(ev, markActive, { passive: true, capture: true })
    );
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      activityEvents.forEach((ev) =>
        window.removeEventListener(ev, markActive, { capture: true })
      );
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [date]);

  function handleCreated() {
    setModalTarget(null);
    setSuccess(t.booking.success);
    loadBookings(date);
    setTimeout(() => setSuccess(""), 4000);
  }

  function handleSlotClick(resourceCode, startTime) {
    if (!session) {
      requestLogin();
      return;
    }
    setModalTarget({ resource: resourceCode, start: startTime });
  }

  // Penanda akhir pekan / hari libur untuk tanggal yang sedang dipilih
  const dayInfo = getDayInfo(date, locale);

  return (
    <div className="dashboard-page-fill">
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div className="page-header">
            <h1 className="page-title">{t.dashboard.title}</h1>
            <p className="page-subtitle">{t.dashboard.subtitle} {t.dashboard.hint}</p>
          </div>

          {success ? <div className="alert alert-success">{success}</div> : null}

          <div className="dashboard-toolbar">
            <div
              className="dashboard-resource-tabs"
              role="tablist"
              aria-label={t.dashboard.title}
            >
              {Object.values(RESOURCES).map((r) => (
                <button
                  key={r.code}
                  type="button"
                  role="tab"
                  aria-selected={resource === r.code}
                  className={`btn resource-btn ${
                    resource === r.code ? "btn-primary" : "btn-secondary"
                  }`}
                  aria-label={r.name}
                  onClick={() => setResource(r.code)}
                >
                  <span className="resource-name-full">{r.name}</span>
                  <span className="resource-name-short" aria-hidden="true">
                    {shortResourceName(r.name)}
                  </span>
                </button>
              ))}
            </div>

            <DateNav
              date={date}
              onChange={setDate}
              t={t}
              locale={locale}
              hideLabel
              mobileCompact
            />
          </div>

          {dayInfo ? (
            <div className="dashboard-day-note" role="status">
              <span className="dashboard-day-note-dot" aria-hidden="true" />
              <span>{dayInfo.label}</span>
            </div>
          ) : null}

          <NextSlotBanner
            date={date}
            loading={loading}
            bookingsByResource={bookingsByResource}
            locale={locale}
            session={session}
            onBook={handleSlotClick}
          />
        </div>

        <div className="dashboard-card-body">
          <div className="dashboard-columns">
            {Object.values(RESOURCES).map((r) => (
              <section
                key={r.code}
                className={`dashboard-col${
                  resource === r.code ? " is-active" : ""
                }`}
                aria-label={r.name}
              >
                <h2 className="dashboard-col-title">{r.name}</h2>
                {loading ? (
                  <ScheduleSkeleton />
                ) : (
                  <ScheduleGrid
                    date={date}
                    bookings={bookingsByResource[r.code] || []}
                    onSlotClick={(startTime) =>
                      handleSlotClick(r.code, startTime)
                    }
                    t={t}
                    locale={locale}
                  />
                )}
              </section>
            ))}
          </div>
        </div>
      </div>

      {modalTarget && session ? (
        <BookingModal
          date={date}
          initialStart={modalTarget.start}
          resource={modalTarget.resource}
          session={session}
          t={t}
          locale={locale}
          onClose={() => setModalTarget(null)}
          onCreated={handleCreated}
        />
      ) : null}

      <style jsx global>{`
        .dashboard-page-fill {
          position: absolute;
          top: 0;
          left: 0;
          right: 24px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
        }

        .dashboard-card {
          background: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .dashboard-card-header {
          flex-shrink: 0;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--color-line);
        }

        .dashboard-card-header .date-nav {
          margin-bottom: 0;
        }

        .dashboard-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px 16px;
          margin-top: 12px;
        }

        .dashboard-resource-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .dashboard-toolbar .resource-btn {
          border-radius: 999px;
        }

        .dashboard-toolbar .date-nav {
          flex: 1 1 460px;
          min-width: 0;
          margin-bottom: 0;
        }

        /* Penanda akhir pekan / hari libur */
        .dashboard-day-note {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-ink-soft);
          background: var(--color-panel);
          border: 1px solid var(--color-line-strong);
          border-radius: 999px;
        }

        .dashboard-day-note-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-ink-soft);
          flex-shrink: 0;
        }

        .dashboard-card-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .resource-name-short {
          display: none;
        }

        /* ---------- Daftar jam per ruangan ---------- */

        /* Layar sempit: hanya ruangan yang dipilih lewat tombol yang tampil */
        .dashboard-columns {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .dashboard-col {
          min-width: 0;
        }

        .dashboard-col:not(.is-active) {
          display: none;
        }

        .dashboard-col-title {
          display: none;
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 800;
          color: var(--color-ink);
        }

        /* Layar lebar: kedua ruangan berdampingan, tombol pilih ruangan disembunyikan */
        @media (min-width: 1180px) {
          .dashboard-columns {
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }

          .dashboard-col:not(.is-active) {
            display: block;
          }

          .dashboard-col-title {
            display: block;
          }

          .dashboard-resource-tabs {
            display: none;
          }
        }

        @media (max-width: 860px) {
          /* Card tetap diam setinggi area antara topbar dan bottom nav,
             hanya .dashboard-card-body yang discroll. */
          .dashboard-page-fill {
            top: 8px;
            left: var(--shell-gutter-mobile);
            right: var(--shell-gutter-mobile);
            bottom: calc(
              var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 12px
            );
          }

          .dashboard-card {
            border-radius: 16px;
          }

          .dashboard-card-header {
            padding: 12px;
          }

          /* Judul & subjudul disembunyikan secara visual (bottom nav sudah
             menandai halaman aktif), tetap ada untuk screen reader. */
          .dashboard-card-header .page-header {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            padding: 0;
            overflow: hidden;
            clip: rect(0 0 0 0);
            white-space: nowrap;
            border: 0;
          }

          .dashboard-toolbar {
            flex-direction: column;
            align-items: stretch;
            flex-wrap: nowrap;
            gap: 10px;
            margin-top: 0;
          }

          /* ---------- Segmented control ruangan ---------- */
          .dashboard-resource-tabs {
            flex-wrap: nowrap;
            width: 100%;
            gap: 2px;
            padding: 3px;
            background: var(--color-panel);
            border: 1px solid var(--color-line);
            border-radius: 999px;
          }

          .dashboard-toolbar .resource-btn {
            flex: 1 1 0;
            min-width: 0;
            height: 36px;
            padding: 0 8px;
            font-size: 13px;
            line-height: 1;
            white-space: nowrap;
          }

          /* Pilihan non-aktif melebur ke wadah; yang aktif tetap pil gelap */
          .dashboard-toolbar .resource-btn.btn-secondary {
            background: transparent;
            border-color: transparent;
            box-shadow: none;
            color: var(--color-ink-soft);
          }

          /* Kontrol tanggal: satu baris penuh (diatur di DateNav) */
          .dashboard-toolbar .date-nav {
            flex: none;
            width: 100%;
          }

          .resource-name-full {
            display: none;
          }

          .resource-name-short {
            display: inline;
          }

          .dashboard-card-body {
            padding: 12px;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }
        }
      `}</style>
    </div>
  );
}