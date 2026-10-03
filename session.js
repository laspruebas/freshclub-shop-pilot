import { API_BASE } from "./config.js";

export async function validateSessionToken(token) {
  if (!token) throw new Error("Missing session token");
  const response = await fetch(`${API_BASE}/fruti/session-validate?t=${encodeURIComponent(token)}`, {
    method: "GET", headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) throw new Error(`Session validate HTTP ${response.status}`);
  const data = await response.json();
  if (!data?.household_id) throw new Error("Session token did not return household_id");
  return data;
}

export async function resolveOpaqueSession(code) {
  if (!code) throw new Error("Missing session link code");
  const response = await fetch(`${API_BASE}/fruti/session-resolve/${encodeURIComponent(code)}`, {
    method: "GET", headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) throw new Error(`Session resolve HTTP ${response.status}`);
  const data = await response.json();
  if (!data?.household_id) throw new Error("Session link did not return household_id");
  return data;
}
