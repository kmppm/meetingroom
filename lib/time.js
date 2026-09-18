// All bookings are stored as plain date/time strings (no timezone math),
// so the server and every browser agree on what "14:00 on 2026-09-17" means
// regardless of where they physically are.

export const ROOM_OPEN_MINUTES = 6 * 60; // 06:00
export const ROOM_CLOSE_MINUTES = 20 * 60; // 20:00
export const SLOT_STEP_MINUTES = 60; // grid is drawn in 60-minute blocks

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function isValidDateString(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

export function isValidTimeString(str) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(str);
}

export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function dateToSortableNumber(dateStr) {
  return Number(dateStr.replaceAll("-", ""));
}

// Combined sort key so a global sorted set can order by date then start time.
export function bookingSortScore(dateStr, startMinutes) {
  return dateToSortableNumber(dateStr) * 10000 + startMinutes;
}

// True if [aStart, aEnd) overlaps [bStart, bEnd).
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Produces the list of 60-minute block start times between opening and closing,
// used to draw the schedule grid. e.g. ["06:00", "07:00", ..., "19:00"]
export function generateGridSlots() {
  const slots = [];
  for (
    let m = ROOM_OPEN_MINUTES;
    m < ROOM_CLOSE_MINUTES;
    m += SLOT_STEP_MINUTES
  ) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

export function formatDateLong(dateStr, locale) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function addDaysISO(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}