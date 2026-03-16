// =====================================================
// CONFIG
// =====================================================

const API_BASE = "https://fruti-api-y5uz.onrender.com";

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
let householdId = null;

const statusEl = document.getElementById("status");
const catalogEl = document.getElementById("catalog");
const submitBtn = document.getElementById("submitBtn");

let catalog = [];
const cart = {};

const STEP = 0.5;

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
  if (qty < 1) return `${qty * 1000} g`;
  return `${qty} kg`;
}
function roundToHalf(value) {
  return Math.round(Number(value || 0) * 2) / 2;
}

function formatHalf(value) {
  const rounded = roundToHalf(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTagList(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<div style="color:#6b7280;">Sin datos todavía.</div>`;
  }

  return items
    .map((item) => `
      <span style="
        display:inline-block;
        margin:0 8px 8px 0;
        padding:8px 12px;
        background:#f3f4f6;
        border:1px solid #e5e7eb;
        border-radius:999px;
        font-size:14px;
        color:#374151;
      ">
        ${escapeHtml(item)}
      </span>
    `)
    .join("");
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

  const response = await fetch(
    `${API_BASE}/fruti/session-validate?t=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

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

    const dash = data?.fruti_insight?.dash_v1 || {};

    const portions =
      dash?.portions ??
      dash?.portions_of_order ??
      dash?.order_portions ??
      0;

    const distinctCategoriesInOrder =
      dash?.distinct_categories_in_order ??
      dash?.distinct_categories_order ??
      0;

    const orderCategories =
      dash?.order_categories ??
      dash?.categories_in_order ??
      [];

    const daysEquivalentForHousehold =
      dash?.days_equivalent_for_household ??
      dash?.days_equivalent ??
      0;

    const distinctCategoriesWeek =
      dash?.distinct_categories_week ??
      0;

    const weekCategories =
      dash?.week_categories ??
      dash?.categories_week ??
      orderCategories ??
      [];

    const suggestedItems =
      dash?.suggested_missing_categories_products ??
      dash?.suggested_missing_categories ??
      dash?.suggested_products ??
      [];

    const orderId = data?.order_id || "";

    const whatsappReturnText = orderId
      ? `FRESHCLUB_ORDER_DONE:${orderId}`
      : "FRESHCLUB_ORDER_DONE";

    const whatsappReturnUrl =
      `https://wa.me/5491139495554?text=${encodeURIComponent(whatsappReturnText)}`;

        catalogEl.innerHTML = `
      <div class="empty" style="
        max-width:720px;
        margin:24px auto;
        background:#fff;
        border:1px solid #e8e8e8;
        border-radius:16px;
        padding:24px;
        box-shadow:0 2px 10px rgba(0,0,0,0.04);
        color:#1f2937;
        line-height:1.45;
        text-align:left;
      ">

        <div style="font-size:22px;font-weight:700;margin-bottom:8px;">
         🍎 Bienvenidos a FRUTI
        </div>

        <div style="margin-bottom:20px;color:#4b5563;">
          Hoy tu hogar comenzó a medir su alimentación.
        </div>

        <div style="margin-top:10px;font-weight:700;font-size:17px;">
          Impacto de tus compras
        </div>

        <div style="margin-top:8px;color:#4b5563;">
          Medimos <strong>cantidad y diversidad</strong> de frutas y verduras.
        </div>

        <div style="
          margin-top:12px;
          padding:14px 16px;
          background:#f7faf7;
          border:1px solid #dbead8;
          border-radius:12px;
          font-size:18px;
          font-weight:700;
        ">
          ${Math.round(portions)} porciones · ${distinctCategoriesInOrder} categorías
        </div>

        <div style="margin-top:12px;">
          ${renderTagList(orderCategories)}
        </div>

        <div style="margin-top:24px;font-weight:700;font-size:17px;">
          Tu índice FRUTI
        </div>

        <div style="margin-top:8px;color:#4b5563;">
          Es tu primera compra registrada.
        </div>

        <div style="margin-top:4px;color:#4b5563;">
          Con tus próximas compras recibirás tu <strong>índice FRUTI</strong>.
        </div>

        <div style="margin-top:24px;font-weight:700;font-size:17px;">
          Desafío de esta semana
        </div>

        <div style="margin-top:8px;color:#4b5563;">
          Esta compra aporta frutas y verduras para aproximadamente:
        </div>

        <div style="
          margin-top:12px;
          padding:14px 16px;
          background:#f9fafb;
          border:1px solid #e5e7eb;
          border-radius:12px;
          font-size:18px;
          font-weight:700;
        ">
          ${formatHalf(daysEquivalentForHousehold)} días para tu hogar
        </div>

        <div style="margin-top:18px;color:#4b5563;">
          Tu hogar consumió:
        </div>

        <div style="
          margin-top:8px;
          padding:14px 16px;
          background:#f9fafb;
          border:1px solid #e5e7eb;
          border-radius:12px;
          font-size:18px;
          font-weight:700;
        ">
          ${distinctCategoriesWeek} categorías de alimentos
        </div>

        <div style="margin-top:12px;">
          ${renderTagList(weekCategories)}
        </div>

        <div style="margin-top:18px;color:#4b5563;">
          Meta saludable:
        </div>

        <div style="
          margin-top:8px;
          padding:14px 16px;
          background:#fff9ed;
          border:1px solid #f3dfb2;
          border-radius:12px;
          font-size:18px;
          font-weight:700;
        ">
          5 categorías por semana
        </div>

        ${
          suggestedItems.length > 0
            ? `
              <div style="margin-top:18px;color:#4b5563;">
                En tu próxima compra podrías sumar:
              </div>

              <div style="margin-top:12px;">
                ${renderTagList(suggestedItems)}
              </div>
            `
            : ""
        }

        <div style="margin-top:22px;color:#4b5563;">
          Cada compra mejora la alimentación de tu familia.
        </div>

        <div style="margin-top:20px;">
          <a href="${whatsappReturnUrl}"
             style="
               display:inline-block;
               background:#25D366;
               color:white;
               padding:10px 16px;
               border-radius:8px;
               text-decoration:none;
               font-weight:600;">
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
    await loadCatalog();
  } catch (error) {
    console.error("Error resolving session:", error);
    setStatus("No se pudo validar la sesión del pedido.", "error");
  }
}

initApp();
