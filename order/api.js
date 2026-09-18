import { API_BASE } from "../config.js";

async function readJson(response, label) {
  if (!response.ok) {
    throw new Error(`${label} HTTP ${response.status}`);
  }

  return await response.json();
}

export async function fetchAiInitialOrder(householdId) {
  const response = await fetch(
    `${API_BASE}/ai/v3-selection/${householdId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  return readJson(response, "AI initial order");
}

export async function fetchInitialOrderFallback(householdId) {
  const response = await fetch(
    `${API_BASE}/initial-order/${householdId}`
  );

  return readJson(response, "Initial order fallback");
}

export async function searchCatalogProducts(householdId, query) {
  const response = await fetch(
    `${API_BASE}/initial-order/${householdId}/catalog-search?q=${encodeURIComponent(query)}`
  );

  return readJson(response, "Manual search");
}

export async function fetchOrderDashboard(orderId) {
  const response = await fetch(
    `${API_BASE}/pilot/orders/${orderId}/dashboard`
  );

  return readJson(response, "Dashboard");
}

export async function createOrder(payload) {
  const response = await fetch(
    `${API_BASE}/pilot/orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  return readJson(response, "Order");
}
