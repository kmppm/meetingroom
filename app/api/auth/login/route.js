import { NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { username, password } = body || {};
  const account = verifyCredentials(username, password);

  if (!account) {
    return NextResponse.json(
      { error: "Incorrect username or password." },
      { status: 401 }
    );
  }

  const token = await createSessionToken(account);

  const response = NextResponse.json({ ok: true, unit: account.unit, role: account.role });
  response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return response;
}
