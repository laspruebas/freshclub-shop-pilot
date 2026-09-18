import {
  createLot,
  createTransfer,
  fetchActors,
  fetchCatalog,
  fetchDashboard,
  fetchLotDetail,
  fetchLots,
  fetchTraceProducts,
  qrUrl
} from "./api.js";
import { escapeHtml } from "../utils.js";

const actorSelect = document.getElementById("actorSelect");
const activeLotsEl = document.getElementById("activeLots");
const productsWithStockEl = document.getElementById("productsWithStock");
const totalStockEl = document.getElementById("totalStock");
const statusEl = document.getElementById("status");
const lotsListEl = document.getElementById("lotsList");
const movementsListEl = document.getElementById("movementsList");
const catalogListEl = document.getElementById("catalogList");
const lotSearchEl = document.getElementById("lotSearch");

const newLotDialog = document.getElementById("newLotDialog");
const newLotForm = document.getElementById("newLotForm");
const productSelect = document.getElementById("productSelect");

const transferDialog = document.getElementById("transferDialog");
const transferForm = document.getElementById("transferForm");
const transferLotSelect = document.getElementById("transferLotSelect");
const destinationActorSelect = document.getElementById("destinationActorSelect");

const lotDetailDialog = document.getElementById("lotDetailDialog");
const detailTitle = document.getElementById("detailTitle");
const detailSubtitle = document.getElementById("detailSubtitle");
const lotDetailContent = document.getElementById("lotDetailContent");

let actors = [];
let products = [];
let lots = [];
let dashboard = null;
let catalog = [];

function setStatus(message = "", type = "") {
  statusEl.textContent = message;
  statusEl.className = "trace-status";
  if (type) statusEl.classList.add(type);
}

function selectedActorId() {
  return actorSelect.value;
}

function formatKg(value) {
  return `${Number(value || 0).toLocaleString("es-AR", {
    maximumFractionDigits: 3
  })} kg`;
}

function renderActorOptions() {
  actorSelect.innerHTML = actors.map((actor) => `
    <option value="${escapeHtml(actor.id)}">
      ${escapeHtml(actor.name)} · ${escapeHtml(actor.actor_type)}
    </option>
  `).join("");

  const finca = actors.find((actor) => actor.name === "Finca Demo");
  if (finca) actorSelect.value = finca.id;
}

function renderProductOptions() {
  productSelect.innerHTML = `
    <option value="">Seleccionar producto...</option>
    ${products.map((product) => {
      const label = [product.name, product.variety].filter(Boolean).join(" · ");
      return `<option value="${escapeHtml(product.product_id)}">${escapeHtml(label)}</option>`;
    }).join("")}
  `;
}

function renderMetrics() {
  const metrics = dashboard?.metrics || {};
  activeLotsEl.textContent = metrics.active_lots || 0;
  productsWithStockEl.textContent = metrics.products_with_stock || 0;
  totalStockEl.textContent = formatKg(metrics.total_stock_kg || 0);
}

function renderLots() {
  const search = lotSearchEl.value.trim().toLowerCase();

  const visible = lots.filter((lot) => {
    const text = [
      lot.lot_code,
      lot.product,
      lot.variety,
      lot.status
    ].filter(Boolean).join(" ").toLowerCase();

    return !search || text.includes(search);
  });

  if (!visible.length) {
    lotsListEl.innerHTML = `
      <div class="trace-empty">No hay lotes para este actor.</div>
    `;
    return;
  }

  lotsListEl.innerHTML = visible.map((lot) => `
    <article class="trace-card">
      <div class="trace-card-row">
        <div>
          <h3>${escapeHtml(lot.lot_code)}</h3>
          <div class="trace-meta">
            ${escapeHtml(lot.product || "")}
            ${lot.variety ? " · " + escapeHtml(lot.variety) : ""}
            <br />
            <span class="badge">${escapeHtml(lot.status || "")}</span>
          </div>
        </div>
        <div class="trace-stock">${formatKg(lot.actor_stock_kg)}</div>
      </div>

      <div class="trace-card-actions">
        <button data-detail="${escapeHtml(lot.lot_id)}">Ver detalle</button>
        ${Number(lot.actor_stock_kg || 0) > 0
          ? `<button data-transfer-lot="${escapeHtml(lot.lot_id)}">Transferir</button>`
          : ""}
        <a href="${qrUrl(lot.lot_code)}" target="_blank" rel="noopener">QR</a>
      </div>
    </article>
  `).join("");
}

function renderMovements() {
  const items = dashboard?.recent_movements || [];

  if (!items.length) {
    movementsListEl.innerHTML = `
      <div class="trace-empty">Todavía no hay movimientos.</div>
    `;
    return;
  }

  movementsListEl.innerHTML = items.map((item) => {
    let route = "";
    if (item.event_type === "TRANSFER") {
      route = `${item.from_actor_name || "Origen"} → ${item.to_actor_name || "Destino"}`;
    }

    return `
      <article class="trace-card">
        <div class="trace-card-row">
          <div>
            <h3>${escapeHtml(item.event_type)} · ${escapeHtml(item.lot_code)}</h3>
            <div class="trace-meta">
              ${escapeHtml(item.product || "")}
              ${item.variety ? " · " + escapeHtml(item.variety) : ""}
              ${route ? "<br />" + escapeHtml(route) : ""}
            </div>
          </div>
          <div class="trace-stock">${formatKg(item.quantity)}</div>
        </div>
      </article>
    `;
  }).join("");
}

function renderCatalog() {
  if (!catalog.length) {
    catalogListEl.innerHTML = `
      <div class="trace-empty">
        Este actor no tiene productos comerciales con stock trazable.
      </div>
    `;
    return;
  }

  catalogListEl.innerHTML = catalog.map((item) => `
    <article class="trace-card">
      <div class="trace-card-row">
        <div>
          <h3>
            ${escapeHtml(item.name || "")}
            ${item.variety ? " · " + escapeHtml(item.variety) : ""}
          </h3>
          <div class="trace-meta">
            ${item.price != null
              ? `${escapeHtml(item.currency || "")} ${Number(item.price).toLocaleString("es-AR")}`
              : "Sin precio"}
            · ${item.lots?.length || 0} lote(s)
          </div>
        </div>
        <div class="trace-stock">${formatKg(item.stock_kg)}</div>
      </div>
    </article>
  `).join("");
}

function fillTransferSelectors(preselectedLotId = "") {
  const actorId = selectedActorId();

  destinationActorSelect.innerHTML = actors
    .filter((actor) => actor.id !== actorId)
    .map((actor) => `
      <option value="${escapeHtml(actor.id)}">
        ${escapeHtml(actor.name)} · ${escapeHtml(actor.actor_type)}
      </option>
    `).join("");

  const availableLots = lots.filter((lot) => Number(lot.actor_stock_kg || 0) > 0);

  transferLotSelect.innerHTML = availableLots.map((lot) => `
    <option
      value="${escapeHtml(lot.lot_id)}"
      data-stock="${Number(lot.actor_stock_kg || 0)}">
      ${escapeHtml(lot.lot_code)} · ${escapeHtml(lot.product || "")}
      · ${formatKg(lot.actor_stock_kg)}
    </option>
  `).join("");

  if (preselectedLotId) {
    transferLotSelect.value = preselectedLotId;
  }
}

async function loadActorData() {
  const actorId = selectedActorId();
  if (!actorId) return;

  setStatus("Actualizando trazabilidad...");

  try {
    const [dashData, lotsData, catalogData] = await Promise.all([
      fetchDashboard(actorId),
      fetchLots(actorId),
      fetchCatalog(actorId)
    ]);

    dashboard = dashData;
    lots = lotsData.items || [];
    catalog = catalogData.items || [];

    renderMetrics();
    renderLots();
    renderMovements();
    renderCatalog();
    setStatus("");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Error cargando trazabilidad", "error");
  }
}

async function showLotDetail(lotId) {
  try {
    const data = await fetchLotDetail(lotId);
    const lot = data.lot;

    detailTitle.textContent = lot.lot_code;
    detailSubtitle.textContent =
      [lot.product, lot.variety].filter(Boolean).join(" · ");

    const stockHtml = (data.stock_by_actor || []).map((row) => `
      <div class="stock-line">
        <span>${escapeHtml(row.actor_name)}</span>
        <strong>${formatKg(row.stock_kg)}</strong>
      </div>
    `).join("");

    const timelineHtml = (data.timeline || []).map((event) => {
      const route = event.event_type === "TRANSFER"
        ? `${event.from_actor_name || ""} → ${event.to_actor_name || ""}`
        : event.actor_name || "";

      return `
        <div class="timeline-item">
          <strong>${escapeHtml(event.event_type)}</strong>
          · ${formatKg(event.quantity)}
          <div class="trace-meta">
            ${escapeHtml(route)}
          </div>
        </div>
      `;
    }).join("");

    lotDetailContent.innerHTML = `
      <h3>Stock por actor</h3>
      <div class="stock-grid">
        ${stockHtml || '<div class="trace-empty">Sin stock registrado.</div>'}
      </div>

      <h3>Recorrido</h3>
      <div class="timeline">
        ${timelineHtml || '<div class="trace-empty">Sin movimientos.</div>'}
      </div>
    `;

    lotDetailDialog.showModal();
  } catch (error) {
    setStatus(error.message || "No se pudo abrir el lote", "error");
  }
}

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.close)?.close();
  });
});

document.getElementById("newLotBtn").addEventListener("click", () => {
  newLotForm.reset();
  newLotDialog.showModal();
});

document.getElementById("transferBtn").addEventListener("click", () => {
  fillTransferSelectors();
  if (!transferLotSelect.options.length) {
    setStatus("El actor seleccionado no tiene stock para transferir.", "error");
    return;
  }
  transferForm.reset();
  fillTransferSelectors();
  transferDialog.showModal();
});

document.getElementById("refreshBtn").addEventListener("click", loadActorData);

actorSelect.addEventListener("change", loadActorData);
lotSearchEl.addEventListener("input", renderLots);

lotsListEl.addEventListener("click", (event) => {
  const detailBtn = event.target.closest("[data-detail]");
  if (detailBtn) {
    showLotDetail(detailBtn.dataset.detail);
    return;
  }

  const transferLotBtn = event.target.closest("[data-transfer-lot]");
  if (transferLotBtn) {
    transferForm.reset();
    fillTransferSelectors(transferLotBtn.dataset.transferLot);
    transferDialog.showModal();
  }
});

newLotForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await createLot({
      code: document.getElementById("lotCode").value.trim(),
      product_id: productSelect.value,
      actor_id: selectedActorId(),
      harvest_date: document.getElementById("harvestDate").value
        ? new Date(document.getElementById("harvestDate").value + "T12:00:00Z").toISOString()
        : null,
      production_method: document.getElementById("productionMethod").value.trim() || null,
      quantity: Number(document.getElementById("initialQuantity").value),
      unit: "kg"
    });

    newLotDialog.close();
    setStatus("Lote creado correctamente.", "success");
    await loadActorData();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo crear el lote", "error");
  }
});

transferForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await createTransfer({
      lot_id: transferLotSelect.value,
      from_actor_id: selectedActorId(),
      to_actor_id: destinationActorSelect.value,
      quantity: Number(document.getElementById("transferQuantity").value),
      unit: "kg",
      notes: document.getElementById("transferNotes").value.trim() || null
    });

    transferDialog.close();
    setStatus("Transferencia registrada.", "success");
    await loadActorData();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo transferir el lote", "error");
  }
});

async function init() {
  try {
    setStatus("Cargando trazabilidad...");

    const [actorData, productData] = await Promise.all([
      fetchActors(),
      fetchTraceProducts()
    ]);

    actors = actorData || [];
    products = productData.items || [];

    renderActorOptions();
    renderProductOptions();

    await loadActorData();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo iniciar trazabilidad", "error");
  }
}

init();
