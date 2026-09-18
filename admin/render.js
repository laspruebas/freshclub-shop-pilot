import { escapeHtml } from "../utils.js";

export function renderAdminProducts({
  products,
  adminProductsEl
}) {
  adminProductsEl.innerHTML = "";

  products.forEach((product) => {
    const row =
      document.createElement("div");

    row.className =
      "admin-row";

    row.innerHTML = `
      <img
        class="admin-image"
        src="${escapeHtml(product.image_url || "")}"
        alt=""
      />

      <div>
        <div class="admin-product-name">
          ${escapeHtml(product.ux_display_name || "")}
        </div>

        <div class="admin-product-variety">
          ${escapeHtml(product.name || "")}
          ${escapeHtml(product.variety || "")}
        </div>
      </div>

      <div>
        <span class="admin-status ${escapeHtml(product.status || "")}">
          ${escapeHtml(product.status || "")}
        </span>
      </div>

      <div>
        ${escapeHtml(product.foundation_type || "-")}
      </div>

      <div>
        ${escapeHtml(product.foundation_slot || "-")}
      </div>

      <div>
        ${product.diversity_eligible ? "Sí" : "No"}
      </div>

      <div>
        ${product.is_initial_candidate ? "Sí" : "No"}
      </div>

      <div class="admin-actions">
        <button
          class="admin-btn admin-btn-edit"
          data-edit="${escapeHtml(product.product_id)}">
          Editar
        </button>

        ${
          product.status === "active"
            ? `
              <button
                class="admin-btn admin-btn-standby"
                data-standby="${escapeHtml(product.product_id)}">
                Stand By
              </button>
            `
            : `
              <button
                class="admin-btn admin-btn-active"
                data-active="${escapeHtml(product.product_id)}">
                Reactivar
              </button>
            `
        }
      </div>
    `;

    adminProductsEl.appendChild(row);
  });
}
