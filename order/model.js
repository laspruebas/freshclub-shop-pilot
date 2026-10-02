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

function displayPriority(item = {}) {
  const text = `${item.name || ""} ${item.category || ""}`.toLowerCase();
  const priorities = [
    [/tomate/, 10],
    [/banana|manzana|naranja|mandarina|pera|frutilla|durazno|uva/, 20],
    [/zanahoria|zapallo|calabaza|papa|batata|cebolla/, 30],
    [/br[oó]coli|coliflor|berenjena|zucchini|zapallito/, 40],
    [/espinaca|lechuga|acelga|r[uú]cula/, 50]
  ];
  for (const [pattern, score] of priorities) {
    if (pattern.test(text)) return score;
  }
  return 35;
}

export function sortOrderForDisplay(items = []) {
  return items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => displayPriority(a.item) - displayPriority(b.item) || a.originalIndex - b.originalIndex)
    .map(({ item }) => item);
}

export function normalizeInitialOrderItems(items = []) {
  const normalized = items.slice().map((item) => {
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
      display_group: item.display_group,
      lot_code: item.lot_code || product.lot_code || null
    };
  });
  return sortOrderForDisplay(normalized);
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
    display_group: selectedExtra.display_group || "variety",
    lot_code: selectedExtra.lot_code || product.lot_code || null
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
    display_group: "variety",
    lot_code: product.lot_code || null
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
