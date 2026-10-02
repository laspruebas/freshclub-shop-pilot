import { escapeHtml } from "../utils.js";
import { formatOrderQuantity } from "./model.js";

function handleImageError(img) {
  if (!img) return;
  img.onerror = null;
  img.style.visibility = "hidden";
}

export function renderPedidoSummary({ orderState, pedidoSummaryEl, reasoningSummary }) {
  const totalSelectedProducts = orderState.length;
  const householdMatch = String(reasoningSummary || "").match(/hogar de\s+(\d+)\s+personas/i);
  const people = householdMatch?.[1];

  pedidoSummaryEl.innerHTML = `
    <section class="pedido-summary-card pedido-summary-compact">
      <div class="pedido-summary-tag">TU SEMANA FRUTI</div>
      <div class="pedido-summary-inline">
        <strong>${totalSelectedProducts} productos</strong>
        ${people ? `<span>·</span><strong>${escapeHtml(people)} personas</strong>` : ""}
        <span>·</span><strong class="summary-covered">✓ Semana cubierta</strong>
      </div>
      <div class="pedido-summary-foot">La pensamos por vos. Podés cambiar lo que quieras.</div>
    </section>
  `;
}

function detailHtml(item) {
  const reason = item.reason
    ? `<div class="detail-block"><div class="detail-label">Por qué la elegimos</div><p>${escapeHtml(item.reason)}</p></div>`
    : "";
  const origin = item.lot_code
    ? `<div class="detail-block"><div class="detail-label">Origen</div><a class="item-origin" href="./origen.html?lot=${encodeURIComponent(item.lot_code)}">Ver trazabilidad ›</a></div>`
    : `<div class="detail-block"><div class="detail-label">Origen</div><p class="detail-muted">La trazabilidad de este producto estará disponible cuando se asigne el lote.</p></div>`;
  return `${reason}${origin}`;
}

export function renderOrder({ orderState, orderListEl }) {
  if (!orderState.length) {
    orderListEl.innerHTML = `<div class="empty">No hay productos</div>`;
    return;
  }

  orderListEl.innerHTML = "";
  const title = document.createElement("div");
  title.className = "pedido-group-title";
  title.textContent = "Tu canasta";
  orderListEl.appendChild(title);

  orderState.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card basket-card";
    const qty = formatOrderQuantity(item.qty ?? item.suggested_qty, item.unit, item.unit_label);

    card.innerHTML = `
      <div class="product-row basket-product-row">
        <img class="product-img" src="${escapeHtml(item.image_url || "")}" alt="" loading="lazy"
          data-product-id="${escapeHtml(item.product_id)}" data-product-name="${escapeHtml(item.name)}" />
        <div class="product-content basket-product-content">
          <p class="card-title basket-title">${escapeHtml(item.name)}</p>
          <div class="qty-row basket-qty-row">
            <button class="qty-btn" data-action="minus" data-index="${index}" aria-label="Restar">−</button>
            <div class="qty-value">${escapeHtml(qty)} ${escapeHtml(item.unit_label || item.unit || "")}</div>
            <button class="qty-btn" data-action="plus" data-index="${index}" aria-label="Sumar">+</button>
          </div>
          <button class="detail-toggle" type="button" data-detail-toggle="${index}" aria-expanded="false">Ver detalle <span>⌄</span></button>
        </div>
      </div>
      <div class="product-detail" data-detail="${index}" hidden>${detailHtml(item)}</div>
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
        <img class="product-img" src="${escapeHtml(item.image_url || "")}" alt="" loading="lazy">
        <div class="product-content">
          <p class="card-title">${escapeHtml(item.ux_display_name || item.product_name || "")}</p>
          <button class="add-btn" data-manual-add="${escapeHtml(item.product_id)}">+ Agregar</button>
        </div>
      </div>`;
    const img = card.querySelector(".product-img");
    if (img) img.addEventListener("error", () => handleImageError(img));
    manualSearchResultsEl.appendChild(card);
  });
}
