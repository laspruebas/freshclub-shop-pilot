// =====================================================
// CONFIG
// =====================================================

import { validateSessionToken } from "./session.js";
import { extraToOrderItem } from "./order/model.js";
import { loadInitialOrderData } from "./order/load.js";
import {
  renderExtras as renderExtrasView,
  renderOrder as renderOrderView,
  renderPedidoSummary as renderPedidoSummaryView
} from "./order/render.js";
import { initManualSearch } from "./order/search.js";
import { submitOrderFlow } from "./order/submit.js";

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
    const initialOrder =
      await loadInitialOrderData(householdId);

    orderState = initialOrder.orderState;
    extraProducts = initialOrder.extraProducts;
    window.frutiCoverage = initialOrder.coverage;

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


// =====================================================
// INIT
// =====================================================

submitBtn.addEventListener("click", () => {
  submitOrderFlow({
    householdId,
    orderState,
    setStatus,
    submitBtn,
    reportLoadingEl,
    reportLoadingTitleEl,
    orderListEl,
    extrasBlockEl,
    manualSearchBlockEl,
    headerEl,
    pedidoSummaryEl
  });
});

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
