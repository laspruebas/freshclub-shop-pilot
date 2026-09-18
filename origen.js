import { API_BASE } from "./config.js";
import { escapeHtml } from "./utils.js";

const params = new URLSearchParams(window.location.search);
const lotCode = params.get("lot");

const statusEl = document.getElementById("origenStatus");
const introEl = document.getElementById("origenIntro");
const productEl = document.getElementById("origenProduct");
const infoEl = document.getElementById("origenLotInfo");
const timelineEl = document.getElementById("origenTimeline");

function formatDate(value) {
  if (!value) return "Sin fecha informada";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("es-AR");
}

function setStatus(message = "", error = false) {
  statusEl.textContent = message;
  statusEl.className = error ? "status error" : "status";
}

async function loadTrace() {
  if (!lotCode) {
    setStatus("No se indicó un lote.", true);
    return;
  }

  setStatus("Cargando trazabilidad...");

  try {
    const response = await fetch(
      `${API_BASE}/traceability/public/lot/${encodeURIComponent(lotCode)}`
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.detail || "No se pudo consultar el lote");
    }

    const lot = data.lot || {};
    const title = [lot.product, lot.variety].filter(Boolean).join(" · ");

    productEl.textContent = title || lot.lot_code || "Producto";
    introEl.textContent = `Lote ${lot.lot_code || lotCode}`;

    infoEl.innerHTML = `
      <p><strong>Lote:</strong> ${escapeHtml(lot.lot_code || lotCode)}</p>
      <p><strong>Origen:</strong> ${escapeHtml(lot.origin_actor_name || "No informado")}</p>
      <p><strong>Cosecha:</strong> ${escapeHtml(formatDate(lot.harvest_date))}</p>
      <p><strong>Producción:</strong> ${escapeHtml(lot.production_method || "No informada")}</p>
      <p><strong>Estado:</strong> ${escapeHtml(lot.status || "")}</p>
    `;

    const timeline = data.timeline || [];

    if (!timeline.length) {
      timelineEl.innerHTML = `
        <div class="empty">Todavía no hay movimientos registrados.</div>
      `;
    } else {
      timelineEl.innerHTML = timeline.map((item) => `
        <div class="origen-info" style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <p><strong>${escapeHtml(item.label || item.event_type)}</strong></p>
          <p>
            ${escapeHtml(item.event_type)}
            · ${Number(item.quantity || 0).toLocaleString("es-AR")} ${escapeHtml(item.unit || "")}
            · ${escapeHtml(formatDate(item.event_time))}
          </p>
        </div>
      `).join("");
    }

    setStatus("");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo cargar la trazabilidad.", true);
  }
}

loadTrace();
