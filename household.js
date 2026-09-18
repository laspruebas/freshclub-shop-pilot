// =====================================================
// CONFIG
// =====================================================

import { validateSessionToken } from "./session.js";
import {
  completeOnboarding,
  fetchDeliverySlots as fetchDeliverySlotsApi
} from "./onboarding/api.js";
import {
  AGE_GROUPS,
  buildDeliverySchedule,
  buildDeliverySlotsPayload,
  buildMembersPayload,
  getTotalMembers
} from "./onboarding/model.js";
import {
  renderAgeGroupControls,
  renderAgeGroups as renderAgeGroupsView,
  renderDeliverySlots as renderDeliverySlotsView,
  renderDeliverySummary as renderDeliverySummaryView
} from "./onboarding/render.js";

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

const onboardingLoadingEl =
  document.getElementById("onboardingLoading");

const onboardingSlider =
  document.getElementById("onboardingSlider");

const stepIndicators =
  document.querySelectorAll("[data-step-indicator]");

const householdNextBtn =
  document.getElementById("householdNextBtn");

const deliveryBackBtn =
  document.getElementById("deliveryBackBtn");

const household = {};

// =====================================================
// HELPERS
// =====================================================

function setStatus(message, type = "") {
  statusEl.textContent = message || "";
  statusEl.className = "status";
  if (type) statusEl.classList.add(type);
}

function changeQty(ageGroup, delta) {
  const current = household[ageGroup] || 0;
  const next = Math.max(0, current + delta);

  household[ageGroup] = next;

  renderAgeGroupControls({
    ageGroup,
    quantity: next
  });

  validateWizard();
}
// =====================================================
// RENDER
// =====================================================

function renderAgeGroups(items) {
  renderAgeGroupsView({
    items,
    catalogEl
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

  const button =
    event.target.closest(".delivery-slot-btn");

  if (!button) return;

  const dayCode = button.dataset.day;
  const windowCode = button.dataset.window;

  if (!dayCode || !windowCode) return;

  toggleDeliverySlot(dayCode, windowCode);
});

householdNextBtn?.addEventListener(
  "click",
  async () => {

    if (deliverySlots.length === 0) {
      await fetchDeliverySlots();
    }

    goToStep(1);
  }
);

deliveryBackBtn?.addEventListener(
  "click",
  () => goToStep(0)
);

function renderDeliverySlots(slots) {
  deliverySlots = [...(slots || [])];

  renderDeliverySlotsView({
    slots: deliverySlots,
    selectedDeliverySlots,
    deliverySlotsEl
  });

  renderDeliverySummary();
}

function renderDeliverySummary() {
  renderDeliverySummaryView({
    selectedDeliverySlots,
    deliverySummaryEl
  });
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
  validateWizard();
}

function goToStep(step) {
  onboardingSlider.style.transform =
    `translateX(-${step * 100}%)`;

  stepIndicators.forEach((indicator, index) => {
    indicator.classList.toggle(
      "active",
      index <= step
    );
  });

  validateWizard();
}

function validateWizard() {

  const totalMembers =
    getTotalMembers(household);

  const totalSlots =
    selectedDeliverySlots.length;

  if (householdNextBtn) {
    householdNextBtn.disabled =
      totalMembers < 1;

    householdNextBtn.textContent =
      totalMembers > 0
        ? `Siguiente (${totalMembers})`
        : "Siguiente";
  }

  if (submitBtn) {
    submitBtn.disabled =
      totalSlots < 1 || totalSlots > 2;

    submitBtn.textContent = "Confirmar"

  }
}

// =====================================================
// API
// =====================================================

async function resolveSessionFromToken() {
  if (householdId || !token) return;

  const data = await validateSessionToken(token);

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

  validateWizard();
}
async function fetchDeliverySlots() {
  const data = await fetchDeliverySlotsApi();
  renderDeliverySlots(data.slots || []);
}
async function submitHouseholdMembers() {


  const members = buildMembersPayload(household);

  const household_name =
    householdName ||
    `${waName || "Mi"} hogar`;
    
  const delivery_slots =
    buildDeliverySlotsPayload(selectedDeliverySlots);
  
  if (members.length === 0) {
    setStatus("Elegí al menos una persona.", "error");
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
  const referral_code =
    params.get("ref") ||
    sessionStorage.getItem("referral_code");
  
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

  try {

    submitBtn.disabled = true;
    setStatus("");
    onboardingLoadingEl?.classList.remove("hidden");

    sessionStorage.setItem(
      "delivery_schedule",
      JSON.stringify(
        buildDeliverySchedule(selectedDeliverySlots)
      )
    );
    
    const data = await completeOnboarding(payload);

    window.location.href = data.pedido_url;
    
    return;

  } catch (error) {
    console.error("Error saving household members:", error);
    onboardingLoadingEl?.classList.add("hidden");
    setStatus("No se pudieron guardar los datos del hogar.", "error");
    submitBtn.disabled = false;
  }
}

// =====================================================
// INIT
// =====================================================

submitBtn.addEventListener("click", submitHouseholdMembers);

async function initHouseholdPage() {
  try {

    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone");
    
    if (!phone) {
      setStatus("Abrí este link desde WhatsApp con un teléfono válido.", "error");
      return;
    }

    await resolveSessionFromToken();
    
    renderAgeGroups(AGE_GROUPS);
    
    goToStep(0);

    validateWizard();
    
    setStatus("");
  } catch (error) {
    console.error("Error resolving session:", error);
    setStatus("No se pudo validar la sesión.", "error");
  }
}
initHouseholdPage();
