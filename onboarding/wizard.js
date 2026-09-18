import { getTotalMembers } from "./model.js";

export function selectDeliverySlot({
  deliverySlots,
  selectedDeliverySlots,
  dayCode,
  windowCode,
  maxSlots = 2
}) {
  const slot =
    deliverySlots.find(
      (item) =>
        item.delivery_day_code === dayCode &&
        item.delivery_window_code === windowCode
    );

  if (!slot) {
    return selectedDeliverySlots;
  }

  const existingIndex =
    selectedDeliverySlots.findIndex(
      (item) =>
        item.delivery_day_code === dayCode &&
        item.delivery_window_code === windowCode
    );

  if (existingIndex >= 0) {
    return selectedDeliverySlots.filter(
      (_, index) => index !== existingIndex
    );
  }

  if (selectedDeliverySlots.length >= maxSlots) {
    return selectedDeliverySlots;
  }

  return [
    ...selectedDeliverySlots,
    slot
  ];
}

export function showWizardStep({
  step,
  onboardingSlider,
  stepIndicators
}) {
  onboardingSlider.style.transform =
    `translateX(-${step * 100}%)`;

  stepIndicators.forEach(
    (indicator, index) => {
      indicator.classList.toggle(
        "active",
        index <= step
      );
    }
  );
}

export function updateWizardControls({
  household,
  selectedDeliverySlots,
  householdNextBtn,
  submitBtn
}) {
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
      totalSlots < 1 ||
      totalSlots > 2;

    submitBtn.textContent =
      "Confirmar";
  }
}
