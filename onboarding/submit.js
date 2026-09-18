import { completeOnboarding } from "./api.js";
import {
  buildDeliverySchedule,
  buildDeliverySlotsPayload,
  buildMembersPayload
} from "./model.js";

export async function submitOnboardingFlow({
  household,
  householdName,
  waName,
  selectedDeliverySlots,
  setStatus,
  submitBtn,
  onboardingLoadingEl,
  storage = sessionStorage,
  location = window.location
}) {
  const members =
    buildMembersPayload(household);

  const household_name =
    householdName ||
    `${waName || "Mi"} hogar`;

  const delivery_slots =
    buildDeliverySlotsPayload(
      selectedDeliverySlots
    );

  if (members.length === 0) {
    setStatus(
      "Elegí al menos una persona.",
      "error"
    );
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

  const params =
    new URLSearchParams(location.search);

  const phone =
    params.get("phone");

  const referral_code =
    params.get("ref") ||
    storage.getItem("referral_code");

  if (!phone) {
    setStatus(
      "Falta teléfono en la URL.",
      "error"
    );
    return;
  }

  const payload = {
    phone,
    household_name,
    members,
    delivery_slots,
    ...(referral_code
      ? { referral_code }
      : {})
  };

  try {
    submitBtn.disabled = true;
    setStatus("");
    onboardingLoadingEl
      ?.classList.remove("hidden");

    storage.setItem(
      "delivery_schedule",
      JSON.stringify(
        buildDeliverySchedule(
          selectedDeliverySlots
        )
      )
    );

    const data =
      await completeOnboarding(payload);

    location.href = data.pedido_url;
  } catch (error) {
    console.error(
      "Error saving household members:",
      error
    );

    onboardingLoadingEl
      ?.classList.add("hidden");

    setStatus(
      "No se pudieron guardar los datos del hogar.",
      "error"
    );

    submitBtn.disabled = false;
  }
}
