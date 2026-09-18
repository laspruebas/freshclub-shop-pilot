// =====================================================
// CONFIG
// =====================================================

import { validateSessionToken } from "./session.js";
import {
  createOrder,
  fetchAiInitialOrder,
  fetchInitialOrderFallback,
  fetchOrderDashboard
} from "./order/api.js";
import { renderOrderDashboard } from "./order/dashboard.js";
import {
  buildOrderItems,
  extraToOrderItem,
  normalizeInitialOrderItems
} from "./order/model.js";
import { getNextDeliveryMessage } from "./order/delivery.js";
import {
  renderExtras as renderExtrasView,
  renderOrder as renderOrderView,
  renderPedidoSummary as renderPedidoSummaryView
} from "./order/render.js";
import { initManualSearch } from "./order/search.js";

// =====================================================
// STATE
// =====================================================

const params = new URLSearchParams(window.location.search);
const token = params.get("t");
let householdId = null;

const statusEl = document.getElementById("status");
const orderListEl = document.getElementById("orderList");
const pedidoSummaryEl =
  document.getElementById("pedidoSummary");
const extrasEl = document.getElementById("extras");
const extrasBlockEl = document.getElementById("extrasBlock");

const manualSearchBlockEl = document.getElementById("manualSearchBlock");
const manualSearchToggleEl = document.getElementById("manualSearchToggle");
const manualSearchPanelEl = document.getElementById("manualSearchPanel");
const manualSearchInputEl = document.getElementById("manualSearchInput");
const manualSearchStatusEl = document.getElementById("manualSearchStatus");
const manualSearchResultsEl = document.getElementById("manualSearchResults");

const submitBtn = document.getElementById("submitBtn");
const headerEl = document.getElementById("header");

const pedidoLoadingEl =
  document.getElementById("pedidoLoading");

const reportLoadingEl =
  document.getElementById("reportLoading");

const reportLoadingTitleEl =
  document.getElementById("reportLoadingTitle");

let orderState = [];
let extraProducts = [];

// =====================================================
// HELPERS
// =====================================================

function setStatus(message, type = "") {
  statusEl.textContent = message || "";
  statusEl.className = "status";
  if (type) {
    statusEl.classList.add(type);
  }
}

function renderPedidoSummary() {
  renderPedidoSummaryView({
    orderState,
    pedidoSummaryEl,
    coverage: window.frutiCoverage || {}
  });
}

function renderOrder() {
  renderOrderView({
    orderState,
    orderListEl
  });
}

function renderExtras() {
  renderExtrasView({
    extraProducts,
    orderState,
    extrasEl
  });
}


// =====================================================
// API
// =====================================================

async function resolveSessionFromToken() {
  if (householdId) return;

  const data = await validateSessionToken(token);
  householdId = data.household_id;
}
async function loadInitialOrder() {
  try {

    let items = [];

    try {
      const aiData = await fetchAiInitialOrder(householdId);

      window.frutiCoverage =
        aiData.coverage || null;
      
      items = aiData?.items || [];
      extraProducts = aiData?.extras || [];

      if (!items.length) {
        throw new Error("AI initial order returned empty selection");
      }

    } catch (aiError) {
      console.warn("AI initial order failed, using DB fallback:", aiError);
      const fallbackData = await fetchInitialOrderFallback(householdId);
      items = fallbackData.items || [];
    }

    orderState = normalizeInitialOrderItems(items);

    renderPedidoSummary();
    renderOrder();
    renderExtras();
    setStatus("");

  } catch (error) {
    console.error(error);
    setStatus("Error cargando pedido", "error");
  }
}

orderListEl.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;

  const index = Number(btn.dataset.index);
  const action = btn.dataset.action;

  if (isNaN(index)) return;

  if (action === "plus") {
    orderState[index].qty += 1;
  }

  if (action === "minus") {
    const nextQty = orderState[index].qty - 1;
  
    if (nextQty <= 0) {
      const confirmDelete = confirm("¿Eliminar este producto del pedido?");
      if (confirmDelete) {
        orderState.splice(index, 1);
      }
    } else {
      orderState[index].qty = nextQty;
    }
  }  
  renderOrder();
});

extrasEl.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;

  const productId = btn.dataset.add;
  if (!productId) return;

  const selectedExtra = extraProducts.find((item) => {
    const product = item.product || item;
    return product.product_id === productId;
  });
  
  if (!selectedExtra) return;
  
  const orderItem = extraToOrderItem(selectedExtra);
  if (!orderItem) return;

  orderState.push(orderItem);

  renderOrder();
  renderExtras();
});

initManualSearch({
  getHouseholdId: () => householdId,
  getOrderState: () => orderState,
  addOrderItem: (item) => {
    orderState.push(item);
  },
  renderOrder,
  renderExtras,
  manualSearchToggleEl,
  manualSearchPanelEl,
  manualSearchInputEl,
  manualSearchStatusEl,
  manualSearchResultsEl
});

async function submitOrder() {
  if (!householdId) {
    setStatus("Falta household_id en la URL.", "error");
    return;
  }

  const items = buildOrderItems(orderState);

  if (items.length === 0) {
    setStatus("Elegí al menos un producto.", "error");
    return;
  }

  const payload = {
    household_id: householdId,
    channel: "whatsapp_external_link",
    items
  };

  try {
    reportLoadingTitleEl.innerHTML = `
      <span class="report-loading-done">
        Listo!
      </span>
    
      <span class="report-loading-message">
        ${getNextDeliveryMessage()}
      </span>
    `;
    
    reportLoadingEl.classList.remove("hidden");
    
    submitBtn.disabled = true;

    const data = await createOrder(payload);

    const orderId = data?.order_id || "";

    if (!orderId) {
      throw new Error("Order created without order_id");
    }

   reportLoadingTitleEl.innerHTML = `
      <span class="report-loading-done">
        Listo.
      </span>
    
      <span class="report-loading-message">
        ${getNextDeliveryMessage()}
      </span>
    `;
    
    reportLoadingEl.classList.remove("hidden");
    
    submitBtn.disabled = true;

    orderListEl.innerHTML = "";
    
    if (extrasBlockEl) {
      extrasBlockEl.style.display = "none";
    }
    
    if (manualSearchBlockEl) {
      manualSearchBlockEl.style.display = "none";
    }
    
    submitBtn.style.display = "none";
    
    const dashboardData =
      await fetchOrderDashboard(orderId);
    
    renderOrderDashboard(dashboardData, {
      headerEl,
      pedidoSummaryEl,
      orderListEl
    });
    
    setTimeout(() => {
    
      reportLoadingEl.classList.add("hidden");
    
    }, 400);

    
  } catch (error) {
    console.error("Error creating order:", error);
    reportLoadingEl?.classList.add("hidden");
    setStatus("No se pudo crear la orden.", "error");
    submitBtn.disabled = false;
  }
}    
    
// =====================================================
// INIT
// =====================================================

submitBtn.addEventListener("click", submitOrder);

async function initApp() {
  try {
    await resolveSessionFromToken();

    if (!householdId) {
      setStatus("Abrí este link desde WhatsApp con una sesión válida.", "error");
      return;
    }

    setStatus(`Hogar detectado: ${householdId}`);
    await loadInitialOrder();
    
    setTimeout(() => {
    
      pedidoLoadingEl?.classList.add("hidden");
    
    }, 300);
    
  } catch (error) {
    console.error("Error resolving session:", error);
    pedidoLoadingEl?.classList.add("hidden");
    setStatus("No se pudo validar la sesión del pedido.", "error");
  }
}

initApp();
