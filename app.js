// =====================================================
// CONFIG
// =====================================================

// Reemplazar por la URL real de tu backend cuando publiques /pilot/catalog
const API_BASE = "https://fruti-api-y5uz.onrender.com";

// Si el backend todavía no está listo, esto permite seguir probando la UX.
const FALLBACK_CATALOG = [
  {
    product_id: "e78d5f1c-9524-4cc2-a71b-fd3e1c55256f",
    name: "Banana",
    unit: "kg",
    price: 2500,
    currency: "ARS",
    price_label: "$2500"
  },
  {
    product_id: "b4f8aa9a-9cf4-452e-a858-65f6a8584f31",
    name: "Cebolla",
    unit: "kg",
    price: 1200,
    currency: "ARS",
    price_label: "$1200"
  },
  {
    product_id: "09d085fe-ffc3-45cb-b616-4907e20e2d18",
    name: "Manzana",
    unit: "kg",
    price: 2800,
    currency: "ARS",
    price_label: "$2800"
  },
  {
    product_id: "6e715066-8c9d-4a09-9c0c-9b711929abe7",
    name: "Naranja",
    unit: "kg",
    price: 2200,
    currency: "ARS",
    price_label: "$2200"
  },
  {
    product_id: "b423f67e-6b40-4263-a35a-c5ffdb78d250",
    name: "Papa",
    unit: "kg",
    price: 1500,
    currency: "ARS",
    price_label: "$1500"
  },
  {
    product_id: "a9683ac6-b8bd-4e17-9629-1d605cc4077b",
    name: "Pimiento",
    unit: "kg",
    price: 3200,
    currency: "ARS",
    price_label: "$3200"
  },
  {
    product_id: "9471ca56-bec4-48e1-942e-2ff2d5f2e29f",
    name: "Tomate",
    unit: "kg",
    price: 2400,
    currency: "ARS",
    price_label: "$2400"
  },
  {
    product_id: "9c26c94c-679e-4747-aa87-97bfaa9f620c",
    name: "Zanahoria",
    unit: "kg",
    price: 1400,
    currency: "ARS",
    price_label: "$1400"
  }
];

// =====================================================
// STATE
// =====================================================

const params = new URLSearchParams(window.location.search);
const token = params.get("t");
let householdId = params.get("household_id");

const statusEl = document.getElementById("status");
const catalogEl = document.getElementById("catalog");
const submitBtn = document.getElementById("submitBtn");

let catalog = [];
const cart = {};

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

function getSelectedItemsCount() {
  return Object.values(cart).reduce((acc, qty) => acc + qty, 0);
}

function updateSubmitButton() {
  const count = getSelectedItemsCount();

  if (count > 0) {
    submitBtn.textContent = `Confirmar pedido (${count})`;
  } else {
    submitBtn.textContent = "Confirmar pedido";
  }
}

function formatQty(qty) {
  if (qty === 0) return "0";
  if (qty < 1) return (qty * 1000) + " g";
  return qty + " kg";
}

function changeQty(productId, delta) {
  const current = cart[productId] || 0;
  const next = Math.max(0, current + delta);
  cart[productId] = next;

  const qtyEl = document.getElementById(`qty-${productId}`);
  if (qtyEl) {
    qtyEl.textContent = formatQty(next);
  }

  updateSubmitButton();
}

// =====================================================
// RENDER
// =====================================================

function renderEmpty(message) {
  catalogEl.innerHTML = `<div class="empty">${message}</div>`;
}

function renderCatalog(items) {
  if (!items || items.length === 0) {
    renderEmpty("No hay productos disponibles por ahora.");
    return;
  }

  catalogEl.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h2 class="card-title">${item.name}</h2>
          <div class="card-meta">${item.price_label} / ${item.unit}</div>
        </div>
      </div>

      <div class="qty-row">
        <button
          class="qty-btn"
          type="button"
          data-action="minus"
          data-id="${item.product_id}"
          aria-label="Restar ${item.name}"
        >−</button>

        <div class="qty-value" id="qty-${item.product_id}">0</div>

        <button
          class="qty-btn"
          type="button"
          data-action="plus"
          data-id="${item.product_id}"
          aria-label="Sumar ${item.name}"
        >+</button>
      </div>
    `;

    catalogEl.appendChild(card);
  });
}

const STEP = 0.5;

catalogEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const productId = button.dataset.id;
  const action = button.dataset.action;

  if (!productId || !action) return;

  if (action === "plus") {
    changeQty(productId, STEP);
  }

  if (action === "minus") {
    changeQty(productId, -STEP);
  }
});

// =====================================================
// API
// =====================================================

async function resolveSessionFromToken() {
  if (householdId || !token) {
    return;
  }

  const response = await fetch(`${API_BASE}/fruti/session-validate?t=${encodeURIComponent(token)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Session validate HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data?.household_id) {
    throw new Error("Session token did not return household_id");
  }

  householdId = data.household_id;
}

async function loadCatalog() {
  try {
    setStatus("Cargando catálogo...");

    const response = await fetch(`${API_BASE}/pilot/catalog`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Catalog HTTP ${response.status}`);
    }

    const data = await response.json();
    catalog = data.items || [];

    renderCatalog(catalog);
    setStatus("");
  } catch (error) {
    console.error("Error loading catalog:", error);
    catalog = FALLBACK_CATALOG;
    renderCatalog(catalog);
    setStatus("Mostrando catálogo de prueba.", "ok");
  }
}

async function submitOrder() {
  if (!householdId) {
    setStatus("Falta household_id en la URL.", "error");
    return;
  }

  const items = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([product_id, qty]) => ({
      product_id,
      qty
    }));

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
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";
    setStatus("Enviando pedido...");

    const response = await fetch(`${API_BASE}/pilot/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Order HTTP ${response.status}`);
    }

    const data = await response.json();

    setStatus("Pedido enviado.", "ok");
    submitBtn.textContent = "Pedido enviado";
    submitBtn.disabled = true;

    if (data.redirect_url) {
  window.location.href = data.redirect_url;
  return;
}

const insight = data?.fruti_insight || {};
const weekly = insight?.weekly_state || {};

const orderId = data?.order_id || "";

const whatsappReturnText = orderId
  ? `FRESHCLUB_ORDER_DONE:${orderId}`
  : "FRESHCLUB_ORDER_DONE";

const whatsappReturnUrl =
  `https://wa.me/5491139495554?text=${encodeURIComponent(whatsappReturnText)}`;
    
const insightMessage =
  data?.fruti_insight?.message ||
  "Pedido recibido. Ya podés volver a WhatsApp.";

const orderPortionsText =
  data?.fruti_insight?.order_portions != null
    ? `<div style="margin-top:8px;"><strong>${data.fruti_insight.order_portions}</strong> porciones en esta compra</div>`
    : "";

const totalPortionsText =
  data?.fruti_insight?.household_total_portions != null
    ? `<div style="margin-top:4px;">Tu hogar lleva <strong>${Math.round(insight.household_total_portions)}</strong> porciones esta semana</div>`
    : "";

const diversityText =
  data?.fruti_insight?.products_count != null
    ? `<div style="margin-top:4px;">${data.fruti_insight.products_count} familias de frutas y verduras agregadas</div>`
    : "";

catalogEl.innerHTML = `
  <div class="order-success">

    <div class="order-status">
      ✔ Pedido enviado
    </div>

    <div class="fruti-card">
      <h3 class="fruti-card-title">Tu impacto FRUTI</h3>

      <p class="fruti-main">
        Esta compra suma <strong>${insight.order_portions ?? 0}</strong> porciones
      </p>

      <p class="fruti-weekly">
        Tu hogar lleva esta semana
        <strong>${Math.round(insight.household_total_portions ?? 0)}</strong> porciones
      </p>

      <p class="fruti-diversity">
        +${insight.products_count ?? 0} familias de frutas y verduras
      </p>

      ${
        weekly?.target_portions_week != null &&
        weekly?.weekly_score != null &&
        weekly?.progress_percent != null
          ? `
        <div class="fruti-weekly-block">
          <div class="fruti-weekly-title">
            Estado de tu hogar esta semana
          </div>

          <div class="fruti-weekly-progress">
            ${Math.round(insight.household_total_portions ?? 0)} / ${weekly.target_portions_week} porciones
          </div>

          <div class="fruti-level">
            ${weekly.fruti_level || ""}
          </div>

          <div class="fruti-score">
            FRUTI score: ${weekly.weekly_score}
          </div>

          ${
            weekly.distinct_veg_categories != null
              ? `<div class="fruti-diversity-detail">Diversidad vegetal: ${weekly.distinct_veg_categories} categorías</div>`
              : ""
          }

          <div class="fruti-progress-bar">
            <div class="fruti-progress-fill" style="width:${Math.min(100, weekly.progress_percent)}%;"></div>
          </div>

          <div class="fruti-progress-label">
            ${weekly.progress_percent}%
          </div>
        </div>
        `
          : ""
      }
    </div>

    <div class="whatsapp-cta">
      <a
        href="${whatsappReturnUrl}"
        class="whatsapp-button"
      >
        Volver a WhatsApp
      </a>
    </div>

  </div>
`;   

submitBtn.style.display = "none";
    
  } catch (error) {
    console.error("Error creating order:", error);
    setStatus("No se pudo crear la orden.", "error");
    submitBtn.disabled = false;
    updateSubmitButton();
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
    updateSubmitButton();
    loadCatalog();
  } catch (error) {
    console.error("Error resolving session:", error);
    setStatus("No se pudo validar la sesión del pedido.", "error");
  }
}

initApp();
