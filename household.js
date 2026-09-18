// =====================================================
// CONFIG
// =====================================================

import { validateSessionToken } from "./session.js";
import {
  fetchDeliverySlots as fetchDeliverySlotsApi
} from "./onboarding/api.js";
import {
  AGE_GROUPS
} from "./onboarding/model.js";
import {
  renderAgeGroupControls,
  renderAgeGroups as renderAgeGroupsView,
  renderDeliverySlots as renderDeliverySlotsView,
  renderDeliverySummary as renderDeliverySummaryView
} from "./onboarding/render.js";
import { submitOnboardingFlow } from "./onboarding/submit.js";
import {
  selectDeliverySlot,
  showWizardStep,
  updateWizardControls
} from "./onboarding/wizard.js";

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
  selectedDeliverySlots =
    selectDeliverySlot({
      deliverySlots,
      selectedDeliverySlots,
      dayCode,
      windowCode
    });

  renderDeliverySlots(deliverySlots);
  validateWizard();
}
function goToStep(step) {
  showWizardStep({
    step,
    onboardingSlider,
    stepIndicators
  });

  validateWizard();
}
function validateWizard() {
  updateWizardControls({
    household,
    selectedDeliverySlots,
    householdNextBtn,
    submitBtn
  });
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

  validateWizard();
}
async function fetchDeliverySlots() {
  const data = await fetchDeliverySlotsApi();
  renderDeliverySlots(data.slots || []);
}

// =====================================================
// INIT
// =====================================================

submitBtn.addEventListener("click", () => {
  submitOnboardingFlow({
    household,
    householdName,
    waName,
    selectedDeliverySlots,
    setStatus,
    submitBtn,
    onboardingLoadingEl
  });
});

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
