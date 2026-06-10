const API_BASE = "https://fruti-api-y5uz.onrender.com";

const adminProductsEl =
  document.getElementById("adminProducts");

const adminSearchEl =
  document.getElementById("adminSearch");

let products = [];

// ====================================
// LOAD
// ====================================

async function loadProducts(q = "") {

  try {

    const url = q
      ? `${API_BASE}/admin/products?q=${encodeURIComponent(q)}`
      : `${API_BASE}/admin/products`;

    const res = await fetch(url);
    const data = await res.json();

    products = data.items || [];

    renderProducts();

  } catch (error) {

    console.error(error);

    adminProductsEl.innerHTML = `
      <div>Error cargando productos</div>
    `;
  }
}

// ====================================
// PATCH
// ====================================

async function patchProduct(productId, payload) {

  try {

    const res = await fetch(
      `${API_BASE}/admin/products/${productId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();

    products = products.map((p) =>
      p.product_id === productId
        ? data.product
        : p
    );

    renderProducts();

  } catch (error) {

    console.error(error);

    alert("Error actualizando producto");
  }
}

// ====================================
// RENDER
// ====================================

function renderProducts() {

  adminProductsEl.innerHTML = "";

  products.forEach((product) => {

    const row =
      document.createElement("div");

    row.className = "admin-row";

    row.innerHTML = `
  <img
    class="admin-image"
    src="${product.image_url || ""}"
    alt=""
  />

  <div>
    <div class="admin-product-name">
      ${product.ux_display_name || ""}
    </div>

    <div class="admin-product-variety">
      ${product.name || ""}
      ${product.variety || ""}
    </div>
  </div>

  <div>
    <span class="admin-status ${product.status}">
      ${product.status}
    </span>
  </div>

  <div>
    ${product.foundation_type || "-"}
  </div>

  <div>
    ${product.foundation_slot || "-"}
  </div>

  <div>
    ${product.diversity_eligible ? "Sí" : "No"}
  </div>

  <div>
    ${product.is_initial_candidate ? "Sí" : "No"}
  </div>

  <div class="admin-actions">

    <button
      class="admin-btn admin-btn-edit"
      data-edit="${product.product_id}">
      Editar
    </button>

    ${
      product.status === "active"
        ? `
          <button
            class="admin-btn admin-btn-standby"
            data-standby="${product.product_id}">
            Stand By
          </button>
        `
        : `
          <button
            class="admin-btn admin-btn-active"
            data-active="${product.product_id}">
            Reactivar
          </button>
        `
    }

  </div>
`;
    adminProductsEl.appendChild(row);

  });
}

// ====================================
// EVENTS
// ====================================

adminSearchEl?.addEventListener(
  "input",
  () => {

    loadProducts(
      adminSearchEl.value.trim()
    );

  }
);

adminProductsEl?.addEventListener(
  "click",
  async (event) => {

    const standbyBtn =
      event.target.closest("[data-standby]");

    if (standbyBtn) {

      await patchProduct(
        standbyBtn.dataset.standby,
        {
          status: "standby"
        }
      );

      return;
    }

    const activeBtn =
      event.target.closest("[data-active]");

    if (activeBtn) {

      await patchProduct(
        activeBtn.dataset.active,
        {
          status: "active"
        }
      );

      return;
    }

    const editBtn =
      event.target.closest("[data-edit]");

   if (editBtn) {

    const productId =
      editBtn.dataset.edit;
  
    const product =
      products.find(
        p => p.product_id === productId
      );
  
    if (!product) return;
  
    const payload = {};
  
    const uxDisplayName = prompt(
      "UX Display Name",
      product.ux_display_name || ""
    );
  
    if (
      uxDisplayName !== null &&
      uxDisplayName !== product.ux_display_name
    ) {
      payload.ux_display_name =
        uxDisplayName;
    }
  
    const foundationType = prompt(
      "Foundation Type (mandatory / preferred)",
      product.foundation_type || ""
    );
  
    if (
      foundationType !== null &&
      foundationType !== product.foundation_type
    ) {
      payload.foundation_type =
        foundationType || null;
    }
  
    const foundationSlot = prompt(
      "Foundation Slot (M1-M5 / P1-P4)",
      product.foundation_slot || ""
    );
  
    if (
      foundationSlot !== null &&
      foundationSlot !== product.foundation_slot
    ) {
      payload.foundation_slot =
        foundationSlot || null;
    }
  
    const edibleRatio = prompt(
      "Edible Ratio (0-1)",
      product.edible_ratio ?? ""
    );
  
    if (
      edibleRatio !== null &&
      Number(edibleRatio) !== product.edible_ratio
    ) {
      payload.edible_ratio =
        Number(edibleRatio);
    }
  
    const unitWeight = prompt(
      "Unit Weight Grams",
      product.unit_weight_grams ?? ""
    );
  
    if (
      unitWeight !== null &&
      Number(unitWeight) !== product.unit_weight_grams
    ) {
      payload.unit_weight_grams =
        Number(unitWeight);
    }
  
    if (
      Object.keys(payload).length === 0
    ) {
      return;
    }
  
    await patchProduct(
      productId,
      payload
    );
  
  }
  }
);

// ====================================
// INIT
// ====================================

loadProducts();
