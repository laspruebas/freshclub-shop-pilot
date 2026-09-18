import { escapeHtml } from "../utils.js";

export function renderAgeGroups({
  items,
  catalogEl
}) {
  catalogEl.innerHTML = "";

  if (!items?.length) {
    catalogEl.innerHTML = `
      <div class="empty">
        No hay opciones disponibles por ahora.
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h2 class="card-title">
            ${escapeHtml(item.label)}
          </h2>
        </div>
      </div>

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-top:6px;
      ">
        <div></div>

        <div id="controls-${escapeHtml(item.id)}">
          <button
            class="add-btn"
            type="button"
            data-action="add"
            data-id="${escapeHtml(item.id)}"
          >
            + Agregar
          </button>
        </div>
      </div>
    `;

    catalogEl.appendChild(card);
  });
}

export function renderAgeGroupControls({
  ageGroup,
  quantity
}) {
  const controlsEl =
    document.getElementById(
      `controls-${ageGroup}`
    );

  if (!controlsEl) return;

  if (quantity === 0) {
    controlsEl.innerHTML = `
      <button
        class="add-btn"
        type="button"
        data-action="add"
        data-id="${escapeHtml(ageGroup)}"
      >
        + Agregar
      </button>
    `;

    return;
  }

  controlsEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <button
        class="qty-btn"
        type="button"
        data-action="minus"
        data-id="${escapeHtml(ageGroup)}"
      >
        −
      </button>

      <div
        id="qty-${escapeHtml(ageGroup)}"
        style="min-width:24px;text-align:center;font-size:16px;font-weight:700;"
      >
        ${quantity}
      </div>

      <button
        class="qty-btn"
        type="button"
        data-action="plus"
        data-id="${escapeHtml(ageGroup)}"
      >
        +
      </button>
    </div>
  `;
}

export function renderDeliverySlots({
  slots,
  selectedDeliverySlots,
  deliverySlotsEl
}) {
  deliverySlotsEl.innerHTML = "";

  if (!slots?.length) return;

  const grouped = {};

  slots.forEach((slot) => {
    const key = slot.delivery_day_code;

    if (!grouped[key]) {
      grouped[key] = {
        code: slot.delivery_day_code,
        label: slot.delivery_day_label,
        slots: []
      };
    }

    grouped[key].slots.push(slot);
  });

  Object.values(grouped)
    .forEach((day) => {
      const selectedSlot =
        selectedDeliverySlots.find(
          (slot) =>
            slot.delivery_day_code === day.code
        );

      const slotsHtml =
        day.slots.map((slot) => {
          const selected =
            selectedSlot &&
            selectedSlot.delivery_window_code ===
              slot.delivery_window_code;

          return `
            <button
              type="button"
              class="delivery-slot-btn ${selected ? "selected" : ""}"
              data-day="${escapeHtml(slot.delivery_day_code)}"
              data-window="${escapeHtml(slot.delivery_window_code)}"
            >
              <div class="delivery-slot-title">
                ${escapeHtml(slot.delivery_window_label)}
              </div>

              <div class="delivery-slot-range">
                ${
                  slot.delivery_window_code === "morning"
                    ? "9 a 13 hs"
                    : "14 a 18 hs"
                }
              </div>
            </button>
          `;
        }).join("");

      const badgeHtml =
        selectedSlot
          ? `
            <div class="delivery-day-badge">
              ${escapeHtml(selectedSlot.delivery_window_label)}
            </div>
          `
          : "";

      const row =
        document.createElement("div");

      row.className =
        `delivery-day-row ${
          selectedSlot ? "selected" : ""
        }`;

      row.innerHTML = `
        <div class="delivery-day-top">
          <div class="delivery-day-label">
            ${escapeHtml(day.label)}
          </div>

          ${badgeHtml}
        </div>

        <div class="delivery-day-slots">
          ${slotsHtml}
        </div>
      `;

      deliverySlotsEl.appendChild(row);
    });
}

export function renderDeliverySummary({
  selectedDeliverySlots,
  deliverySummaryEl
}) {
  if (!selectedDeliverySlots.length) {
    deliverySummaryEl.textContent = "";
    return;
  }

  deliverySummaryEl.textContent =
    selectedDeliverySlots
      .map(
        (slot) =>
          `${slot.delivery_day_label} ${slot.delivery_window_label}`
      )
      .join(" · ");
}
