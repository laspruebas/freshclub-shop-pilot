// =====================================================
// CONFIG
// =====================================================

const API_BASE = "https://fruti-api-y5uz.onrender.com";

const PRODUCT_COLORS = {
  Banana: "#facc15",
  Cebolla: "#a855f7",
  Manzana: "#ef4444",
  Naranja: "#fb923c",
  Papa: "#eab308",
  Pimiento: "#ef4444",
  Tomate: "#ef4444",
  Zanahoria: "#f97316"
};

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
  let total = 0;

  Object.entries(cart).forEach(([id, qty]) => {
    const product = catalog.find(p => p.product_id === id);
    if (product) {
      total += product.price * qty;
    }
  });

  if (total > 0) {
    submitBtn.textContent = `Confirmar $${Math.round(total)}`;
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
  const next = Math.max(0, current + (delta * STEP));
  cart[productId] = next;
  const controlsEl = document.getElementById(`controls-${productId}`);
  
  if (controlsEl) {
    if (next === 0) {
      controlsEl.innerHTML = `
        <button
          class="add-btn"
          type="button"
          data-action="add"
          data-id="${productId}"
        >
          + Agregar
        </button>
      `;
    } else {
      controlsEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <button
            class="qty-btn"
            type="button"
            data-action="minus"
            data-id="${productId}"
          >−</button>
  
          <div id="qty-${productId}" style="min-width:40px;text-align:center;">
            ${next} kg
          </div>
  
          <button
            class="qty-btn"
            type="button"
            data-action="plus"
            data-id="${productId}"
          >+</button>
        </div>
      `;
    }
  }
  const qtyEl = document.getElementById(`qty-${productId}`);
  if (qtyEl) {
    qtyEl.textContent = `${next} kg`;
  }
  const product = catalog.find(p => p.product_id === productId);
  const total = product ? product.price * next : 0;

  const totalEl = document.getElementById(`total-${productId}`);
  if (totalEl) {
    totalEl.textContent = `$${Math.round(total)}`;
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
  document.getElementById("header").style.display = "block";
  if (!items || items.length === 0) {
    renderEmpty("No hay productos disponibles por ahora.");
    return;
  }

  catalogEl.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    
    const color = PRODUCT_COLORS[item.name] || "#e5e7eb";
    
        
    card.innerHTML = `
<div class="card-top">
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="
      width:10px;
      height:10px;
      border-radius:999px;
      background:${color};
      flex-shrink:0;
    "></div>

    <div>
      <h2 class="card-title">${item.name}</h2>
      <div class="card-meta">${item.price_label} / ${item.unit}</div>
    </div>
  </div>
</div>

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-top:12px;
      ">
      <div>
        <div style="font-weight:700;font-size:18px;" id="total-${item.product_id}">
          $0
        </div>
      </div>

    <div id="controls-${item.product_id}">
      <button
        class="add-btn"
        type="button"
        data-action="add"
        data-id="${item.product_id}"
      >
        + Agregar
      </button>
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

  if (action === "add") {
    changeQty(productId, 1);
  }

  if (action === "plus") {
    changeQty(productId, 1);
  }

  if (action === "minus") {
    changeQty(productId, -1);
  }
});
function renderPreparingReport() {
  document.getElementById("header").style.display = "none";
  catalogEl.innerHTML = `
    <div class="empty" style="
      max-width:720px;
      margin:40px auto;
      text-align:center;
      color:#1f2937;
    ">

      <div style="font-size:22px;font-weight:700;margin-bottom:10px;">
        Preparando tu reporte Fruti
      </div>

      <div style="color:#4b5563;margin-bottom:20px;">
        Estamos analizando tu compra.
      </div>

      <div class="fruit-bounce">
        <span>🍎</span>
        <span>🥬</span>
        <span>🥕</span>
      </div>
    </div>
  `;
}

function renderOrderConfirmed() {
  document.getElementById("header").style.display = "none";
  catalogEl.innerHTML = `
    <div class="empty" style="
      max-width:720px;
      margin:40px auto;
      text-align:center;
      color:#1f2937;
    ">
      <div style="font-size:24px;font-weight:700;margin-bottom:10px;">
        ¡Listo!
      </div>

      <div style="color:#4b5563;">
        Tu pedido fue generado correctamente.
      </div>
    </div>
  `;
}

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

async function loadOrderDashboard(orderId) {
  const response = await fetch(`${API_BASE}/pilot/orders/${orderId}/dashboard`);

  if (!response.ok) {
    throw new Error(`Dashboard HTTP ${response.status}`);
  }

  return await response.json();
}

function renderDashboardFromApi(response, orderId) {
  console.log("renderDashboardFromApi response", response);

  const dash = response.dash_v1;
  console.log("dash", dash);

  const header = dash.header;
  const message1 = dash.message_1;
  const message2 = dash.message_2;
  const message3 = dash.message_3;
  const moreInfo = dash.more_info;
  const footer = dash.footer;

  const categoriesHtml = message2.categories
    .map((cat) => `
      <div style="margin-top:6px;font-size:16px;color:#1f2937;">
        ${cat.emoji} ${cat.label}
      </div>
    `)
    .join("");

  const suggestedProductsHtml = moreInfo.suggested_products
    .map((item) => `
      <div style="margin-top:6px;font-size:16px;color:#1f2937;">
        ${item.emoji} ${item.product}
      </div>
    `)
    .join("");

  const detailsRowsHtml = `
    <div style="margin-top:10px;font-size:15px;color:#374151;">
      Categorías en tu compra: ${moreInfo.order_categories.join(", ")}
    </div>

    <div style="margin-top:10px;font-size:15px;color:#374151;">
      Categorías de la semana: ${moreInfo.weekly_categories_count} / ${moreInfo.weekly_categories_target}
    </div>

    <div style="margin-top:10px;font-size:15px;color:#374151;">
      Porciones de la semana: ${moreInfo.weekly_portions} / ${moreInfo.weekly_target_portions}
    </div>

    <div style="margin-top:10px;font-size:15px;color:#374151;">
      Impacto estimado: ${moreInfo.days_equivalent_label}
    </div>

    <div style="margin-top:14px;font-size:15px;font-weight:600;color:#111827;">
      Productos sugeridos
    </div>

    <div style="margin-top:6px;">
      ${suggestedProductsHtml}
    </div>
  `;

  const shareText = [
    `🍎 ${header.title}`,
    header.subtitle,
    "",
    `📦 ${message1.title}`,
    message1.value,
    "",
    `🥗 ${message2.title}`,
    ...message2.categories.map((cat) => `${cat.emoji} ${cat.label}`),
    "",
    `📊 ${message3.title}`,
    message3.weekly_progress_label,
    message3.weekly_message,
    "",
    `📌 ${moreInfo.title}`,
    `Categorías: ${moreInfo.order_categories.join(", ")}`,
    `Semana: ${moreInfo.weekly_categories_count} / ${moreInfo.weekly_categories_target}`,
    `Porciones: ${moreInfo.weekly_portions} / ${moreInfo.weekly_target_portions}`,
    `Impacto: ${moreInfo.days_equivalent_label}`,
    "",
    `💡 Sugerencias`,
    ...moreInfo.suggested_products.map((item) => `${item.emoji} ${item.product}`),
    "",
    footer.message
  ].join("\n");

  const whatsappShareUrl =
    `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const whatsappReturnText = `FRESHCLUB_ORDER_DONE:${orderId}`;
  const whatsappReturnUrl =
    `https://wa.me/14155238886?text=${encodeURIComponent(whatsappReturnText)}`;

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
        ${header.title}
      </div>

      <div style="margin-bottom:20px;color:#4b5563;">
        ${header.subtitle}
      </div>

      <div style="margin-top:10px;font-weight:700;font-size:17px;">
        ${message1.title}
      </div>

      <div style="
        margin-top:8px;
        padding:14px 16px;
        background:#f7faf7;
        border:1px solid #dbead8;
        border-radius:12px;
        font-size:18px;
        font-weight:700;
      ">
        ${message1.value}
      </div>

      <div style="margin-top:24px;font-weight:700;font-size:17px;">
        ${message2.title}
      </div>

      <div style="margin-top:8px;">
        ${categoriesHtml}
      </div>

      <div style="margin-top:24px;font-weight:700;font-size:17px;">
        ${message3.title}
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
        ${message3.weekly_progress_label}
      </div>

      <div style="margin-top:10px;font-size:15px;color:#374151;">
        ${message3.weekly_message}
      </div>

      <details style="
        margin-top:24px;
        border:1px solid #e5e7eb;
        border-radius:12px;
        padding:14px 16px;
        background:#fcfcfc;
      ">
        <summary style="cursor:pointer;font-weight:700;font-size:16px;color:#111827;">
          ${moreInfo.title}
        </summary>

        <div style="margin-top:12px;">
          ${detailsRowsHtml}
        </div>
      </details>

      <div style="margin-top:22px;color:#4b5563;">
        ${footer.message}
      </div>

      <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${whatsappShareUrl}"
           style="
             display:inline-block;
             background:#16a34a;
             color:white;
             padding:10px 16px;
             border-radius:8px;
             text-decoration:none;
             font-weight:600;">
          Compartir reporte
        </a>

        <a href="${whatsappReturnUrl}"
           style="
             display:inline-block;
             background:#16a34a;
             color:#111827;
             padding:10px 16px;
             border-radius:8px;
             text-decoration:none;
             font-weight:600;">
          Volver a WhatsApp
        </a>
      </div>

    </div>
  `;
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

    const orderId = data?.order_id || "";

    if (!orderId) {
      throw new Error("Order created without order_id");
    }

    renderOrderConfirmed();
    submitBtn.style.display = "none";
    submitBtn.textContent = "Pedido enviado";
    submitBtn.disabled = true;

    setTimeout(() => {
      renderPreparingReport();

      setTimeout(async () => {
        try {
          const dashboardData = await loadOrderDashboard(orderId);
          console.log("dashboardData", dashboardData);
          renderDashboardFromApi(dashboardData, orderId);
        } catch (error) {
          console.error("Error loading dashboard:", error);
          setStatus("No se pudo cargar el dashboard.", "error");
        }
      }, 2500);
    }, 1500);
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
