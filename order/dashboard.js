import { escapeHtml } from "../utils.js";

export function renderOrderDashboard(response, {
  headerEl,
  pedidoSummaryEl,
  orderListEl
}) {
  headerEl.style.display = "none";
  pedidoSummaryEl.innerHTML = "";

  const dashboard =
    response?.dashboard_v2 || response?.dash_v1 || {};

  const header = dashboard.header || {};
  const referral = dashboard.referral || {};
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

        ${level.weekly_adherence_percent ? `
          <div class="post-report-next-level">
            Estado semanal: ${escapeHtml(`${level.weekly_adherence_percent}%`)}
          </div>
        ` : ""}
      </section>

      <section class="post-report-card">
        <div class="post-report-rainbow-head">
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
