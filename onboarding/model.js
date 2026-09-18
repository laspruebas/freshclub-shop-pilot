export const AGE_GROUPS = [
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

export function getTotalMembers(household = {}) {
  return Object.values(household)
    .reduce((total, qty) => total + qty, 0);
}

export function buildMembersPayload(household = {}) {
  const members = [];

  Object.entries(household)
    .forEach(([ageGroup, qty]) => {
      for (let index = 0; index < qty; index += 1) {
        members.push(ageGroup);
      }
    });

  return members;
}

export function buildDeliverySlotsPayload(selectedSlots = []) {
  return selectedSlots.map((slot) => ({
    delivery_day: slot.delivery_day_code,
    delivery_window: slot.delivery_window_code
  }));
}

export function buildDeliverySchedule(selectedSlots = []) {
  return selectedSlots.map((slot) => ({
    day: String(slot.delivery_day_label || "").toLowerCase(),
    window: String(slot.delivery_window_label || "").toLowerCase()
  }));
}
