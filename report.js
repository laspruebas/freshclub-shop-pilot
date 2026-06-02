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
    month: "long",
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

  const reportTitleEl =
    document.getElementById("reportTitle");
  
  const reports = data?.weekly_reports || [];
  const weeksAvailable =
    data?.weeks_available || 0;

  if (reportTitleEl) {

    if (weeksAvailable === 3) {
      reportTitleEl.textContent =
        "Tus primeras 3 semanas";
    } else if (weeksAvailable > 3) {
      reportTitleEl.textContent =
        "Así viene mejorando tu hogar";
    }
  
  }
  
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
      Cuando completes ${missingWeeks} semana${missingWeeks === 1 ? "" : "s"} más, vas a poder ver cómo evoluciona la alimentación de tu hogar.
    </p>

    <div class="report-placeholder-progress">

    <div class="report-placeholder-progress-label">
      Tu historial se está construyendo
    </div>
  
    <div class="report-placeholder-progress-track">
      <div
        class="report-placeholder-progress-fill"
        style="width: ${(weeksAvailable / 3) * 100}%">
      </div>
    </div>
  
    <div class="report-placeholder-progress-caption">
      ${weeksAvailable} de 3 semanas completadas
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
    .map((week, index) => {
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
        <article
          class="report-week-card ${index === 0 ? "expanded" : "collapsed"}">
          <div class="report-week-top report-week-toggle">
            <div>
              <div class="report-week-label">
                Semana del ${escapeHtml(formatWeekLabel(week.week_start))}
              </div>
              <div class="report-week-level">
                ${escapeHtml(week.fruti_level || "")}
              </div>
            </div>

            <div class="report-week-right">

              <div class="report-score">
                ${escapeHtml(week.fruti_score ?? 0)}
              </div>
            
              <div class="report-week-chevron">
                ${index === 0 ? "▲" : "▼"}
              </div>
            
            </div>
          </div>
          
        <div class="report-week-content">
          <div class="report-metrics-grid">
            <div class="report-metric">
              <span>Días equivalentes</span>
              <strong>${escapeHtml(formatNumber(week.total_days_equivalent))}</strong>
            </div>

            <div class="report-metric">
              <span>FRUTI Score</span>
              <strong>${escapeHtml(Math.round(week.fruti_score ?? 0))}</strong>
            </div>
          </div>

          <div class="report-section-mini">
            <div class="report-section-title">Categorías cubiertas</div>
            <div class="report-chips">
              ${categoriesHtml || `<span class="report-muted">Sin categorías registradas</span>`}
            </div>
          </div>

          <div class="report-section-mini">
            <div class="report-section-title">Podés sumar</div>
            <div class="report-chips">
              ${missingHtml || `<span class="report-muted">No hubo categorías faltantes</span>`}
            </div>
          </div>
        </div>
        </article>
      `;
    })
    .join("");



  const chartData = reports
    .slice()
    .reverse();
  
  const firstScore =
    Number(chartData[0]?.fruti_score || 0);
  
  const lastScore =
    Number(chartData[chartData.length - 1]?.fruti_score || 0);
  
  const improvement =
    lastScore - firstScore;
  
  const chartHtml = chartData
    .map((week, index) => {
  
      const score =
        Math.max(0, Math.min(100, Number(week.fruti_score || 0)));
  
      let barColor = "#c8ddc4";
  
      if (index === chartData.length - 2) {
        barColor = "#7AB86A";
      }
  
      if (index === chartData.length - 1) {
        barColor = "#4a7c3f";
      }
  
      return `
        <div class="report-chart-column">
  
          <div class="report-chart-score
            ${index === chartData.length - 1 ? "latest" : ""}">
            ${Math.round(score)}
          </div>
  
          <div class="report-chart-bar-wrap">
            <div
              class="report-chart-bar"
              style="
                height:${score * 0.7}px;
                background:${barColor};
              ">
            </div>
          </div>
  
          <div class="report-chart-week">
            S${index + 1}
          </div>
  
        </div>
      `;
    })
    .join("");
  
  contentEl.innerHTML = `
  
    <section class="report-section">
      <div class="report-chart">
        ${chartHtml}
      </div>
    
      <div class="report-chart-message">
    
        ${
          improvement >= 10
            ? `↑ Mejoraste ${Math.round(improvement)} puntos en ${chartData.length} semanas`
            : improvement > 0
            ? `↑ Tu familia viene mejorando semana a semana.`
            : `Tu hábito se mantiene. Seguí así.`
        }
    
      </div>
    
    </section>

    <section class="report-section">
      <h2>Tus semanas</h2>
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
        href="https://wa.me/5491154886995"
      >
        Volver a WhatsApp
      </a>
    </section>
    `;

document
  .querySelectorAll(".report-week-toggle")
  .forEach((el) => {

    el.addEventListener("click", () => {

      const card =
        el.closest(".report-week-card");

      if (!card) return;

      const isExpanded =
        card.classList.contains("expanded");

      card.classList.remove(
        "expanded",
        "collapsed"
      );

      card.classList.add(
        isExpanded
          ? "collapsed"
          : "expanded"
      );

      const arrow =
        card.querySelector(".report-week-chevron");

      if (arrow) {
        arrow.textContent =
          isExpanded
            ? "▼"
            : "▲";
      }

    });

  });
  
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
