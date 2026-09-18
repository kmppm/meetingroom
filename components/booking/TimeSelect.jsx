"use client";

// Jam operasional ruangan: 06:00 - 20:00, sesuai validasi di lib/bookings.js
const OPEN_MINUTES = 6 * 60; // 06:00
const CLOSE_MINUTES = 20 * 60; // 20:00
const STEP_MINUTES = 30;

function pad(n) {
  return String(n).padStart(2, "0");
}

function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

// Bikin daftar semua opsi jam yang valid, misal ["06:00", "06:30", ..., "20:00"]
function buildAllOptions() {
  const options = [];
  for (let mins = OPEN_MINUTES; mins <= CLOSE_MINUTES; mins += STEP_MINUTES) {
    options.push(minutesToLabel(mins));
  }
  return options;
}

const ALL_OPTIONS = buildAllOptions();

/**
 * Dropdown pemilih jam.
 *
 * props:
 * - value: string "HH:MM" atau ""
 * - onChange: (value: string) => void
 * - minTime: opsional, string "HH:MM" — kalau diisi, hanya tampilkan jam SETELAH ini
 *   (dipakai untuk "jam selesai" supaya tidak bisa lebih awal dari "jam mulai")
 * - placeholder: teks saat belum pilih apa-apa
 */
export function TimeSelect({ value, onChange, minTime, placeholder = "-- Pilih jam --" }) {
  let options = ALL_OPTIONS;

  if (minTime) {
    options = ALL_OPTIONS.filter((opt) => opt > minTime);
  }

  return (
    <select
      className="select"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      required
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}