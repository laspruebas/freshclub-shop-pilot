import { API_BASE } from "../config.js";

async function readJson(response, label) {
  if (!response.ok) {
    throw new Error(`${label} HTTP ${response.status}`);
  }

  return await response.json();
}

export async function fetchDeliverySlots() {
  const response = await fetch(
    `${API_BASE}/delivery-slots`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  return readJson(response, "Delivery slots");
}

export async function completeOnboarding(payload) {
  const response = await fetch(
    `${API_BASE}/onboarding/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  return readJson(response, "Onboarding complete");
}
