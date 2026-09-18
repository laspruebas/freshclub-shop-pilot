import { API_BASE } from "../config.js";

async function readJson(response, label) {
  const data = await response.json().catch(() => null);

  if (response.ok) {
    return data;
  }

  const detail =
    data?.detail?.message ||
    data?.detail ||
    `HTTP ${response.status}`;

  throw new Error(`${label}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
}

export async function fetchActors() {
  const response = await fetch(`${API_BASE}/actors`);
  return readJson(response, "Actors");
}

export async function fetchTraceProducts() {
  const response = await fetch(`${API_BASE}/traceability/products`);
  return readJson(response, "Products");
}

export async function fetchDashboard(actorId) {
  const response = await fetch(
    `${API_BASE}/traceability/dashboard?actor_id=${encodeURIComponent(actorId)}`
  );
  return readJson(response, "Dashboard");
}

export async function fetchLots(actorId) {
  const response = await fetch(
    `${API_BASE}/traceability/lots?actor_id=${encodeURIComponent(actorId)}`
  );
  return readJson(response, "Lots");
}

export async function fetchLotDetail(lotId) {
  const response = await fetch(
    `${API_BASE}/traceability/lots/${encodeURIComponent(lotId)}`
  );
  return readJson(response, "Lot detail");
}

export async function fetchCatalog(actorId) {
  const response = await fetch(
    `${API_BASE}/traceability/catalog?actor_id=${encodeURIComponent(actorId)}`
  );
  return readJson(response, "Catalog");
}

export async function createLot(payload) {
  const response = await fetch(`${API_BASE}/traceability/lots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJson(response, "Create lot");
}

export async function createTransfer(payload) {
  const response = await fetch(`${API_BASE}/traceability/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJson(response, "Transfer");
}

export function qrUrl(lotCode) {
  return `${API_BASE}/qr/${encodeURIComponent(lotCode)}`;
}
