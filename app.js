// =====================================================
// CONFIG
// =====================================================

import { validateSessionToken } from "./session.js";
import { escapeHtml } from "./utils.js";
import {
  createOrder,
  fetchAiInitialOrder,
  fetchInitialOrderFallback,
  fetchOrderDashboard,
  searchCatalogProducts
} from "./order/api.js";
import { renderOrderDashboard } from "./order/dashboard.js";
import {
  buildOrderItems,
  extraToOrderItem,
  manualProductToOrderItem,
  normalizeInitialOrderItems
} from "./order/model.js";
import { getNextDeliveryMessage } from "./order/delivery.js";

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
let manualSearchResults = [];
let manualSearchTimeout = null;

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

function handleImageError(img) {

  if (!img) return;

  img.onerror = null;

  img.style.visibility = "hidden";
}

// =====================================================
// RENDER
// =====================================================

function renderPedidoSummary() {
  
  const totalSelectedProducts = orderState.length;

  const coverage =
  window.frutiCoverage || {};

  const daysLabel =
  coverage.days_label || "";

  pedidoSummaryEl.innerHTML = `
    <section class="pedido-summary-card">

      <div class="pedido-summary-tag">
        TU SEMANA ESTÁ RESUELTA
      </div>

      <div class="pedido-summary-stats">

        <div class="pedido-summary-stat">
          <div class="pedido-summary-value">
            ${totalSelectedProducts}
          </div>
        
          <div class="pedido-summary-label">
            productos elegidos
          </div>
        </div>

        <div class="pedido-summary-divider"></div>

        <div class="pedido-summary-stat">
          <div class="pedido-summary-value">
            ${daysLabel}
          </div>

          <div class="pedido-summary-label">
            de frutas y verduras
          </div>
        </div>

      </div>

      <div class="pedido-summary-foot">
        No tuviste que pensar qué comprar.
      </div>

    </section>
  `;
}

const GROUP_TITLES = {
  base_week: "La base de la semana",
  daily: "Para todos los días",
  variety: "Más variedad para esta semana",
  energy: "Energía natural"
};

function renderOrder() {
  if (!orderState.length) {
    orderListEl.innerHTML = `<div class="empty">No hay productos</div>`;
    return;
  }

orderListEl.innerHTML = "";

let currentGroup = null;

orderState.forEach((item, index) => {

  if (item.display_group !== currentGroup) {

    currentGroup = item.display_group;

    const groupTitle =
      document.createElement("div");

    groupTitle.className =
      "pedido-group-title";

    groupTitle.textContent =
      GROUP_TITLES[item.display_group] ||
      item.display_group;

    orderListEl.appendChild(groupTitle);
  }
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="product-row">
        <img 
          class="product-img"
          src="${escapeHtml(item.image_url || '')}" 
          alt=""
          loading="lazy"
          data-product-id="${escapeHtml(item.product_id)}"
          data-product-name="${escapeHtml(item.name)}"
        />
    
        <div class="product-content">
          <div class="product-main">
            <p class="card-title">${escapeHtml(item.name)}</p>
            ${item.category ? `<div class="item-category">${escapeHtml(item.category)}</div>` : ""}
            <a class="item-origin" href="./origen.html">
              Ver origen
            </a>
          </div>
    
          <div class="qty-row">
            <button class="qty-btn" data-action="minus" data-index="${index}">−</button>
            <div class="qty-value">
              ${escapeHtml(item.qty ?? item.suggested_qty)} ${escapeHtml(item.unit_label || item.unit || "")}
            </div>
            <button class="qty-btn" data-action="plus" data-index="${index}">+</button>
          </div>
        </div>
      </div>
    `;

    const img = card.querySelector(".product-img");
    if (img) {
      img.addEventListener("error", () => handleImageError(img));
    }
    
    orderListEl.appendChild(card);
  });
}

function renderExtras() {
  if (!extraProducts.length) {
    extrasEl.innerHTML = "";
    return;
  }

  extrasEl.innerHTML = "";

  extraProducts.forEach((item) => {
    const product = item.product || item;
    const alreadyInOrder = orderState.some(
      (p) => p.product_id === product.product_id
    );
  
    if (alreadyInOrder) return;
      
    const card = document.createElement("div");
    card.className = "card";
    
    card.innerHTML = `
      <div class="product-row extra-row">
        <img
          class="product-img"
          src="${escapeHtml(product.image_url || '')}"
          alt=""
          loading="lazy"
          data-product-id="${escapeHtml(product.product_id)}"
          data-product-name="${escapeHtml(
            product.ux_display_name ||
            product.name ||
            product.product_name ||
            ''
          )}"
        />
    
        <div class="product-content">
          <div class="product-main">
            <p class="card-title">
              ${escapeHtml(
                product.ux_display_name ||
                product.name ||
                product.product_name ||
                ""
              )}
            </p>
    
            ${
              (product.product_category || product.ux_category_label)
                ? `<div class="item-category">${escapeHtml(
                    product.product_category ||
                    product.ux_category_label
                  )}</div>`
                : ""
            }
          </div>
    
          <button
            class="add-btn"
            data-add="${escapeHtml(product.product_id)}">
            + Agregar
          </button>
        </div>
      </div>
    `;
    const img = card.querySelector(".product-img");
    if (img) {
      img.addEventListener("error", () => handleImageError(img));
    }
    
    extrasEl.appendChild(card);
  });
}

function renderManualSearchResults() {
  if (!manualSearchResultsEl) return;

  const query = String(manualSearchInputEl?.value || "").trim();

  if (query.length < 2) {
    manualSearchResultsEl.innerHTML = "";
    manualSearchStatusEl.textContent = "";
    return;
  }

  const visibleItems = manualSearchResults.filter((item) => {
    return !orderState.some((p) => p.product_id === item.product_id);
  });

  if (!visibleItems.length) {
    manualSearchResultsEl.innerHTML = `
      <div class="manual-search-empty">
        No encontramos productos para esa búsqueda.
      </div>
    `;
    return;
  }

  manualSearchResultsEl.innerHTML = "";

  visibleItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="product-row extra-row">
        <img 
          class="product-img"
          src="${escapeHtml(item.image_url || '')}" 
          alt=""
          loading="lazy"
          data-product-id="${escapeHtml(item.product_id)}"
          data-product-name="${escapeHtml(item.ux_display_name || item.product_name || '')}"
        />

        <div class="product-content">
          <div class="product-main">
            <p class="card-title">${escapeHtml(item.ux_display_name || item.product_name || "")}</p>
            ${item.ux_category_label ? `<div class="item-category">${escapeHtml(item.ux_category_label)}</div>` : ""}
          </div>

          <button class="add-btn" data-manual-add="${escapeHtml(item.product_id)}">
            + Agregar
          </button>
        </div>
      </div>
    `;

    const img = card.querySelector(".product-img");
    if (img) {
      img.addEventListener("error", () => handleImageError(img));
    }

    manualSearchResultsEl.appendChild(card);
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

async function searchManualProducts(query) {
  const cleanQuery = String(query || "").trim();

  if (!householdId || cleanQuery.length < 2) {
    manualSearchResults = [];
    renderManualSearchResults();
    return;
  }

  try {
    manualSearchStatusEl.textContent = "Buscando...";

    const data = await searchCatalogProducts(householdId, cleanQuery);

    manualSearchResults = data.items || [];

    renderManualSearchResults();
    manualSearchStatusEl.textContent = "";

  } catch (error) {
    console.error("Error searching manual products:", error);
    manualSearchResults = [];
    renderManualSearchResults();
    manualSearchStatusEl.textContent = "No se pudo buscar productos.";
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

manualSearchToggleEl?.addEventListener("click", () => {
  const isHidden = manualSearchPanelEl.hasAttribute("hidden");

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
  const query = event.target.value;

  clearTimeout(manualSearchTimeout);

  manualSearchTimeout = setTimeout(() => {
    searchManualProducts(query);
  }, 300);
});

manualSearchResultsEl?.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;

  const productId = btn.dataset.manualAdd;
  if (!productId) return;

  const product = manualSearchResults.find((p) => p.product_id === productId);
  if (!product) return;

  const orderItem = manualProductToOrderItem(product);
  if (!orderItem) return;

  orderState.push(orderItem);

  renderOrder();
  renderExtras();
  renderManualSearchResults();
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
