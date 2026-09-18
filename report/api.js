import { API_BASE } from "../config.js";

export async function fetchHouseholdReport(householdId) {
  const response = await fetch(
    `${API_BASE}/pilot/households/${householdId}/report`
  );

  if (!response.ok) {
    throw new Error(
      `Household report HTTP ${response.status}`
    );
  }

  return await response.json();
}
