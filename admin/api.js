import { API_BASE } from "../config.js";

async function readJson(response, label) {
  if (response.ok) {
    return await response.json();
  }

  const errorData =
    await response
      .json()
      .catch(() => null);

  const detail =
    errorData?.detail?.message ||
    errorData?.detail ||
    `HTTP ${response.status}`;

  throw new Error(
    `${label}: ${String(detail)}`
  );
}

export async function fetchAdminProducts(query = "") {
  const cleanQuery =
    String(query || "").trim();

  const url =
    cleanQuery
      ? `${API_BASE}/admin/products?q=${encodeURIComponent(cleanQuery)}`
      : `${API_BASE}/admin/products`;

  const response =
    await fetch(url);

  return readJson(
    response,
    "Admin products"
  );
}

export async function updateAdminProduct(
  productId,
  payload
) {
  const response =
    await fetch(
      `${API_BASE}/admin/products/${productId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

  return readJson(
    response,
    "Admin product update"
  );
}
