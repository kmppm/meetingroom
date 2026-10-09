"use client";

import { useEffect, useState } from "react";
import { todayISO } from "@/lib/time";

// Jam operasional: 06:00 - 20:00, tiap kotak = 30 menit.
const OPEN_MINUTES = 6 * 60;
const CLOSE_MINUTES = 20 * 60;
const STEP = 30;

const SLOTS = [];
for (let m = OPEN_MINUTES; m < CLOSE_MINUTES; m += STEP) SLOTS.push(m);

function pad(n) {
  return String(n).padStart(2, "0");
}
function toLabel(mins) {
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}
function toMin(label) {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}
function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function formatDuration(mins, isEn) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hText = isEn ? `${h} hr` : `${h} jam`;
  const mText = isEn ? `${m} min` : `${m} menit`;
  if (h && m) return `${hText} ${mText}`;
  return h ? hText : mText;
}

/**
 * Pemilih jam berbentuk kotak-kotak, tiap kotak 30 menit:
 * Keterangan muncul sebagai tooltip saat kursor di atas kotak:
 *  - "Tersedia / Available"     = bisa diklik
 *  - "Dipilih / Selected"       = jam yang sedang dipilih
 *  - "Sudah dipesan / Booked"   = terkunci, sudah dipesan orang lain (kotak abu bergaris)
 *  - jam yang sudah lewat       = tidak ditampilkan (kecuali admin)
 *
 * Cara pakai: ketuk jam mulai, lalu ketuk kotak berikutnya untuk menambah durasi.
 *
 * props:
 * - startTime, endTime: "HH:MM" atau ""
 * - onChange: (startTime, endTime) => void
 * - bookings: booking pada tanggal + ruangan yang dipilih (field startTime & endTime)
 * - date: "YYYY-MM-DD"
 * - hidePast: true = jam yang sudah lewat hari ini tidak bisa dipilih (non-admin)
 * - disabled: true = belum bisa dipilih (misalnya ruangan belum dipilih)
 * - compact: true = kotak lebih kecil & lebih banyak kolom (dipakai di popup supaya tidak panjang)
 * - locale: "id" | "en"
 */
export function TimeSlotPicker({
  startTime,
  endTime,
  onChange,
  bookings = [],
  date,
  hidePast = false,
  disabled = false,
  compact = false,
  locale = "id",
}) {
  const isEn = locale === "en";

  // Diisi setelah mount supaya render server & browser sama; diperbarui tiap 30 detik.
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(nowMinutes());
    const timer = setInterval(() => setNow(nowMinutes()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const pastCutoff =
    hidePast && now !== null && date && date === todayISO() ? now : null;

  const ranges = bookings
    .filter((b) => b.startTime && b.endTime)
    .map((b) => ({ start: toMin(b.startTime), end: toMin(b.endTime) }));

  function slotState(m) {
    if (ranges.some((r) => r.start < m + STEP && r.end > m)) return "booked";
    if (pastCutoff !== null && m < pastCutoff) return "past";
    return "free";
  }

  function allFree(from, to) {
    for (let m = from; m < to; m += STEP) {
      if (slotState(m) !== "free") return false;
    }
    return true;
  }

  const selStart = startTime ? toMin(startTime) : null;
  const selEnd = endTime ? toMin(endTime) : null;
  const hasSelection = selStart !== null && selEnd !== null && selEnd > selStart;

  // Kalau pilihan jadi tidak valid (baru dipesan orang lain / baru lewat / ganti ruangan), kosongkan.
  const stateKey = SLOTS.map((m) => slotState(m)[0]).join("");
  useEffect(() => {
    if (disabled) return;
    if ((startTime || endTime) && !(hasSelection && allFree(selStart, selEnd))) {
      onChange("", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey, startTime, endTime, disabled]);

  function handleClick(m) {
    if (slotState(m) !== "free") return;

    if (!hasSelection) {
      onChange(toLabel(m), toLabel(m + STEP));
      return;
    }
    // Ketuk lagi satu-satunya kotak terpilih = batalkan.
    if (m === selStart && selEnd === selStart + STEP) {
      onChange("", "");
      return;
    }
    // Ketuk kotak di/ setelah jam mulai dan semuanya kosong = ubah jam selesai.
    if (m >= selStart && allFree(selStart, m + STEP)) {
      onChange(toLabel(selStart), toLabel(m + STEP));
      return;
    }
    // Selain itu, mulai pilihan baru dari kotak ini.
    onChange(toLabel(m), toLabel(m + STEP));
  }

  if (disabled) {
    return (
      <div className="tsp-note">
        {isEn
          ? "Choose a room / table first to see the available times."
          : "Pilih ruangan / meja dulu untuk melihat jam yang tersedia."}
        <style jsx>{`
          .tsp-note {
            padding: 14px 16px;
            border: 1px dashed var(--color-line-strong, #ccc);
            border-radius: 12px;
            font-size: 13px;
            color: var(--color-muted, #777);
          }
        `}</style>
      </div>
    );
  }

  // Jam yang sudah lewat tidak ditampilkan sama sekali.
  const visibleSlots = SLOTS.filter((m) => slotState(m) !== "past");

  const statusText = {
    free: isEn ? "Available" : "Tersedia",
    booked: isEn ? "Booked" : "Sudah dipesan",
    selected: isEn ? "Selected" : "Dipilih",
  };

  return (
    <div className={`tsp${compact ? " compact" : ""}`}>
      {hasSelection ? (
        <div className="tsp-summary" aria-live="polite">
          <span className="tsp-summary-label">{isEn ? "Selected:" : "Dipilih:"}</span>{" "}
          <strong>
            {toLabel(selStart)} – {toLabel(selEnd)}
          </strong>{" "}
          <span className="tsp-muted">({formatDuration(selEnd - selStart, isEn)})</span>
        </div>
      ) : null}

      {visibleSlots.length === 0 ? (
        <div className="tsp-muted">
          {isEn ? "No times left on this date." : "Tidak ada jam tersisa di tanggal ini."}
        </div>
      ) : (
        <div className="tsp-grid" role="group" aria-label={isEn ? "Time slots" : "Pilihan jam"}>
          {visibleSlots.map((m) => {
            const state = slotState(m);
            const selected = hasSelection && m >= selStart && m < selEnd;
            const cls = selected ? "selected" : state;
            return (
              <span key={m} className="tsp-cell" data-tip={statusText[cls]}>
                <button
                  type="button"
                  className={`tsp-slot ${cls}`}
                  disabled={state !== "free"}
                  aria-pressed={selected}
                  aria-label={`${toLabel(m)} – ${statusText[cls]}`}
                  onClick={() => handleClick(m)}
                >
                  {toLabel(m)}
                </button>
              </span>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .tsp-summary {
          font-size: 14px;
          margin-bottom: 10px;
        }
        .tsp-summary-label {
          font-weight: 600;
        }
        .tsp-muted {
          color: var(--color-muted, #777);
          font-size: 13px;
        }
        .tsp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
          gap: 6px;
        }
        .tsp-cell {
          position: relative;
          display: block;
        }
        .tsp-slot {
          display: block;
          width: 100%;
          padding: 9px 0;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          text-align: center;
          border-radius: 10px;
          border: 1px solid var(--color-line-strong, #ccc);
          background: var(--color-surface, #fff);
          color: var(--color-ink, #111);
          cursor: pointer;
        }
        .tsp-slot.free:hover {
          border-color: var(--color-ink, #111);
        }
        .tsp-slot.selected {
          background: var(--color-ink, #111);
          border-color: var(--color-ink, #111);
          color: #fff;
        }
        .tsp-slot.booked {
          background: repeating-linear-gradient(
            45deg,
            var(--color-panel, #f3f3f3),
            var(--color-panel, #f3f3f3) 5px,
            #e9e9e9 5px,
            #e9e9e9 10px
          );
          border-color: var(--color-line, #e5e5e5);
          color: #999;
          text-decoration: line-through;
          cursor: not-allowed;
        }
        /* Keterangan (Tersedia / Dipilih / Sudah dipesan) muncul saat kursor di atas kotak */
        .tsp-cell::after {
          content: attr(data-tip);
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          padding: 4px 8px;
          border-radius: 6px;
          background: #111;
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          line-height: 1.2;
          text-decoration: none;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.12s ease;
          z-index: 10;
        }
        .tsp-cell:hover::after,
        .tsp-cell:focus-within::after {
          opacity: 1;
        }
        @media (max-width: 860px) {
          .tsp-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        /* Versi ringkas untuk popup: lebih banyak kolom, kotak lebih kecil */
        .tsp.compact .tsp-summary {
          margin-bottom: 8px;
        }
        .tsp.compact .tsp-grid {
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .tsp.compact .tsp-slot {
          padding: 6px 0;
          font-size: 12px;
          border-radius: 8px;
        }
        @media (max-width: 860px) {
          .tsp.compact .tsp-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      `}</style>
    </div>
  );
}