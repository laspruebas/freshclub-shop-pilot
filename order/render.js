import { escapeHtml } from "../utils.js";

const GROUP_TITLES = {
  base_week: "La base de tu semana",
  daily: "Para todos los días",
  variety: "Más variedad para esta semana",
  energy: "Energía natural"
};

const GROUP_TAGS = {
  base_week: "Base semanal",
  variety: "Más variedad",
  energy: "Energía natural"
};

function handleImageError(img) {
  if (!img) return;
  img.onerror = null;
  img.style.visibility = "hidden";
}

function countVarieties(orderState = []) {
  return new Set(
    orderState
      .map((item) => item.product_id || item.name)
      .filter(Boolean)
  ).size;
}

function buildProductTags(item) {
  const tags = [];
  const groupTag = GROUP_TAGS[item.display_group];
  if (groupTag) tags.push(groupTag);

  const category = String(item.category || "").toLowerCase();
  if (category.includes("fruta")) tags.push("Fruta");
  if (category.includes("verdura")) tags.push("Verdura");

  return [...new Set(tags)].slice(0, 2);
}

export function renderPedidoSummary({
  orderState,
  pedidoSummaryEl,
  coverage
}) {
  const totalSelectedProducts = orderState.length;
  const varieties = countVarieties(orderState);
  const daysLabel = coverage?.days_label || "—";

  pedidoSummaryEl.innerHTML = `
    <section class="pedido-summary-card semana-fruti-card">
      <div class="pedido-summary-tag">TU SEMANA FRUTI</div>
      <h2 class="semana-fruti-title">Armamos esta selección para tu familia</h2>
      <p class="semana-fruti-intro">
        Elegimos variedad y cantidades para simplificar las frutas y verduras de tu semana.
      </p>

      <div class="semana-fruti-stats">
        <div class="semana-fruti-stat">
          <strong>${escapeHtml(daysLabel)}</strong>
          <span>de cobertura estimada</span>
        </div>
        <div class="semana-fruti-stat">
          <strong>${varieties}</strong>
          <span>variedades</span>
        </div>
        <div class="semana-fruti-stat">
          <strong>${totalSelectedProducts}</strong>
          <span>productos elegidos</span>
        </div>
      </div>

      <div class="pedido-summary-foot">
        No tuviste que pensar qué comprar. Podés ajustar todo antes de confirmar.
      </div>
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
      groupTitle.textContent = GROUP_TITLES[item.display_group] || item.display_group;
      orderListEl.appendChild(groupTitle);
    }

    const tags = buildProductTags(item);
    const reason = String(item.reason || "").trim();
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="product-row">
        <img
          class="product-img"
          src="${escapeHtml(item.image_url || "")}"
          alt=""
          loading="lazy"
          data-product-id="${escapeHtml(item.product_id)}"
          data-product-name="${escapeHtml(item.name)}"
        />

        <div class="product-content">
          <div class="product-main">
            <p class="card-title">${escapeHtml(item.name)}</p>
            ${tags.length ? `<div class="fruti-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
            ${reason ? `
              <div class="fruti-reason">
                <span class="fruti-reason-label">Por qué está en tu semana</span>
                <p>${escapeHtml(reason)}</p>
              </div>
            ` : ""}
            <a class="item-origin" href="./origen.html">Ver origen</a>
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
    const alreadyInOrder = orderState.some(
      (current) => current.product_id === product.product_id
    );
    if (alreadyInOrder) return;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="product-row extra-row">
        <img
          class="product-img"
          src="${escapeHtml(product.image_url || "")}"
          alt=""
          loading="lazy"
          data-product-id="${escapeHtml(product.product_id)}"
          data-product-name="${escapeHtml(product.ux_display_name || product.name || product.product_name || "")}"
        />
        <div class="product-content">
          <div class="product-main">
            <p class="card-title">${escapeHtml(product.ux_display_name || product.name || product.product_name || "")}</p>
            ${(product.product_category || product.ux_category_label)
              ? `<div class="item-category">${escapeHtml(product.product_category || product.ux_category_label)}</div>`
              : ""}
          </div>
          <button class="add-btn" data-add="${escapeHtml(product.product_id)}">+ Agregar</button>
        </div>
      </div>
    `;

    const img = card.querySelector(".product-img");
    if (img) img.addEventListener("error", () => handleImageError(img));
    extrasEl.appendChild(card);
  });
}

export function renderManualSearchResults({
  manualSearchResults,
  orderState,
  manualSearchInputEl,
  manualSearchStatusEl,
  manualSearchResultsEl
}) {
  if (!manualSearchResultsEl) return;

  const query = String(manualSearchInputEl?.value || "").trim();
  if (query.length < 2) {
    manualSearchResultsEl.innerHTML = "";
    manualSearchStatusEl.textContent = "";
    return;
  }

  const visibleItems = manualSearchResults.filter((item) => {
    return !orderState.some((current) => current.product_id === item.product_id);
  });

  if (!visibleItems.length) {
    manualSearchResultsEl.innerHTML = `
      <div class="manual-search-empty">No encontramos productos para esa búsqueda.</div>
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
          src="${escapeHtml(item.image_url || "")}"
          alt=""
          loading="lazy"
          data-product-id="${escapeHtml(item.product_id)}"
          data-product-name="${escapeHtml(item.ux_display_name || item.product_name || "")}"
        />
        <div class="product-content">
          <div class="product-main">
            <p class="card-title">${escapeHtml(item.ux_display_name || item.product_name || "")}</p>
            ${item.ux_category_label ? `<div class="item-category">${escapeHtml(item.ux_category_label)}</div>` : ""}
          </div>
          <button class="add-btn" data-manual-add="${escapeHtml(item.product_id)}">+ Agregar</button>
        </div>
      </div>
    `;

    const img = card.querySelector(".product-img");
    if (img) img.addEventListener("error", () => handleImageError(img));
    manualSearchResultsEl.appendChild(card);
  });
}
