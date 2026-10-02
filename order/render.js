import { escapeHtml } from "../utils.js";
import { formatOrderQuantity } from "./model.js";

const GROUP_TITLES = {
  base_week: "La base de la semana",
  daily: "Para todos los días",
  variety: "Más variedad para esta semana",
  energy: "Energía natural"
};

function handleImageError(img) {
  if (!img) return;
  img.onerror = null;
  img.style.visibility = "hidden";
}

export function renderPedidoSummary({ orderState, pedidoSummaryEl, reasoningSummary }) {
  const totalSelectedProducts = orderState.length;
  const summary = reasoningSummary || "Armamos tu semana buscando variedad y opciones prácticas para tu hogar.";

  pedidoSummaryEl.innerHTML = `
    <section class="pedido-summary-card">
      <div class="pedido-summary-tag">TU SEMANA FRUTI</div>
      <p class="pedido-summary-intro">${escapeHtml(summary)}</p>
      <div class="pedido-summary-stats">
        <div class="pedido-summary-stat">
          <div class="pedido-summary-value">${totalSelectedProducts}</div>
          <div class="pedido-summary-label">productos elegidos</div>
        </div>
        <div class="pedido-summary-divider"></div>
        <div class="pedido-summary-stat pedido-summary-stat-wide">
          <div class="pedido-summary-check">✓</div>
          <div class="pedido-summary-label">objetivo semanal cubierto</div>
        </div>
      </div>
      <div class="pedido-summary-foot">La pensamos por vos. Podés ajustar lo que quieras.</div>
    </section>
  `;
}

export function renderOrder({ orderState, orderListEl }) {
  if (!orderState.length) {
    orderListEl.innerHTML = `<div class="empty">No hay productos</div>`;
    return;
  }

  orderListEl.innerHTML = "";
  let currentGroup = null;

  orderState.forEach((item, index) => {
    if (item.display_group !== currentGroup) {
      currentGroup = item.display_group;
      const groupTitle = document.createElement("div");
      groupTitle.className = "pedido-group-title";
      groupTitle.textContent = GROUP_TITLES[item.display_group] || item.display_group || "Tu selección";
      orderListEl.appendChild(groupTitle);
    }

    const card = document.createElement("div");
    card.className = "card";
    const qty = formatOrderQuantity(item.qty ?? item.suggested_qty, item.unit, item.unit_label);

    card.innerHTML = `
      <div class="product-row">
        <img class="product-img" src="${escapeHtml(item.image_url || "")}" alt="" loading="lazy"
          data-product-id="${escapeHtml(item.product_id)}" data-product-name="${escapeHtml(item.name)}" />
        <div class="product-content">
          <div class="product-main">
            <p class="card-title">${escapeHtml(item.name)}</p>
            ${item.reason ? `<p class="item-reason">${escapeHtml(item.reason)}</p>` : ""}
            ${item.category ? `<div class="item-category">${escapeHtml(item.category)}</div>` : ""}
            <a class="item-origin" href="./origen.html">Ver origen</a>
          </div>
          <div class="qty-row">
            <button class="qty-btn" data-action="minus" data-index="${index}">−</button>
            <div class="qty-value">${escapeHtml(qty)} ${escapeHtml(item.unit_label || item.unit || "")}</div>
            <button class="qty-btn" data-action="plus" data-index="${index}">+</button>
          </div>
        </div>
      </div>
    `;

    const img = card.querySelector(".product-img");
    if (img) img.addEventListener("error", () => handleImageError(img));
    orderListEl.appendChild(card);
  });
}

export function renderExtras({ extraProducts, orderState, extrasEl }) {
  if (!extraProducts.length) {
    extrasEl.innerHTML = "";
    return;
  }
  extrasEl.innerHTML = "";

  extraProducts.forEach((item) => {
    const product = item.product || item;
    if (orderState.some((current) => current.product_id === product.product_id)) return;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="product-row extra-row">
        <img class="product-img" src="${escapeHtml(product.image_url || "")}" alt="" loading="lazy"
          data-product-id="${escapeHtml(product.product_id)}"
          data-product-name="${escapeHtml(product.ux_display_name || product.name || product.product_name || "")}" />
        <div class="product-content">
          <div class="product-main">
            <p class="card-title">${escapeHtml(product.ux_display_name || product.name || product.product_name || "")}</p>
            ${item.reason ? `<p class="item-reason">${escapeHtml(item.reason)}</p>` : ""}
            ${(product.product_category || product.ux_category_label) ? `<div class="item-category">${escapeHtml(product.product_category || product.ux_category_label)}</div>` : ""}
          </div>
          <button class="add-btn" data-add="${escapeHtml(product.product_id)}">+ Agregar</button>
        </div>
      </div>`;
    const img = card.querySelector(".product-img");
    if (img) img.addEventListener("error", () => handleImageError(img));
    extrasEl.appendChild(card);
  });
}

export function renderManualSearchResults({ manualSearchResults, orderState, manualSearchInputEl, manualSearchStatusEl, manualSearchResultsEl }) {
  if (!manualSearchResultsEl) return;
  const query = String(manualSearchInputEl?.value || "").trim();
  if (query.length < 2) {
    manualSearchResultsEl.innerHTML = "";
    manualSearchStatusEl.textContent = "";
    return;
  }

  const visibleItems = manualSearchResults.filter((item) => !orderState.some((current) => current.product_id === item.product_id));
  if (!visibleItems.length) {
    manualSearchResultsEl.innerHTML = `<div class="manual-search-empty">No encontramos productos para esa búsqueda.</div>`;
    return;
  }

  manualSearchResultsEl.innerHTML = "";
  visibleItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="product-row extra-row">
        <img class="product-img" src="${escapeHtml(item.image_url || "")}" alt="" loading="lazy"
          data-product-id="${escapeHtml(item.product_id)}" data-product-name="${escapeHtml(item.ux_display_name || item.product_name || "")}" />
        <div class="product-content">
          <div class="product-main">
            <p class="card-title">${escapeHtml(item.ux_display_name || item.product_name || "")}</p>
            ${item.ux_category_label ? `<div class="item-category">${escapeHtml(item.ux_category_label)}</div>` : ""}
          </div>
          <button class="add-btn" data-manual-add="${escapeHtml(item.product_id)}">+ Agregar</button>
        </div>
      </div>`;
    const img = card.querySelector(".product-img");
    if (img) img.addEventListener("error", () => handleImageError(img));
    manualSearchResultsEl.appendChild(card);
  });
}
