function isKgUnit(unit, unitLabel) {
  const value = `${unit || ""} ${unitLabel || ""}`.toLowerCase();
  return value.includes("kg") || value.includes("kilo");
}

export function quantityStep(item = {}) {
  return isKgUnit(item.unit, item.unit_label) ? 0.1 : 1;
}

export function roundOrderQuantity(value, unit, unitLabel) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  if (isKgUnit(unit, unitLabel)) return Math.max(0.1, Math.round(number * 10) / 10);
  return Math.max(1, Math.round(number));
}

export function formatOrderQuantity(value, unit, unitLabel) {
  const rounded = roundOrderQuantity(value, unit, unitLabel);
  return isKgUnit(unit, unitLabel)
    ? rounded.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })
    : String(rounded);
}

export function normalizeInitialOrderItems(items = []) {
  return items
    .slice()
    .map((item) => {
      const product = item.product || item;
      const quantity = item.quantity || {};
      const unit = quantity.unit || product.unit;
      const unitLabel = quantity.unit_label || product.unit_label;
      const rawQty = quantity.suggested_qty ?? product.suggested_qty ?? 1;
      const roundedQty = roundOrderQuantity(rawQty, unit, unitLabel);

      return {
        product_id: product.product_id,
        name: product.ux_display_name || product.name || product.product_name || "Producto",
        qty: roundedQty,
        suggested_qty: roundedQty,
        unit,
        unit_label: unitLabel,
        category: product.product_category || product.ux_category_label,
        image_url: product.image_url,
        reason: item.reason,
        source: item.source,
        slot: item.slot,
        display_group: item.display_group
      };
    });
}

export function extraToOrderItem(selectedExtra) {
  const product = selectedExtra?.product || selectedExtra;
  if (!product) return null;

  const qty = roundOrderQuantity(product.suggested_qty ?? 1, product.unit, product.unit_label);
  return {
    product_id: product.product_id,
    name: product.ux_display_name || product.name || product.product_name,
    qty,
    suggested_qty: qty,
    unit: product.unit,
    unit_label: product.unit_label,
    category: product.product_category || product.ux_category_label,
    image_url: product.image_url,
    reason: selectedExtra.reason,
    source: selectedExtra.source,
    slot: selectedExtra.slot,
    display_group: selectedExtra.display_group || "variety"
  };
}

export function manualProductToOrderItem(product) {
  if (!product) return null;
  const qty = roundOrderQuantity(product.suggested_qty ?? 1, product.unit, product.unit_label);
  return {
    product_id: product.product_id,
    name: product.ux_display_name || product.product_name,
    qty,
    suggested_qty: qty,
    unit: product.unit,
    unit_label: product.unit_label,
    category: product.ux_category_label,
    image_url: product.image_url,
    display_group: "variety"
  };
}

export function buildOrderItems(orderState = []) {
  return orderState
    .filter((item) => item.qty > 0)
    .map((item) => ({
      product_id: item.product_id,
      qty: roundOrderQuantity(item.qty, item.unit, item.unit_label)
    }));
}
