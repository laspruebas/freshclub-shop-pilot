const API_BASE = "https://fruti-api-y5uz.onrender.com";

let products = [];
let editingProduct = null;

async function loadProducts(q = "") {
  const url = q
    ? `${API_BASE}/admin/products?q=${encodeURIComponent(q)}`
    : `${API_BASE}/admin/products`;

  const res = await fetch(url);
  const data = await res.json();

  products = data.items || [];
  renderProducts();
}

async function patchProduct(productId, payload) {
  const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  products = products.map(p =>
    p.product_id === productId ? data.product : p
  );

  renderProducts();
}

patchProduct(productId, { status: "standby" })
patchProduct(productId, { status: "active" })

adminSearch.addEventListener("input", () => {
  loadProducts(adminSearch.value.trim());
});
