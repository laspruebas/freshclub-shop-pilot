function readNumberPrompt({
  label,
  currentValue,
  invalidMessage
}) {
  const rawValue =
    prompt(
      label,
      currentValue ?? ""
    );

  if (rawValue === null) {
    return {
      cancelled: true,
      changed: false
    };
  }

  const numericValue =
    Number(rawValue);

  if (!Number.isFinite(numericValue)) {
    alert(invalidMessage);

    return {
      cancelled: false,
      changed: false,
      invalid: true
    };
  }

  return {
    cancelled: false,
    changed:
      numericValue !== currentValue,
    value: numericValue
  };
}

export function buildProductEditPayload(product) {
  const payload = {};

  const uxDisplayName =
    prompt(
      "UX Display Name",
      product.ux_display_name || ""
    );

  if (
    uxDisplayName !== null &&
    uxDisplayName !==
      product.ux_display_name
  ) {
    payload.ux_display_name =
      uxDisplayName;
  }

  const foundationType =
    prompt(
      "Foundation Type (mandatory / preferred)",
      product.foundation_type || ""
    );

  if (
    foundationType !== null &&
    foundationType !==
      product.foundation_type
  ) {
    payload.foundation_type =
      foundationType || null;
  }

  const foundationSlot =
    prompt(
      "Foundation Slot (M1-M5 / P1-P4)",
      product.foundation_slot || ""
    );

  if (
    foundationSlot !== null &&
    foundationSlot !==
      product.foundation_slot
  ) {
    payload.foundation_slot =
      foundationSlot || null;
  }

  const edibleRatio =
    readNumberPrompt({
      label: "Edible Ratio (0-1)",
      currentValue:
        product.edible_ratio,
      invalidMessage:
        "Edible Ratio debe ser un número válido."
    });

  if (edibleRatio.invalid) {
    return null;
  }

  if (
    !edibleRatio.cancelled &&
    edibleRatio.changed
  ) {
    payload.edible_ratio =
      edibleRatio.value;
  }

  const unitWeight =
    readNumberPrompt({
      label: "Unit Weight Grams",
      currentValue:
        product.unit_weight_grams,
      invalidMessage:
        "Unit Weight Grams debe ser un número válido."
    });

  if (unitWeight.invalid) {
    return null;
  }

  if (
    !unitWeight.cancelled &&
    unitWeight.changed
  ) {
    payload.unit_weight_grams =
      unitWeight.value;
  }

  return payload;
}
