import {
  fetchAdminProducts,
  updateAdminProduct
} from "./admin/api.js";
import { buildProductEditPayload } from "./admin/editor.js";
import { renderAdminProducts } from "./admin/render.js";

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
    const data =
      await fetchAdminProducts(q);

    products =
      data.items || [];

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
    const data =
      await updateAdminProduct(
        productId,
        payload
      );

    products =
      products.map((product) =>
        product.product_id === productId
          ? data.product
          : product
      );

    renderProducts();
  } catch (error) {
    console.error(error);

    alert(
      `Error actualizando producto: ${error.message || error}`
    );
  }
}

// ====================================
// RENDER
// ====================================

function renderProducts() {
  renderAdminProducts({
    products,
    adminProductsEl
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
        (item) =>
          item.product_id === productId
      );

    if (!product) return;

    const payload =
      buildProductEditPayload(product);

    if (!payload) return;

    if (
      Object.keys(payload).length === 0
    ) {
      return;
    }

    await patchProduct(
      productId,
      payload
    );
  }  }
);

// ====================================
// INIT
// ====================================

loadProducts();
