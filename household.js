// =====================================================
// CONFIG
// =====================================================

const API_BASE = "https://fruti-api-y5uz.onrender.com";

// Cambiar solo si back te pasa otra ruta
const ONBOARDING_COMPLETE_ENDPOINT = `${API_BASE}/onboarding/complete`;

const WHATSAPP_RETURN_URL = "https://wa.me/14155238886";

// =====================================================
// STATE
// =====================================================

const params = new URLSearchParams(window.location.search);
const token = params.get("t");

let householdId = null;

let waName = "";
let householdName = "";
let deliverySlots = [];
let selectedDeliverySlots = [];
let currentStep = 0;

const statusEl = document.getElementById("status");
const catalogEl = document.getElementById("household");
const submitBtn = document.getElementById("submitBtn");

const onboardingTitleEl = document.getElementById("onboardingTitle");

const householdNameInput =
  document.getElementById("householdNameInput");

const deliverySlotsEl =
  document.getElementById("deliverySlots");

const deliverySummaryEl =
  document.getElementById("deliverySummary");

const onboardingSlider =
  document.getElementById("onboardingSlider");

const stepIndicators =
  document.querySelectorAll("[data-step-indicator]");

const nameNextBtn =
  document.getElementById("nameNextBtn");

const householdNextBtn =
  document.getElementById("householdNextBtn");

const householdBackBtn =
  document.getElementById("householdBackBtn");

const deliveryBackBtn =
  document.getElementById("deliveryBackBtn");

const ageGroups = [
  {
    id: "toddler",
    label: "2 a 5 años",
    value: "toddler"
  },
  {
    id: "child",
    label: "6 a 12 años",
    value: "child"
  },
  {
    id: "teen",
    label: "13 a 18 años",
    value: "teen"
  },
  {
    id: "adult",
    label: "Adulto",
    value: "adult"
  }
];

const household = {};

// =====================================================
// HELPERS
// =====================================================

function setStatus(message, type = "") {
  statusEl.textContent = message || "";
  statusEl.className = "status";
  if (type) statusEl.classList.add(type);
}

function getTotalMembers() {
  return Object.values(household).reduce((acc, qty) => acc + qty, 0);
}

function updateSubmitButton() {
  const total = getTotalMembers();

  if (total > 0) {
    submitBtn.textContent = `Confirmar hogar (${total})`;
    submitBtn.disabled = false;
  } else {
    submitBtn.textContent = "Confirmar hogar";
    submitBtn.disabled = true;
  }
}

function changeQty(ageGroup, delta) {
  const current = household[ageGroup] || 0;
  const next = Math.max(0, current + delta);
  household[ageGroup] = next;

  const controlsEl = document.getElementById(`controls-${ageGroup}`);

  if (controlsEl) {
    if (next === 0) {
      controlsEl.innerHTML = `
        <button
          class="add-btn"
          type="button"
          data-action="add"
          data-id="${ageGroup}"
        >
          + Agregar
        </button>
      `;
    } else {
      controlsEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <button
            class="qty-btn"
            type="button"
            data-action="minus"
            data-id="${ageGroup}"
          >−</button>

          <div id="qty-${ageGroup}" style="min-width:24px;text-align:center;font-size:16px;font-weight:700;">
            ${next}
          </div>

          <button
            class="qty-btn"
            type="button"
            data-action="plus"
            data-id="${ageGroup}"
          >+</button>
        </div>
      `;
    }
  }

  const qtyEl = document.getElementById(`qty-${ageGroup}`);
  if (qtyEl) {
    qtyEl.textContent = `${next}`;
  }

  updateSubmitButton();
}

function buildMembersPayload() {
  const members = [];

  Object.entries(household).forEach(([age_group, qty]) => {
    for (let i = 0; i < qty; i++) {
      members.push(age_group);
    }
  });

  return members;
}

function buildDeliverySlotsPayload() {
  return selectedDeliverySlots.map((slot) => ({
    delivery_day: slot.delivery_day_code,
    delivery_window: slot.delivery_window_code
  }));
}

// =====================================================
// RENDER
// =====================================================

function renderAgeGroups(items) {
  if (!items || items.length === 0) {
    renderEmpty("No hay opciones disponibles por ahora.");
    return;
  }

  catalogEl.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h2 class="card-title">${item.label}</h2>
        </div>
      </div>

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-top:6px;
      ">
        <div></div>

        <div id="controls-${item.id}">
          <button
            class="add-btn"
            type="button"
            data-action="add"
            data-id="${item.id}"
          >
            + Agregar
          </button>
        </div>
      </div>
    `;

    catalogEl.appendChild(card);
  });
}

catalogEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const ageGroup = button.dataset.id;
  const action = button.dataset.action;

  if (!ageGroup || !action) return;

  if (action === "add") {
  changeQty(ageGroup, 1);
  }
  
  if (action === "plus") {
    changeQty(ageGroup, 1);
  }
  
  if (action === "minus") {
    changeQty(ageGroup, -1);
  }
});

deliverySlotsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".delivery-slot-btn");

  if (!button) return;

  const dayCode = button.dataset.day;
  const windowCode = button.dataset.window;

  if (!dayCode || !windowCode) return;

  toggleDeliverySlot(dayCode, windowCode);
});

householdNameInput.addEventListener(
  "input",
  validateWizard
);

nameNextBtn?.addEventListener(
  "click",
  () => goToStep(1)
);

householdNextBtn?.addEventListener(
  "click",
  () => goToStep(2)
);

householdBackBtn?.addEventListener(
  "click",
  () => goToStep(0)
);

deliveryBackBtn?.addEventListener(
  "click",
  () => goToStep(1)
);

function renderDeliverySlots(slots) {
  if (!slots || slots.length === 0) {
    deliverySlotsEl.innerHTML = "";
    return;
  }

  deliverySlots = [...slots];

  const grouped = {};

  slots.forEach((slot) => {
    const key = slot.delivery_day_code;

    if (!grouped[key]) {
      grouped[key] = {
        label: slot.delivery_day_label,
        slots: []
      };
    }

    grouped[key].slots.push(slot);
  });

  deliverySlotsEl.innerHTML = "";

  Object.values(grouped).forEach((day) => {
    const column = document.createElement("div");
    column.className = "delivery-day-column";

    const slotsHtml = day.slots.map((slot) => {
      const selected = selectedDeliverySlots.some(
        (s) =>
          s.delivery_day_code === slot.delivery_day_code &&
          s.delivery_window_code === slot.delivery_window_code
      );

      return `
        <button
          type="button"
          class="delivery-slot-btn ${selected ? "selected" : ""}"
          data-day="${slot.delivery_day_code}"
          data-window="${slot.delivery_window_code}"
        >
          ${slot.delivery_window_label}
        </button>
      `;
    }).join("");

    column.innerHTML = `
      <div class="delivery-day-title">
        ${day.label}
      </div>

      <div class="delivery-day-slots">
        ${slotsHtml}
      </div>
    `;

    deliverySlotsEl.appendChild(column);
  });

  renderDeliverySummary();
}

function renderDeliverySummary() {
  if (selectedDeliverySlots.length === 0) {
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

function toggleDeliverySlot(dayCode, windowCode) {
  const slot = deliverySlots.find(
    (s) =>
      s.delivery_day_code === dayCode &&
      s.delivery_window_code === windowCode
  );

  if (!slot) return;

  const existingIndex = selectedDeliverySlots.findIndex(
    (s) =>
      s.delivery_day_code === dayCode &&
      s.delivery_window_code === windowCode
  );

  if (existingIndex >= 0) {
    selectedDeliverySlots.splice(existingIndex, 1);
  } else {
    if (selectedDeliverySlots.length >= 2) {
      return;
    }

    selectedDeliverySlots.push(slot);
  }

  renderDeliverySlots(deliverySlots);
}

function goToStep(step) {
  currentStep = step;

  onboardingSlider.style.transform =
    `translateX(-${step * 33.3333}%)`;

  stepIndicators.forEach((indicator, index) => {
    indicator.classList.toggle(
      "active",
      index === step
    );
  });

  validateWizard();
}

function validateWizard() {
  const household_name =
    householdNameInput.value.trim();

  const totalMembers =
    getTotalMembers();

  const totalSlots =
    selectedDeliverySlots.length;

  if (nameNextBtn) {
    nameNextBtn.disabled =
      household_name.length < 2;
  }

  if (householdNextBtn) {
    householdNextBtn.disabled =
      totalMembers < 1;
  }

  if (submitBtn) {
    submitBtn.disabled =
      totalSlots < 1 || totalSlots > 2;
  }
}

// =====================================================
// API
// =====================================================

async function resolveSessionFromToken() {
  if (householdId || !token) return;

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

  waName = data.wa_name || "";
  householdName = data.household_name || "";

  if (onboardingTitleEl) {
    onboardingTitleEl.textContent = waName
      ? `Hola ${waName}, contanos quiénes viven en tu hogar`
      : "Contanos quiénes viven en tu hogar";
  }
  
  if (householdNameInput && householdName) {
    householdNameInput.value = householdName;
  } 
}

async function fetchDeliverySlots() {
  const response = await fetch(
    `${API_BASE}/delivery-slots`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Delivery slots HTTP ${response.status}`);
  }

  const data = await response.json();

  renderDeliverySlots(data.slots || []);
}

async function submitHouseholdMembers() {


  const members = buildMembersPayload();

  const household_name =
    householdNameInput.value.trim();
  
  const delivery_slots =
    buildDeliverySlotsPayload();
  
  if (members.length === 0) {
    setStatus("Elegí al menos una persona.", "error");
    return;
  }

  if (!household_name) {
  setStatus("Ingresá un nombre para el hogar.", "error");
  return;
}

if (
  delivery_slots.length < 1 ||
  delivery_slots.length > 2
) {
  setStatus(
    "Elegí entre 1 y 2 horarios de entrega.",
    "error"
  );
  return;
}
  
  const params = new URLSearchParams(window.location.search);
  const phone = params.get("phone");
  
  const referral_code = sessionStorage.getItem("referral_code");
  
  if (!phone) {
    setStatus("Falta teléfono en la URL.", "error");
    return;
  }
  
  const payload = {
    phone,
    household_name,
    members,
    delivery_slots,
    ...(referral_code ? { referral_code } : {})
  };

  console.log("ONBOARDING URL:", window.location.href);
  console.log("PHONE:", phone);
  console.log("MEMBERS:", members);
   
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";
    setStatus("");

    const response = await fetch(`${API_BASE}/onboarding/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Household members HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log("PEDIDO_URL:", data.pedido_url);
    
    window.location.href = data.pedido_url;
    
    return;

  } catch (error) {
    console.error("Error saving household members:", error);
    setStatus("No se pudieron guardar los datos del hogar.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmar hogar";
    updateSubmitButton();
  }
}

// =====================================================
// INIT
// =====================================================

submitBtn.addEventListener("click", submitHouseholdMembers);

async function initHouseholdPage() {
  try {
      //householdId = "test";                // 👈 agregar

    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone");
    
    if (!phone) {
      setStatus("Abrí este link desde WhatsApp con un teléfono válido.", "error");
      return;
    }

    await resolveSessionFromToken();
    
    renderAgeGroups(ageGroups);

    await fetchDeliverySlots();
    
    updateSubmitButton();
    setStatus("");
  } catch (error) {
    console.error("Error resolving session:", error);
    setStatus("No se pudo validar la sesión.", "error");
  }
}
initHouseholdPage();
