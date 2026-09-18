import {
  fetchAiInitialOrder,
  fetchInitialOrderFallback
} from "./api.js";
import { normalizeInitialOrderItems } from "./model.js";

export async function loadInitialOrderData(householdId) {
  let items = [];
  let extras = [];
  let coverage = null;

  try {
    const aiData =
      await fetchAiInitialOrder(householdId);

    coverage = aiData.coverage || null;
    items = aiData?.items || [];
    extras = aiData?.extras || [];

    if (!items.length) {
      throw new Error(
        "AI initial order returned empty selection"
      );
    }
  } catch (aiError) {
    console.warn(
      "AI initial order failed, using DB fallback:",
      aiError
    );

    const fallbackData =
      await fetchInitialOrderFallback(householdId);

    items = fallbackData.items || [];
  }

  return {
    orderState: normalizeInitialOrderItems(items),
    extraProducts: extras,
    coverage
  };
}
