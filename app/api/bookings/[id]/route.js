import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { BookingError, cancelBooking } from "@/lib/bookings";

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const booking = await cancelBooking(params.id, {
      unit: session.unit,
      role: session.role,
    });
    return NextResponse.json({ booking });
  } catch (err) {
    if (err instanceof BookingError) {
      const statusMap = { NOT_FOUND: 404, FORBIDDEN: 403, VALIDATION: 400 };
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: statusMap[err.code] || 400 }
      );
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
