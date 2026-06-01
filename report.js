// =====================================================
// CONFIG
// =====================================================

const API_BASE = "https://fruti-api-y5uz.onrender.com";

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

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatWeekLabel(dateString) {
  if (!dateString) return "Semana";

  const date = new Date(dateString);

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatNumber(value, digits = 1) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(digits);
}

function renderBar(percent) {
  const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));

  return `
    <div class="report-progress-bar">
      <div class="report-progress-fill" style="width:${safePercent}%"></div>
    </div>
  `;
}

// =====================================================
// API
// =====================================================

async function resolveSessionFromToken() {
  if (!token) {
    throw new Error("Missing token");
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

async function loadHouseholdReport() {
  const response = await fetch(
    `${API_BASE}/pilot/households/${householdId}/report`
  );

  if (!response.ok) {
    throw new Error(`Household report HTTP ${response.status}`);
  }

  return await response.json();
}

// =====================================================
// RENDER
// =====================================================

function renderReport(data) {
  const reports = data?.weekly_reports || [];
  const weeksAvailable =
  data?.weeks_available || 0;

  if (weeksAvailable < 3) {
    const reportHeader =
      document.querySelector(".report-header");
    
    if (reportHeader) {
      reportHeader.style.display = "none";
    }
    const missingWeeks =
      Math.max(0, 3 - weeksAvailable);

  contentEl.innerHTML = `
  <section class="report-placeholder">

    <div class="report-tag">
      FRUTI
    </div>

    <h1 class="report-placeholder-title">
      Tu evolución semanal ya está en marcha.
    </h1>

    <p class="report-placeholder-subtitle">
      Ya tenés ${weeksAvailable} semana${weeksAvailable === 1 ? "" : "s"} registradas.
      Cuando completes ${missingWeeks}
      semana${missingWeeks === 1 ? "" : "s"} más,
      vas a desbloquear tu reporte histórico completo.
    </p>

    <div class="report-placeholder-progress">
      <div class="report-placeholder-progress-label">
        ${weeksAvailable} de 3 semanas completadas
      </div>

      <div class="report-placeholder-progress-track">
        <div
          class="report-placeholder-progress-fill"
          style="width: ${(weeksAvailable / 3) * 100}%">
        </div>
      </div>
    </div>

    <a
      class="report-link"
      href="https://wa.me/5491154886995"
    >
      Volver a mi resumen
    </a>

  </section>
`;

  return;
}

  if (!reports.length) {
    contentEl.innerHTML = `
      <div class="report-empty">
        Todavía no hay historial suficiente para mostrar tu evolución.
      </div>
    `;
    return;
  }

  const latest = reports[0];

  const timelineHtml = reports
    .map((week) => {
      const categoriesHtml = (week.dashboard_categories_week || [])
        .map((cat) => `
          <span class="report-chip">
            ${escapeHtml(cat.emoji || "")} ${escapeHtml(cat.label || cat.code || "")}
          </span>
        `)
        .join("");

      const missingHtml = (week.missing_categories || [])
        .map((cat) => `
          <span class="report-chip report-chip-missing">
            ${escapeHtml(cat)}
          </span>
        `)
        .join("");

      return `
        <article class="report-week-card">
          <div class="report-week-top">
            <div>
              <div class="report-week-label">
                Semana del ${escapeHtml(formatWeekLabel(week.week_start))}
              </div>
              <div class="report-week-level">
                ${escapeHtml(week.fruti_level || "")}
              </div>
            </div>

            <div class="report-score">
              ${escapeHtml(week.fruti_score ?? 0)}
            </div>
          </div>

          <div class="report-metrics-grid">
            <div class="report-metric">
              <span>Días equivalentes</span>
              <strong>${escapeHtml(formatNumber(week.total_days_equivalent))}</strong>
            </div>

            <div class="report-metric">
              <span>Porciones</span>
              <strong>${escapeHtml(formatNumber(week.total_portions))}</strong>
            </div>

            <div class="report-metric">
              <span>Diversidad</span>
              <strong>${escapeHtml(week.diversity_score ?? 0)}</strong>
            </div>

            <div class="report-metric">
              <span>Categorías</span>
              <strong>${escapeHtml(week.total_categories_count ?? 0)}</strong>
            </div>
          </div>

          <div class="report-progress">
            <div class="report-progress-head">
              <span>Progreso semanal</span>
              <strong>${escapeHtml(week.weekly_progress_percent ?? 0)}%</strong>
            </div>
            ${renderBar(week.weekly_progress_percent)}
          </div>

          <div class="report-section-mini">
            <div class="report-section-title">Categorías cubiertas</div>
            <div class="report-chips">
              ${categoriesHtml || `<span class="report-muted">Sin categorías registradas</span>`}
            </div>
          </div>

          <div class="report-section-mini">
            <div class="report-section-title">Te faltó consumir</div>
            <div class="report-chips">
              ${missingHtml || `<span class="report-muted">No hubo categorías faltantes</span>`}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  const chartHtml = reports
    .slice()
    .reverse()
    .map((week) => {
      const score = Math.max(0, Math.min(100, Number(week.fruti_score || 0)));

      return `
        <div class="report-chart-row">
          <div class="report-chart-label">
            ${escapeHtml(formatWeekLabel(week.week_start))}
          </div>
          <div class="report-chart-track">
            <div class="report-chart-fill" style="width:${score}%"></div>
          </div>
          <div class="report-chart-value">${escapeHtml(score)}</div>
        </div>
      `;
    })
    .join("");

  contentEl.innerHTML = `
    <section class="report-summary-card">
      <div class="report-summary-eyebrow">Última semana</div>

      <div class="report-summary-main">
        <div>
          <h2>${escapeHtml(latest.fruti_level || "Reporte FRUTI")}</h2>
          <p>
            Alcanzaste un score FRUTI de 
            <strong>${escapeHtml(latest.fruti_score ?? 0)}</strong>.
          </p>
        </div>

        <div class="report-summary-score">
          ${escapeHtml(latest.fruti_score ?? 0)}
        </div>
      </div>

      ${renderBar(latest.weekly_progress_percent)}

      <div class="report-summary-foot">
        ${escapeHtml(formatNumber(latest.total_days_equivalent))} días equivalentes ·
        ${escapeHtml(latest.total_categories_count ?? 0)} categorías cubiertas
      </div>
    </section>

    <section class="report-section">
      <h2>Evolución semanal</h2>
      <div class="report-chart">
        ${chartHtml}
      </div>
    </section>

    <section class="report-section">
      <h2>Timeline nutricional</h2>
      <div class="report-timeline">
        ${timelineHtml}
      </div>
    </section>
    
    <section class="report-actions">
      <a
        class="report-btn report-btn-primary"
        href="https://wa.me/?text=${encodeURIComponent(`Mirá mi reporte FRUTI 🍎🥦\n\nAsí viene mejorando mi hogar con frutas y verduras:\n\n${window.location.href}`)}"
      >
        Compartir reporte
      </a>
    
      <a
        class="report-link"
        href="https://wa.me/14155238886"
      >
        Volver a WhatsApp
      </a>
    </section>
    `;
}

// =====================================================
// INIT
// =====================================================

async function initReport() {
  try {
    setStatus("Cargando reporte...");

    await resolveSessionFromToken();

    const report = await loadHouseholdReport();

    console.log("HOUSEHOLD REPORT", report);

    renderReport(report);

    setStatus("");
  } catch (error) {
    console.error("Error loading report:", error);
    setStatus("No se pudo cargar el reporte.", "error");
  }
}

initReport();
