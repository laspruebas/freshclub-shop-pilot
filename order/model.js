export function normalizeInitialOrderItems(items = []) {
  return items
    .slice()
    .map((item) => {
      const product = item.product || item;
      const quantity = item.quantity || {};

      return {
        product_id: product.product_id,
        name:
          product.ux_display_name ||
          product.name ||
          product.product_name ||
          "Producto",
        qty:
          quantity.suggested_qty ??
          product.suggested_qty ??
          1,
        suggested_qty:
          quantity.suggested_qty ??
          product.suggested_qty ??
          1,
        unit:
          quantity.unit ||
          product.unit,
        unit_label:
          quantity.unit_label ||
          product.unit_label,
        category:
          product.product_category ||
          product.ux_category_label,
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

  return {
    product_id: product.product_id,
    name:
      product.ux_display_name ||
      product.name ||
      product.product_name,
    qty: 1,
    suggested_qty: 1,
    unit: product.unit,
    unit_label: product.unit_label,
    category:
      product.product_category ||
      product.ux_category_label,
    image_url: product.image_url,
    reason: selectedExtra.reason,
    source: selectedExtra.source,
    slot: selectedExtra.slot
  };
}

export function manualProductToOrderItem(product) {
  if (!product) return null;

  return {
    product_id: product.product_id,
    name:
      product.ux_display_name ||
      product.product_name,
    qty: product.suggested_qty || 1,
    suggested_qty: product.suggested_qty || 1,
    unit: product.unit,
    unit_label: product.unit_label,
    category: product.ux_category_label,
    image_url: product.image_url
  };
}

export function buildOrderItems(orderState = []) {
  return orderState
    .filter((item) => item.qty > 0)
    .map((item) => ({
      product_id: item.product_id,
      qty: item.qty
    }));
}
