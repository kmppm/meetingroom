import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  BookingError,
  createBooking,
  getAllBookingsList,
  getBookingsForDate,
  getBookingsForUnit,
} from "@/lib/bookings";
import { isValidResource } from "@/lib/resources";
import { isValidDateString } from "@/lib/time";

// Field yang boleh dilihat PUBLIK (pengunjung yang belum login).
// Hanya yang dibutuhkan ScheduleGrid & daftar jadwal. Field internal seperti
// createdBy, createdByName, createdAt, dan sortScore tidak dikirim ke publik.
const PUBLIC_BOOKING_FIELDS = [
  "id",
  "date",
  "startTime",
  "endTime",
  "startMinutes", // dipakai ScheduleGrid untuk menyusun jadwal
  "endMinutes", // dipakai ScheduleGrid untuk menyusun jadwal
  "unit",
  "unitName",
  "resource",
  "resourceName",
  "purpose",
];

function toPublicBooking(booking) {
  const result = {};
  for (const key of PUBLIC_BOOKING_FIELDS) {
    if (booking[key] !== undefined) result[key] = booking[key];
  }
  return result;
}

export async function GET(request) {
  // Session boleh null: jadwal per tanggal bersifat publik (untuk dashboard).
  const session = await getSession();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const scope = searchParams.get("scope");
  const resource = searchParams.get("resource");

  try {
    // scope=mine → data milik unit sendiri, wajib login.
    if (scope === "mine") {
      if (!session) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      const bookings = await getBookingsForUnit(session.unit);
      return NextResponse.json({ bookings });
    }

    // scope=all → semua booking, khusus admin.
    if (scope === "all") {
      if (!session) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      if (session.role !== "admin") {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      const bookings = await getAllBookingsList();
      return NextResponse.json({ bookings });
    }

    // ?date=... → jadwal per tanggal, PUBLIK (tanpa login).
    if (date) {
      if (!isValidDateString(date)) {
        return NextResponse.json({ error: "Invalid date." }, { status: 400 });
      }
      if (resource && !isValidResource(resource)) {
        return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
      }
      // Tanpa ?resource= → semua booking di tanggal itu (perilaku lama).
      const bookings = await getBookingsForDate(date, resource || undefined);
      // Belum login → hanya kirim field publik. Sudah login → data lengkap seperti biasa.
      return NextResponse.json({
        bookings: session ? bookings : bookings.map(toPublicBooking),
      });
    }

    return NextResponse.json({ error: "Missing date or scope." }, { status: 400 });
  } catch (err) {
    console.error("=== GET /api/bookings GAGAL ===");
    console.error("params:", { date, scope, resource });
    console.error("session:", { unit: session?.unit, role: session?.role });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error("=== POST /api/bookings: body bukan JSON valid ===");
    console.error(err);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { date, startTime, endTime, purpose, resource } = body || {};

  // Cetak persis apa yang dikirim form, supaya ketahuan format jamnya.
  console.log("=== POST /api/bookings: body diterima ===");
  console.log({ date, startTime, endTime, purpose, resource, unit: body?.unit });

  // Only an admin may book on behalf of a different unit.
  let targetUnit = session.unit;
  if (session.role === "admin" && body?.unit) {
    targetUnit = body.unit;
  }
  if (session.role !== "admin" && body?.unit && body.unit !== session.unit) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const booking = await createBooking({
      date,
      startTime,
      endTime,
      purpose,
      resource,
      unit: targetUnit,
      createdBy: session.role === "admin" ? "admin" : "unit",
      createdByName: session.role === "admin" ? "Admin" : undefined,
      allowPast: session.role === "admin",
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      console.error("=== POST /api/bookings: BookingError ===");
      console.error("code:", err.code, "| message:", err.message);
      console.error("payload:", { date, startTime, endTime, resource, unit: targetUnit });
      const statusMap = { VALIDATION: 400, CONFLICT: 409, LOCK: 409 };
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: statusMap[err.code] || 400 }
      );
    }
    console.error("=== POST /api/bookings: error tak terduga ===");
    console.error("payload:", { date, startTime, endTime, resource, unit: targetUnit });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}