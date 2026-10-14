import { redis } from "./redis";
import { getUnitMeta } from "./units";
import { DEFAULT_RESOURCE, getResourceMeta, isValidResource } from "./resources";
import {
  ROOM_OPEN_MINUTES,
  ROOM_CLOSE_MINUTES,
  bookingSortScore,
  isValidDateString,
  isValidTimeString,
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

// Script Lua dijalankan Redis sebagai SATU langkah yang tidak bisa disela:
// cek bentrok + simpan booking terjadi bersamaan, jadi dua permintaan di detik
// yang sama tidak mungkin sama-sama lolos untuk jam yang bertabrakan.
//
// KEYS[1] = bookings:date:<tanggal>   KEYS[2] = booking:<id>
// KEYS[3] = bookings:unit:<unit>      KEYS[4] = bookings:all
// ARGV[1] id               ARGV[2] startMinutes     ARGV[3] endMinutes
// ARGV[4] resource baru    ARGV[5] resource bawaan (untuk data lama tanpa field resource)
// ARGV[6] booking (JSON)   ARGV[7] sortScore        ARGV[8] awalan key booking ("booking:")
// Hasil: 1 = tersimpan, 0 = bentrok dengan booking lain di resource yang sama.
const CREATE_BOOKING_SCRIPT = `
local startMin = tonumber(ARGV[2])
local endMin = tonumber(ARGV[3])
local ids = redis.call('ZRANGE', KEYS[1], 0, -1)
for _, existingId in ipairs(ids) do
  local raw = redis.call('GET', ARGV[8] .. existingId)
  if raw then
    local b = cjson.decode(raw)
    local r = b.resource or ARGV[5]
    if r == ARGV[4] and startMin < b.endMinutes and b.startMinutes < endMin then
      return 0
    end
  end
end
redis.call('SET', KEYS[2], ARGV[6])
redis.call('ZADD', KEYS[1], startMin, ARGV[1])
redis.call('ZADD', KEYS[3], tonumber(ARGV[7]), ARGV[1])
redis.call('ZADD', KEYS[4], tonumber(ARGV[7]), ARGV[1])
return 1
`;

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

// resource (opsional): kalau diisi, hanya booking milik resource itu yang dikembalikan.
// Booking lama tanpa field "resource" dianggap milik DEFAULT_RESOURCE.
export async function getBookingsForDate(date, resource) {
  const ids = await redis.zrange(byDateKey(date), 0, -1);
  let bookings = await fetchBookingsByIds(ids);
  if (resource) {
    bookings = bookings.filter(
      (b) => (b.resource || DEFAULT_RESOURCE) === resource
    );
  }
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

// options: { date, startTime, endTime, unit, resource, purpose, createdBy: "unit"|"admin", createdByName, allowPast }
export async function createBooking(options) {
  const {
    date,
    startTime,
    endTime,
    unit,
    resource: resourceInput,
    purpose,
    createdBy,
    createdByName,
    allowPast,
  } = options;

  const unitMeta = getUnitMeta(unit);
  if (!unitMeta) {
    throw new BookingError("VALIDATION", "Unknown unit.");
  }

  const resource = resourceInput || DEFAULT_RESOURCE;
  if (!isValidResource(resource)) {
    throw new BookingError("VALIDATION", "Unknown resource.");
  }
  const resourceMeta = getResourceMeta(resource);

  const { startMinutes, endMinutes } = validateInput({ date, startTime, endTime });

  if (!allowPast && isInPast(date, startTime)) {
    throw new BookingError("VALIDATION", "Cannot book a time in the past.");
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
    resource,
    resourceName: resourceMeta.name,
    purpose: purpose ? String(purpose).slice(0, 300) : "",
    createdBy: createdBy === "admin" ? "admin" : "unit",
    createdByName: createdByName || unitMeta.name,
    createdAt: new Date().toISOString(),
    sortScore,
  };

  // Cek bentrok (hanya terhadap resource yang sama) dan simpan, dalam satu
  // langkah atomik di Redis.
  const saved = await redis.eval(
    CREATE_BOOKING_SCRIPT,
    [byDateKey(date), bookingKey(id), byUnitKey(unit), allKey()],
    [
      id,
      String(startMinutes),
      String(endMinutes),
      resource,
      DEFAULT_RESOURCE,
      JSON.stringify(booking),
      String(sortScore),
      bookingKey(""),
    ]
  );

  if (Number(saved) !== 1) {
    throw new BookingError(
      "CONFLICT",
      "That time overlaps with an existing booking."
    );
  }

  return booking;
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