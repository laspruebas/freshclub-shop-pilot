// =====================================================
// CONFIG
// =====================================================

import { validateSessionToken } from "./session.js";
import { fetchHouseholdReport } from "./report/api.js";
import { renderReport } from "./report/render.js";

// =====================================================
// STATE
// =====================================================

const params = new URLSearchParams(window.location.search);
const token = params.get("t");

let householdId = null;

const statusEl = document.getElementById("reportStatus");
const contentEl = document.getElementById("reportContent");

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

// =====================================================
// API
// =====================================================

async function resolveSessionFromToken() {
  const data = await validateSessionToken(token);
  householdId = data.household_id;
}
// =====================================================
// INIT
// =====================================================

async function initReport() {
  try {
    setStatus("Cargando reporte...");

    await resolveSessionFromToken();

    const report =
      await fetchHouseholdReport(householdId);

    renderReport({
      data: report,
      contentEl,
      reportTitleEl:
        document.getElementById("reportTitle"),
      reportHeaderEl:
        document.querySelector(".report-header")
    });

    setStatus("");
  } catch (error) {
    console.error("Error loading report:", error);
    setStatus("No se pudo cargar el reporte.", "error");
  }
}

initReport();
