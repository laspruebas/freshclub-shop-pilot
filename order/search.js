import { searchCatalogProducts } from "./api.js";
import { manualProductToOrderItem } from "./model.js";
import { renderManualSearchResults } from "./render.js";

export function initManualSearch({
  getHouseholdId,
  getOrderState,
  addOrderItem,
  renderOrder,
  renderExtras,
  manualSearchToggleEl,
  manualSearchPanelEl,
  manualSearchInputEl,
  manualSearchStatusEl,
  manualSearchResultsEl
}) {
  let results = [];
  let timeoutId = null;
  let searchRequestId = 0;

  function renderResults() {
    renderManualSearchResults({
      manualSearchResults: results,
      orderState: getOrderState(),
      manualSearchInputEl,
      manualSearchStatusEl,
      manualSearchResultsEl
    });
  }

  async function search(query) {
    const householdId = getHouseholdId();
    const cleanQuery = String(query || "").trim();
    const requestId = ++searchRequestId;

    if (!householdId || cleanQuery.length < 2) {
      results = [];
      renderResults();
      return;
    }

    try {
      manualSearchStatusEl.textContent = "Buscando...";

      const data =
        await searchCatalogProducts(
          householdId,
          cleanQuery
        );

      if (requestId !== searchRequestId) {
        return;
      }

      results = data.items || [];

      renderResults();
      manualSearchStatusEl.textContent = "";
    } catch (error) {
      if (requestId !== searchRequestId) {
        return;
      }

      console.error("Error searching manual products:", error);
      results = [];
      renderResults();
      manualSearchStatusEl.textContent =
        "No se pudo buscar productos.";
    }
  }

  manualSearchToggleEl?.addEventListener("click", () => {
    const isHidden =
      manualSearchPanelEl.hasAttribute("hidden");

    if (isHidden) {
      manualSearchPanelEl.removeAttribute("hidden");
      manualSearchToggleEl.textContent = "Ocultar búsqueda";
      manualSearchInputEl.focus();
    } else {
      manualSearchPanelEl.setAttribute("hidden", "");
      manualSearchToggleEl.textContent = "¿Buscás algo más?";
    }
  });

  manualSearchInputEl?.addEventListener("input", (event) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      search(event.target.value);
    }, 300);
  });

  manualSearchResultsEl?.addEventListener("click", (event) => {
    const btn =
      event.target.closest("button");

    if (!btn) return;

    const productId =
      btn.dataset.manualAdd;

    if (!productId) return;

    const product =
      results.find(
        (item) => item.product_id === productId
      );

    if (!product) return;

    const orderItem =
      manualProductToOrderItem(product);

    if (!orderItem) return;

    addOrderItem(orderItem);

    renderOrder();
    renderExtras();
    renderResults();
  });

  return {
    renderResults
  };
}
