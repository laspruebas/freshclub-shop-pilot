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
const subtitleEl = document.getElementById("subtitle");
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

function handleImageError(img) {

  if (!img) return;

  img.onerror = null;

  img.style.visibility = "hidden";
}

// =====================================================
// RENDER
// =====================================================

function renderPedidoSummary() {

  const householdSize = 5;

  const totalQty =
    orderState.reduce(
      (acc, item) => acc + Number(item.qty || 0),
      0
    );

  const estimatedDays =
    Math.max(
      1,
      Math.round(totalQty / householdSize)
    );

  pedidoSummaryEl.innerHTML = `
    <section class="pedido-summary-card">

      <div class="pedido-summary-tag">
        PEDIDO RECOMENDADO PARA TU HOGAR
      </div>

      <div class="pedido-summary-stats">

        <div class="pedido-summary-stat">
          <div class="pedido-summary-value">
            ${householdSize}
          </div>

          <div class="pedido-summary-label">
            personas
          </div>
        </div>

        <div class="pedido-summary-divider"></div>

        <div class="pedido-summary-stat">
          <div class="pedido-summary-value">
            ~${estimatedDays} días
          </div>

          <div class="pedido-summary-label">
            de frutas y verduras
          </div>
        </div>

      </div>

      <div class="pedido-summary-foot">
        Podés ajustarlo antes de confirmar.
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

    let items = [];
    let source = "ai";

    try {
      const aiResponse = await fetch(
        `${API_BASE}/ai/v3-selection/${householdId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (!aiResponse.ok) {
        throw new Error(`AI initial order HTTP ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();

      items = aiData?.items || [];
      extraProducts = aiData?.extras || [];

      if (!items.length) {
        throw new Error("AI initial order returned empty selection");
      }

    } catch (aiError) {
      console.warn("AI initial order failed, using DB fallback:", aiError);
      source = "db";

      const fallbackResponse = await fetch(
        `${API_BASE}/initial-order/${householdId}`
      );

      if (!fallbackResponse.ok) {
        throw new Error(`Initial order fallback HTTP ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      items = fallbackData.items || [];
    }

    orderState = items
      .slice()
      .map(item => {
    
        const product = item.product || item;
        const quantity = item.quantity || {};
    
        return {
          product_id:
            product.product_id,
    
          name:
            product.ux_display_name ||
            product.name ||
            product.product_name ||
            "Producto",
    
          qty:
            quantity.suggested_qty ?? product.suggested_qty ?? 1,
    
          suggested_qty:
            quantity.suggested_qty ?? product.suggested_qty ?? 1,
    
          unit:
            quantity.unit ||
            product.unit,
    
          unit_label:
            quantity.unit_label ||
            product.unit_label,
    
          category:
            product.product_category ||
            product.ux_category_label,
    
          image_url:
            product.image_url,
    
          reason:
            item.reason,
    
          source:
            item.source,
    
          slot:
            item.slot

          display_group:
            item.display_group
        };
    
      });
    console.log("Initial order source:", source, orderState);
    
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

    const response = await fetch(
      `${API_BASE}/initial-order/${householdId}/catalog-search?q=${encodeURIComponent(cleanQuery)}`
    );

    if (!response.ok) {
      throw new Error(`Manual search HTTP ${response.status}`);
    }

    const data = await response.json();

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

async function loadOrderDashboard(orderId) {
  const response = await fetch(`${API_BASE}/pilot/orders/${orderId}/dashboard`);

  if (!response.ok) {
    throw new Error(`Dashboard HTTP ${response.status}`);
  }

  return await response.json();
}

function renderDashboardFromApi(response, orderId) {
  headerEl.style.display = "none";
  pedidoSummaryEl.innerHTML = "";
  const dashboard =
  response?.dashboard_v2 || response?.dash_v1 || {};

  const header = dashboard.header || {};
  const referral = dashboard.referral || {};
  
  // v2
  const summary = dashboard.summary || {};
  const level = dashboard.level || {};
  const rainbow = dashboard.nutrition_rainbow || {};
  const share = dashboard.share || {};

  const progressPercent =
    Math.max(
      0,
      Math.min(level.weekly_adherence_percent || 0, 100)
    );
  
  const actions = response?.actions || {};

  const historicalReportUrl = actions?.historical_report_url || "";
  const whatsappReturnUrl = actions?.whatsapp_return_url || "";

  const categories = Array.isArray(rainbow.groups)
    ? rainbow.groups
    : [];

  const categoriesHtml = categories
    .map((cat) => `
      <div class="post-report-category">
        <span class="post-report-category-emoji">${escapeHtml(cat.emoji || "")}</span>
        <span class="post-report-category-label">${escapeHtml(cat.label || "")}</span>
      </div>
    `)
    .join("");

  const referralShareText = share.message || "";
  
  const referralWhatsappUrl =
    referralShareText
      ? `https://wa.me/?text=${encodeURIComponent(referralShareText)}`
      : "";
  
  orderListEl.innerHTML = `
    <section class="post-report">

      <section class="post-report-heading">
        <div class="post-report-tag">TU REPORTE FRUTI</div>

        <h1 class="post-report-title">
          ${escapeHtml(header.title || "Tu semana saludable 🎉")}
        </h1>

        <p class="post-report-subtitle">
          ${escapeHtml(header.subtitle || "")}
        </p>
      </section>

      <section class="post-report-card">
        <div class="post-report-label">ESTA SEMANA CUBRÍS</div>

       <div class="post-report-main-value">
          ${escapeHtml(summary.main_label || "")}
        </div>

        ${summary.subtitle ? `
          <div class="post-report-muted">
            ${escapeHtml(summary.subtitle)}
            <br><br>
            La OMS recomienda al menos 5 porciones diarias de frutas y verduras.
          </div>
        ` : ""}
      </section>

      <section class="post-report-card">
        <div class="post-report-label">TU NIVEL FRUTI</div>

        <div class="post-report-level-row">
          <div class="post-report-level-icon">
            🌱
          </div>

          <div>
            <div class="post-report-level-name">
              ${escapeHtml(
                (level.status || "")
                  .replace(/[^\p{L}\p{N}\s]/gu, "")
                  .trim()
              )}
            </div>

            <div class="post-report-level-subtitle">
              ${escapeHtml(level.status_label || "")}
            </div>
          </div>
        </div>

        <div class="post-report-progress">
          <div
            class="post-report-progress-fill"
            style="width: ${progressPercent}%">
          </div>
        </div>

        ${(level.weekly_adherence_percent ) ? `
          <div class="post-report-next-level">
            Estado semanal: ${
              escapeHtml(`${level.weekly_adherence_percent}%`)
            }
          </div>
        ` : ""}
      </section>

      <section class="post-report-card">
        <div class="post-report-rainbow-head">
          <!-- temporary placeholder icon -->
          <div class="post-report-rainbow-icon">
            🌈
          </div>

          <div>
            <h2 class="post-report-card-title">
              ${escapeHtml(
                rainbow.title || "Tu arcoíris nutricional"
              )}
            </h2>

            <p class="post-report-card-subtitle">
              ${
                rainbow.groups_covered && rainbow.groups_target
                  ? escapeHtml(
                      `${rainbow.groups_covered} de ${rainbow.groups_target} grupos nutricionales cubiertos`
                    )
                  : "Sumaste variedad en tu pedido de esta semana"
              }
            </p>
          </div>
        </div>

        <div class="post-report-categories">
          ${categoriesHtml}
        </div>

        <p class="post-report-note">
          La OMS recomienda al menos 5 porciones diarias de frutas y verduras.
        </p>
      </section>

      ${(referral.message || referralWhatsappUrl) ? `
        <section class="post-report-invite-card">
          <div class="post-report-invite-label">REGALÁ SALUD</div>

          ${referral.message ? `
            <p class="post-report-invite-text">
              ${escapeHtml(referral.message)}
            </p>
          ` : ""}

          ${referralWhatsappUrl ? `
            <a href="${escapeHtml(referralWhatsappUrl)}" class="post-report-invite-btn">
              Invitar a un amigo
            </a>
          ` : ""}
        </section>
      ` : ""}

      <section class="post-report-actions">
        ${historicalReportUrl ? `
          <a href="${escapeHtml(historicalReportUrl)}" class="post-report-action-primary">
            Ir a mi reporte completo
          </a>
        ` : ""}

        ${whatsappReturnUrl ? `
          <a href="${escapeHtml(whatsappReturnUrl)}" class="post-report-action-secondary">
            Volver a WhatsApp
          </a>
        ` : ""}
      </section>

    </section>
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

  const selectedExtra = extraProducts.find((item) => {
    const product = item.product || item;
    return product.product_id === productId;
  });
  
  if (!selectedExtra) return;
  
  const product = selectedExtra.product || selectedExtra;  
  if (!product) return;

  orderState.push({
    product_id: product.product_id,
  
    name:
      product.ux_display_name ||
      product.name ||
      product.product_name,
  
    qty: 1,
  
    suggested_qty: 1,
  
    unit: product.unit,
  
    unit_label: product.unit_label,
  
    category:
      product.product_category ||
      product.ux_category_label,
  
    image_url: product.image_url,
  
    reason: selectedExtra.reason,
  
    source: selectedExtra.source,
  
    slot: selectedExtra.slot
  });

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

  orderState.push({
    product_id: product.product_id,
    name: product.ux_display_name || product.product_name,
    qty: product.suggested_qty || 1,
    suggested_qty: product.suggested_qty || 1,
    unit: product.unit,
    unit_label: product.unit_label,
    category: product.ux_category_label,
    image_url: product.image_url
  });

  renderOrder();
  renderExtras();
  renderManualSearchResults();
});

function getNextDeliveryMessage() {

  const schedule =
    JSON.parse(
      sessionStorage.getItem("delivery_schedule") || "[]"
    );

  const days =
    schedule.map((s) => s.day);

  if (!days.length) {
    return "Ahora olvidate de las frutas y verduras.";
  }

  if (days.length === 1) {
    return `Hasta el ${days[0]} que viene no pensás más en frutas y verduras.`;
  }

  const orderedDays = [
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes"
  ];

  const today =
    new Date()
      .toLocaleDateString("es-AR", {
        weekday: "long"
      })
      .toLowerCase();

  const currentIndex =
    orderedDays.indexOf(today);

  const future =
    days
      .map((d) => ({
        day: d,
        index: orderedDays.indexOf(d)
      }))
      .filter((d) => d.index > currentIndex)
      .sort((a, b) => a.index - b.index);

  const nextDay =
    future[0]?.day || days[0];

  return `Hasta el ${nextDay} no pensás más en frutas y verduras.`;
}

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
      await loadOrderDashboard(orderId);
    
    renderDashboardFromApi(
      dashboardData,
      orderId
    );
    
    setTimeout(() => {
    
      reportLoadingEl.classList.add("hidden");
    
    }, 400);

    
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
    
    setTimeout(() => {
    
      pedidoLoadingEl?.classList.add("hidden");
    
    }, 300);
    
  } catch (error) {
    console.error("Error resolving session:", error);
    setStatus("No se pudo validar la sesión del pedido.", "error");
  }
}

initApp();
