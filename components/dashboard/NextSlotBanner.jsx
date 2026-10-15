"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RESOURCES } from "@/lib/resources";
import { getUnitMeta } from "@/lib/units";
import {
  SLOT_STEP_MINUTES,
  generateGridSlots,
  minutesToTime,
  rangesOverlap,
  timeToMinutes,
  todayISO,
} from "@/lib/time";

// Banner "jam kosong terdekat": tampil sekali per sesi tab (tiap kali website
// dibuka di tab/jendela baru). Muat ulang atau pindah halaman di tab yang sama
// tidak memunculkannya lagi. Penandanya disimpan di sessionStorage dengan key ini.
const BANNER_KEY = "meetingroom:next-slot-banner";

// Panduan singkat (2 langkah) yang menunjuk tombol di banner. Hanya tampil SEKALI
// per perangkat (penandanya disimpan di localStorage dengan key ini), dan hanya di desktop.
const TOUR_KEY = "meetingroom:next-slot-tour";

// Jeda pergantian banner antar ruangan (milidetik). Berhenti selama kursor di atas banner
// dan selama panduan singkat sedang tampil.
const ROTATE_MS = 2500;

const BANNER_LABELS = {
  id: {
    title: "Jam kosong terdekat",
    cta: "Pesan sekarang",
    close: "Tutup",
  },
  en: {
    title: "Next available time",
    cta: "Book now",
    close: "Close",
  },
};

const TOUR_LABELS = {
  id: {
    title: "Panduan banner",
    step1: "Klik di sini untuk langsung memesan jam kosong ini.",
    step2:
      "Klik tanda silang untuk menutup banner ini. Banner ruangan lain akan tampil bergantian.",
    skip: "Lewati",
    next: "Lanjut",
    done: "Mengerti",
  },
  en: {
    title: "Banner guide",
    step1: "Click here to book this available time right away.",
    step2:
      "Click the cross to close this banner. The other room's banner will show in turn.",
    skip: "Skip",
    next: "Next",
    done: "Got it",
  },
};

// Cari jam kosong terdekat (mulai dari sekarang) untuk SETIAP ruangan.
// Aturannya sama dengan ScheduleGrid: slot per jam, dan slot yang jamnya sudah
// lewat tidak dihitung. Hasilnya berurutan sesuai daftar RESOURCES; ruangan yang
// sudah tidak punya jam kosong hari ini tidak ikut dalam hasil.
function findNextFreeSlots(bookingsByResource, nowMinutes) {
  const slots = generateGridSlots();
  const result = [];

  for (const r of Object.values(RESOURCES)) {
    const list = bookingsByResource[r.code] || [];
    for (const slot of slots) {
      const start = timeToMinutes(slot);
      if (start < nowMinutes) continue;
      const end = start + SLOT_STEP_MINUTES;
      const taken = list.some((b) =>
        rangesOverlap(start, end, b.startMinutes, b.endMinutes)
      );
      if (!taken) {
        result.push({
          resource: r.code,
          resourceName: r.name,
          start: slot,
          timeLabel: `${slot}–${minutesToTime(end)}`,
        });
        break;
      }
    }
  }

  return result;
}

// Pilih warna teks (putih atau gelap) yang terbaca di atas warna latar tertentu,
// supaya warna unit yang terang (mis. kuning LSP) tetap jelas dibaca.
function readableTextColor(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? "#111111" : "#ffffff";
}

export function NextSlotBanner({
  date,
  loading,
  bookingsByResource,
  locale,
  session,
  onBook,
}) {
  const labels = locale === "en" ? BANNER_LABELS.en : BANNER_LABELS.id;
  const tour = locale === "en" ? TOUR_LABELS.en : TOUR_LABELS.id;

  // Warna tombol "Pesan sekarang" mengikuti warna unit akun yang sedang login.
  // Kalau belum login, tombol memakai gaya netral.
  const unitMeta = session ? getUnitMeta(session.unit) : null;
  const ctaStyle = unitMeta
    ? {
        background: unitMeta.color,
        borderColor: unitMeta.color,
        color: readableTextColor(unitMeta.color),
      }
    : undefined;

  // Jam sekarang (menit sejak 00:00), diperbarui tiap menit di browser (tanpa ke server)
  const [nowMin, setNowMin] = useState(null);
  // Apakah banner boleh tampil pada kunjungan ini (sekali per sesi tab)
  const [enabled, setEnabled] = useState(false);
  // Kode ruangan yang bannernya sudah ditutup
  const [closed, setClosed] = useState([]);
  // Penunjuk banner yang sedang tampil saat ada lebih dari satu
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Banner yang baru saja digantikan (untuk animasi keluar)
  const [leaving, setLeaving] = useState(null);
  // Langkah panduan: null = tidak tampil, 0 = tombol pesan, 1 = tombol tutup
  const [tourStep, setTourStep] = useState(null);
  const checkedRef = useRef(false);
  const prevKeyRef = useRef(null);
  const tourStartedRef = useRef(false);

  useEffect(() => {
    function tick() {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    }
    tick();
    const timer = setInterval(tick, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Jam kosong terdekat hari ini per ruangan (kosong kalau sedang melihat tanggal
  // lain, data belum siap, atau sudah tidak ada jam kosong)
  const slots = useMemo(() => {
    if (loading || nowMin === null) return [];
    if (date !== todayISO()) return [];
    if (Object.keys(bookingsByResource).length === 0) return [];
    return findNextFreeSlots(bookingsByResource, nowMin);
  }, [loading, nowMin, date, bookingsByResource]);

  // Banner hanya diputuskan sekali per kunjungan: tampil kalau di sesi tab ini
  // belum pernah ditampilkan. Penanda disimpan saat tampil, jadi muat ulang
  // halaman di tab yang sama tidak memunculkannya lagi. (Kalau tab dibiarkan
  // terbuka sampai ganti hari, banner tampil lagi di hari berikutnya.)
  useEffect(() => {
    if (checkedRef.current || slots.length === 0) return;
    checkedRef.current = true;
    const today = todayISO();
    let seenToday = false;
    try {
      seenToday = window.sessionStorage.getItem(BANNER_KEY) === today;
      window.sessionStorage.setItem(BANNER_KEY, today);
    } catch {
      // sessionStorage tidak tersedia: banner tampil sekali per pemuatan halaman
    }
    if (!seenToday) setEnabled(true);
  }, [slots]);

  const visible = enabled
    ? slots.filter((s) => !closed.includes(s.resource))
    : [];

  // Kalau ada lebih dari satu banner, tampil bergantian sampai semuanya ditutup.
  // Berhenti sementara saat kursor di atas banner (supaya tombolnya tidak berganti
  // tepat sebelum diklik) dan saat panduan singkat sedang tampil.
  useEffect(() => {
    if (visible.length < 2 || paused || tourStep !== null) return;
    const timer = setInterval(() => setIndex((i) => i + 1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [visible.length, paused, tourStep]);

  const current = visible.length ? visible[index % visible.length] : null;
  const currentKey = current ? current.resource : null;

  // Catat banner yang baru digantikan supaya bisa dianimasikan keluar
  useEffect(() => {
    const prev = prevKeyRef.current;
    if (prev && currentKey && prev !== currentKey) setLeaving(prev);
    prevKeyRef.current = currentKey;
  }, [currentKey]);

  // Mulai panduan singkat: hanya sekali per perangkat, hanya di desktop
  // (di mobile banner disembunyikan), dan hanya saat banner benar-benar tampil.
  useEffect(() => {
    if (!enabled || !currentKey || tourStartedRef.current) return;
    tourStartedRef.current = true;
    if (!window.matchMedia("(min-width: 861px)").matches) return;
    try {
      if (window.localStorage.getItem(TOUR_KEY) === "1") return;
      window.localStorage.setItem(TOUR_KEY, "1");
    } catch {
      // localStorage tidak tersedia: panduan tampil sekali per pemuatan halaman
    }
    setTourStep(0);
  }, [enabled, currentKey]);

  // Escape menutup panduan
  useEffect(() => {
    if (tourStep === null) return;
    function onKey(e) {
      if (e.key === "Escape") setTourStep(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourStep]);

  if (!current) return null;

  function closeSlot(code) {
    setTourStep(null);
    setClosed((prev) => [...prev, code]);
  }

  function handleBook(slot) {
    closeSlot(slot.resource);
    onBook(slot.resource, slot.start);
  }

  // Gelembung panduan yang menempel di bawah tombol yang ditunjuk
  function renderTour(step) {
    const isLast = step === 1;
    return (
      <>
        <span className="tour-arrow" aria-hidden="true" />
        <div className="tour-pop" role="dialog" aria-label={tour.title}>
          <p className="tour-text">{step === 0 ? tour.step1 : tour.step2}</p>
          <div className="tour-footer">
            <span className="tour-count">{step + 1}/2</span>
            <div className="tour-actions">
              {!isLast ? (
                <button
                  type="button"
                  className="btn btn-ghost tour-btn"
                  onClick={() => setTourStep(null)}
                >
                  {tour.skip}
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn-secondary tour-btn"
                onClick={() => (isLast ? setTourStep(null) : setTourStep(1))}
              >
                {isLast ? tour.done : tour.next}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="slot-banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Semua banner ditumpuk di satu sel supaya tinggi kotak tetap dan
          pergantiannya berupa crossfade halus (bukan loncat). */}
      <div className="slot-banner-stack">
        {visible.map((slot) => {
          const isActive = slot.resource === current.resource;
          const isLeaving = !isActive && slot.resource === leaving;
          const showTourCta = isActive && tourStep === 0;
          const showTourClose = isActive && tourStep === 1;
          return (
            <div
              key={slot.resource}
              className={`slot-banner-item${isActive ? " is-active" : ""}${
                isLeaving ? " is-leaving" : ""
              }`}
              aria-hidden={!isActive}
            >
              <span className="slot-banner-dot" aria-hidden="true" />
              <div className="slot-banner-text">
                <strong>{labels.title}</strong>
                <span>
                  {slot.timeLabel} · {slot.resourceName}
                </span>
              </div>

              <span className="slot-banner-anchor">
                <button
                  type="button"
                  className={`btn slot-banner-cta${
                    unitMeta ? " is-colored" : " btn-secondary"
                  }${showTourCta ? " is-tour-target" : ""}`}
                  style={ctaStyle}
                  onClick={() => handleBook(slot)}
                >
                  {labels.cta}
                </button>
                {showTourCta ? renderTour(0) : null}
              </span>

              <span className="slot-banner-anchor">
                <button
                  type="button"
                  className={`slot-banner-close${
                    showTourClose ? " is-tour-target" : ""
                  }`}
                  aria-label={labels.close}
                  onClick={() => closeSlot(slot.resource)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </svg>
                </button>
                {showTourClose ? renderTour(1) : null}
              </span>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .slot-banner {
          position: relative;
          z-index: 20;
          margin-top: 12px;
          padding: 10px 10px 10px 16px;
          background: var(--color-panel);
          border: 1px solid var(--color-line);
          border-radius: var(--radius-md);
          animation: slot-banner-in 260ms ease;
        }

        @keyframes slot-banner-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Satu sel grid dipakai bersama oleh semua banner */
        .slot-banner-stack {
          display: grid;
        }

        .slot-banner-item {
          grid-area: 1 / 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          visibility: hidden;
          pointer-events: none;
        }

        /* Banner yang tampil: naik pelan dari bawah sambil muncul */
        .slot-banner-item.is-active {
          visibility: visible;
          pointer-events: auto;
          animation: slot-item-in 480ms cubic-bezier(0.22, 1, 0.36, 1) 70ms both;
        }

        /* Banner yang digantikan: naik ke atas sambil memudar */
        .slot-banner-item.is-leaving {
          animation: slot-item-out 340ms ease-in both;
        }

        @keyframes slot-item-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slot-item-out {
          from {
            opacity: 1;
            transform: translateY(0);
            visibility: visible;
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
            visibility: hidden;
          }
        }

        .slot-banner-dot {
          flex-shrink: 0;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-success);
        }

        .slot-banner-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 2px 10px;
          font-size: 13px;
          color: var(--color-ink-soft);
        }

        .slot-banner-text strong {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-ink);
        }

        /* Pembungkus tombol: patokan posisi gelembung panduan */
        .slot-banner-anchor {
          position: relative;
          display: flex;
          flex-shrink: 0;
        }

        .btn.slot-banner-cta {
          flex-shrink: 0;
          height: 32px;
          padding: 0 14px;
          font-size: 13px;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* Tombol berwarna unit: gelap sedikit saat di-hover */
        .btn.slot-banner-cta.is-colored {
          transition: filter 120ms ease, background-color 120ms ease,
            border-color 120ms ease;
        }

        .btn.slot-banner-cta.is-colored:hover {
          filter: brightness(0.92);
        }

        .slot-banner-close {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-line-strong);
          border-radius: 50%;
          background: var(--color-surface);
          color: var(--color-ink-soft);
          cursor: pointer;
          transition: border-color 120ms ease, color 120ms ease;
        }

        .slot-banner-close:hover {
          border-color: var(--color-ink-soft);
          color: var(--color-ink);
        }

        /* ---------- Panduan singkat (menunjuk tombol) ---------- */

        /* Tombol yang sedang ditunjuk diberi cincin yang berdenyut pelan */
        .slot-banner-cta.is-tour-target,
        .slot-banner-close.is-tour-target {
          outline: 2px solid var(--color-ink);
          outline-offset: 2px;
          animation: tour-ring 1.4s ease-in-out infinite;
        }

        @keyframes tour-ring {
          0%,
          100% {
            outline-offset: 2px;
            outline-color: rgba(17, 17, 17, 0.9);
          }
          50% {
            outline-offset: 5px;
            outline-color: rgba(17, 17, 17, 0.2);
          }
        }

        .tour-arrow {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          z-index: 3;
          width: 12px;
          height: 12px;
          margin-left: -6px;
          background: var(--color-surface);
          border-top: 1px solid var(--color-line-strong);
          border-left: 1px solid var(--color-line-strong);
          transform: rotate(45deg);
          animation: tour-in 220ms ease both;
        }

        .tour-pop {
          position: absolute;
          top: calc(100% + 14px);
          right: 0;
          z-index: 2;
          width: 264px;
          padding: 12px 14px;
          background: var(--color-surface);
          border: 1px solid var(--color-line-strong);
          border-radius: 12px;
          text-align: left;
          white-space: normal;
          animation: tour-in 220ms ease both;
        }

        @keyframes tour-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .tour-text {
          margin: 0 0 10px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
          color: var(--color-ink);
        }

        .tour-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .tour-count {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-ink-soft);
        }

        .tour-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn.tour-btn {
          height: 28px;
          padding: 0 12px;
          font-size: 12px;
          border-radius: 999px;
        }

        /* Banner (dan panduannya) hanya tampil di desktop */
        @media (max-width: 860px) {
          .slot-banner {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}