// =====================================================
// CONFIG
// =====================================================

const API_BASE = "https://fruti-api-y5uz.onrender.com";

// === COLORS ===
// Orden alineado con UX: frutas → verduras base → complemento
export const PRODUCT_COLORS = {
  // 🍎 FRUTAS
  Banana: "#facc15",
  Manzana: "#ef4444",
  Naranja: "#fb923c",

  // 🥕 VERDURAS BASE
  Papa: "#eab308",
  Tomate: "#ef4444",
  Zanahoria: "#f97316",

  // 🧅 COMPLEMENTO / SABOR
  Cebolla: "#a855f7",
  Pimiento: "#ef4444"
};

// =====================================================
// STATE
// =====================================================

const params = new URLSearchParams(window.location.search);
const token = params.get("t");
let householdId = null;

const statusEl = document.getElementById("status");
const orderListEl = document.getElementById("orderList");
const extrasEl = document.getElementById("extras");
const submitBtn = document.getElementById("submitBtn");
const subtitleEl = document.getElementById("subtitle");

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

// =====================================================
// RENDER
// =====================================================

function renderPreparingReport() {
  document.getElementById("header").style.display = "none";
  orderListEl.innerHTML = `
    <div class="empty" style="
      max-width:720px;
      margin:40px auto;
      text-align:center;
      color:#1f2937;
    ">

      <div style="font-size:22px;font-weight:700;margin-bottom:10px;">
        Estamos preparando tu reporte Fruti
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
  orderListEl.innerHTML = `
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

function renderOrder() {
  if (!orderState.length) {
    orderListEl.innerHTML = `<div class="empty">No hay productos</div>`;
    return;
  }

  orderListEl.innerHTML = "";

  orderState.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";
    
    const color = PRODUCT_COLORS[item.name] || "#e5e7eb";
    
    card.style.borderLeft = `6px solid ${color}`;

    card.innerHTML = `
      <div class="card-top">
        <div>
          <p class="card-title">${item.name}</p>
          <div class="item-category">${item.emoji} ${item.category}</div>
        </div>
      </div>


      <div class="item-actions" style="
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top:12px;
">

  <!-- IZQUIERDA: ORIGEN -->
  <div class="item-origin" style="
    font-size:14px;
    color:#6b7280;
  ">
    Origen
  </div>

  <!-- DERECHA: CONTROLES -->
  <div class="qty-row" style="
    display:flex;
    align-items:center;
    gap:10px;
  ">
    <button class="qty-btn" data-action="minus" data-index="${index}">−</button>
    
    <div class="qty-value">${item.qty} ${item.unit || ""}</div>
    
    <button class="qty-btn" data-action="plus" data-index="${index}">+</button>
  </div>

</div>
    `;

    orderListEl.appendChild(card);
  });
}

function renderExtras() {
  if (!extraProducts.length) {
    extrasEl.innerHTML = "";
    return;
  }

  extrasEl.innerHTML = `
    <div style="margin-top:16px;font-weight:700;">
      ¿Querés sumar algo más?
    </div>
  `;

  extraProducts.forEach((item) => {
  
    const alreadyInOrder = orderState.some(
      (p) => p.product_id === item.product_id
    );
  
    if (alreadyInOrder) return;
  
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-top">
        <div>
          <p class="card-title">${item.ux_display_name || item.product_name}</p>
          <div class="item-category">${item.ux_emoji} ${item.ux_category_label}</div>
        </div>
      </div>

      <div style="margin-top:12px;text-align:right;">
        <button class="add-btn" data-add="${item.product_id}">
          Agregar
        </button>
      </div>
    `;

    extrasEl.appendChild(card);
  });
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

async function loadInitialOrder() {
  try {
    setStatus("Cargando pedido sugerido...");

    const response = await fetch(
      `${API_BASE}/initial-order/${householdId}`
    );

    if (!response.ok) {
      throw new Error(`Initial order HTTP ${response.status}`);
    }

    const data = await response.json();

   orderState = data.items.map(item => ({
      product_id: item.product_id,
      name: item.ux_display_name || item.product_name,
      qty: item.suggested_qty,
      unit: item.unit,
      category: item.ux_category_label,
      emoji: item.ux_emoji
    }));;

    renderOrder();
    setStatus("");

  } catch (error) {
    console.error(error);
    setStatus("Error cargando pedido", "error");
  }
}

async function loadExtras() {
  try {
    const res = await fetch(`${API_BASE}/initial-order/${householdId}/extras`);

    if (!res.ok) {
      throw new Error(`Extras HTTP ${res.status}`);
    }

    const data = await res.json();

    extraProducts = data.items;

    renderExtras();

  } catch (err) {
    console.error("Error loading extras", err);
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
      Muy bien! Ya tenes para ${moreInfo.days_equivalent_label}
    </div>

    <div style="margin-top:14px;font-size:15px;font-weight:600;color:#111827;">
      La próxima podes probar estos productos:
    </div>

    <div style="margin-top:6px;">
      ${suggestedProductsHtml}
    </div>
  `;

  const shareText = dash.share.message;

  const whatsappShareUrl =
    `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  // Volver a WhatsApp SIN mensaje draft
  const whatsappReturnUrl = `https://wa.me/14155238886`;
  
  orderListEl.innerHTML = `
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

      <div style="margin-bottom:10px;color:#4b5563;">
        ${header.subtitle}
      </div>

      <div style="margin-top:20px;font-weight:700;font-size:17px;">
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

  const product = extraProducts.find(p => p.product_id === productId);
  if (!product) return;

  orderState.push({
    product_id: product.product_id,
    name: product.ux_display_name || product.product_name,
    qty: 1,
    unit: product.unit,
    category: product.ux_category_label,
    emoji: product.ux_emoji
  });

  renderOrder();
  renderExtras();
});

async function submitOrder() {
  if (!householdId) {
    setStatus("Falta household_id en la URL.", "error");
    return;
  }

  const items = orderState
    .filter(item => item.qty > 0)
    .map(item => ({
      product_id: item.product_id,
      qty: item.qty
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
    
    // ocultar extras
    extrasEl.innerHTML = "";
    extrasEl.style.display = "none";
    
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
    await loadExtras();
  } catch (error) {
    console.error("Error resolving session:", error);
    setStatus("No se pudo validar la sesión del pedido.", "error");
  }
}

initApp();
