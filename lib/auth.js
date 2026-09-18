import { cookies } from "next/headers";
import { UNITS } from "./units";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

// Builds the list of valid accounts straight from environment variables.
// Each unit account: UNIT_<CODE>_USERNAME / UNIT_<CODE>_PASSWORD
// Admin account: ADMIN_USERNAME / ADMIN_PASSWORD
function getAllAccounts() {
  const accounts = [];

  for (const code of Object.keys(UNITS)) {
    const username = process.env[`UNIT_${code}_USERNAME`];
    const password = process.env[`UNIT_${code}_PASSWORD`];
    if (username && password) {
      accounts.push({
        username,
        password,
        unit: code,
        role: "unit",
        name: UNITS[code].name,
      });
    }
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminUsername && adminPassword) {
    accounts.push({
      username: adminUsername,
      password: adminPassword,
      unit: "ADMIN",
      role: "admin",
      name: "Admin",
    });
  }

  return accounts;
}

// Returns { unit, role, name } on success, or null on invalid credentials.
export function verifyCredentials(username, password) {
  if (!username || !password) return null;
  const accounts = getAllAccounts();
  const match = accounts.find(
    (acc) => acc.username === username && acc.password === password
  );
  if (!match) return null;
  return { unit: match.unit, role: match.role, name: match.name };
}

// Reads and verifies the session cookie in a Server Component / Route Handler (Node runtime).
// Returns { unit, role, name } or null.
export async function getSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  return { unit: payload.unit, role: payload.role, name: payload.name };
}
