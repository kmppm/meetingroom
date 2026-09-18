import { redis } from "./redis";
import { getUnitMeta } from "./units";
import {
  ROOM_OPEN_MINUTES,
  ROOM_CLOSE_MINUTES,
  bookingSortScore,
  isValidDateString,
  isValidTimeString,
  rangesOverlap,
  timeToMinutes,
  todayISO,
} from "./time";

export class BookingError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // "VALIDATION" | "CONFLICT" | "NOT_FOUND" | "FORBIDDEN" | "LOCK"
  }
}

function bookingKey(id) {
  return `booking:${id}`;
}
function byDateKey(date) {
  return `bookings:date:${date}`;
}
function byUnitKey(unit) {
  return `bookings:unit:${unit}`;
}
function allKey() {
  return "bookings:all";
}
function lockKey(date) {
  return `lock:bookings:${date}`;
}

async function acquireLock(date) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const ok = await redis.set(lockKey(date), "1", { nx: true, px: 4000 });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function releaseLock(date) {
  await redis.del(lockKey(date));
}

function validateInput({ date, startTime, endTime }) {
  if (!isValidDateString(date)) {
    throw new BookingError("VALIDATION", "Invalid date format.");
  }
  if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
    throw new BookingError("VALIDATION", "Invalid time format.");
  }
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    throw new BookingError(
      "VALIDATION",
      "Start time must be before end time."
    );
  }
  if (startMinutes < ROOM_OPEN_MINUTES || endMinutes > ROOM_CLOSE_MINUTES) {
    throw new BookingError(
      "VALIDATION",
      "Booking must be within room operating hours (06:00–20:00)."
    );
  }
  return { startMinutes, endMinutes };
}

function isInPast(date, startTime) {
  const now = new Date();
  const todayStr = todayISO();
  if (date < todayStr) return true;
  if (date > todayStr) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return timeToMinutes(startTime) < nowMinutes;
}

async function fetchBookingsByIds(ids) {
  if (!ids.length) return [];
  const raws = await redis.mget(...ids.map(bookingKey));
  return raws
    .map((raw) => {
      if (!raw) return null;
      // Upstash auto-deserializes JSON-looking strings; guard against both cases.
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    })
    .filter(Boolean);
}

export async function getBookingById(id) {
  const raw = await redis.get(bookingKey(id));
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function getBookingsForDate(date) {
  const ids = await redis.zrange(byDateKey(date), 0, -1);
  const bookings = await fetchBookingsByIds(ids);
  return bookings.sort((a, b) => a.startMinutes - b.startMinutes);
}

export async function getBookingsForUnit(unit) {
  const ids = await redis.zrange(byUnitKey(unit), 0, -1);
  const bookings = await fetchBookingsByIds(ids);
  return bookings.sort((a, b) => b.sortScore - a.sortScore); // most recent first
}

export async function getAllBookingsList() {
  const ids = await redis.zrange(allKey(), 0, -1);
  const bookings = await fetchBookingsByIds(ids);
  return bookings.sort((a, b) => b.sortScore - a.sortScore); // most recent first
}

// options: { date, startTime, endTime, unit, purpose, createdBy: "unit"|"admin", createdByName, allowPast }
export async function createBooking(options) {
  const { date, startTime, endTime, unit, purpose, createdBy, createdByName, allowPast } =
    options;

  const unitMeta = getUnitMeta(unit);
  if (!unitMeta) {
    throw new BookingError("VALIDATION", "Unknown unit.");
  }

  const { startMinutes, endMinutes } = validateInput({ date, startTime, endTime });

  if (!allowPast && isInPast(date, startTime)) {
    throw new BookingError("VALIDATION", "Cannot book a time in the past.");
  }

  const locked = await acquireLock(date);
  if (!locked) {
    throw new BookingError(
      "LOCK",
      "The schedule is being updated by someone else. Please try again."
    );
  }

  try {
    const existing = await getBookingsForDate(date);
    const conflict = existing.some((b) =>
      rangesOverlap(startMinutes, endMinutes, b.startMinutes, b.endMinutes)
    );
    if (conflict) {
      throw new BookingError(
        "CONFLICT",
        "That time overlaps with an existing booking."
      );
    }

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const sortScore = bookingSortScore(date, startMinutes);

    const booking = {
      id,
      date,
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      unit,
      unitName: unitMeta.name,
      purpose: purpose ? String(purpose).slice(0, 300) : "",
      createdBy: createdBy === "admin" ? "admin" : "unit",
      createdByName: createdByName || unitMeta.name,
      createdAt: new Date().toISOString(),
      sortScore,
    };

    const pipeline = redis.pipeline();
    pipeline.set(bookingKey(id), booking);
    pipeline.zadd(byDateKey(date), { score: startMinutes, member: id });
    pipeline.zadd(byUnitKey(unit), { score: sortScore, member: id });
    pipeline.zadd(allKey(), { score: sortScore, member: id });
    await pipeline.exec();

    return booking;
  } finally {
    await releaseLock(date);
  }
}

// actor: { unit, role }
export async function cancelBooking(id, actor) {
  const booking = await getBookingById(id);
  if (!booking) {
    throw new BookingError("NOT_FOUND", "Booking not found.");
  }
  if (actor.role !== "admin" && booking.unit !== actor.unit) {
    throw new BookingError(
      "FORBIDDEN",
      "You can only cancel your own unit's bookings."
    );
  }

  const pipeline = redis.pipeline();
  pipeline.del(bookingKey(id));
  pipeline.zrem(byDateKey(booking.date), id);
  pipeline.zrem(byUnitKey(booking.unit), id);
  pipeline.zrem(allKey(), id);
  await pipeline.exec();

  return booking;
}
