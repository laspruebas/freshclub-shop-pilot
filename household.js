// =====================================================
// CONFIG
// =====================================================

const API_BASE = "https://fruti-api-y5uz.onrender.com";

// Cambiar solo si back te pasa otra ruta
const ONBOARDING_COMPLETE_ENDPOINT = `${API_BASE}/onboarding/complete`;

const WHATSAPP_RETURN_URL = "https://wa.me/14155238886";

// =====================================================
// STATE
// =====================================================

const params = new URLSearchParams(window.location.search);
const token = params.get("t");

let householdId = null;

const statusEl = document.getElementById("status");
const catalogEl = document.getElementById("household");
const submitBtn = document.getElementById("submitBtn");

const ageGroups = [
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

const household = {};

// =====================================================
// HELPERS
// =====================================================

function setStatus(message, type = "") {
  statusEl.textContent = message || "";
  statusEl.className = "status";
  if (type) statusEl.classList.add(type);
}

function getTotalMembers() {
  return Object.values(household).reduce((acc, qty) => acc + qty, 0);
}

function updateSubmitButton() {
  const total = getTotalMembers();

  if (total > 0) {
    submitBtn.textContent = `Confirmar hogar (${total})`;
    submitBtn.disabled = false;
  } else {
    submitBtn.textContent = "Confirmar hogar";
    submitBtn.disabled = true;
  }
}

function changeQty(ageGroup, delta) {
  const current = household[ageGroup] || 0;
  const next = Math.max(0, current + delta);
  household[ageGroup] = next;

  const controlsEl = document.getElementById(`controls-${ageGroup}`);

  if (controlsEl) {
    if (next === 0) {
      controlsEl.innerHTML = `
        <button
          class="add-btn"
          type="button"
          data-action="add"
          data-id="${ageGroup}"
        >
          + Agregar
        </button>
      `;
    } else {
      controlsEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <button
            class="qty-btn"
            type="button"
            data-action="minus"
            data-id="${ageGroup}"
          >−</button>

          <div id="qty-${ageGroup}" style="min-width:24px;text-align:center;font-size:16px;font-weight:700;">
            ${next}
          </div>

          <button
            class="qty-btn"
            type="button"
            data-action="plus"
            data-id="${ageGroup}"
          >+</button>
        </div>
      `;
    }
  }

  const qtyEl = document.getElementById(`qty-${ageGroup}`);
  if (qtyEl) {
    qtyEl.textContent = `${next}`;
  }

  updateSubmitButton();
}

function buildMembersPayload() {
  const members = [];

  Object.entries(household).forEach(([age_group, qty]) => {
    for (let i = 0; i < qty; i++) {
      members.push(age_group);
    }
  });

  return members;
}

// =====================================================
// RENDER
// =====================================================

function renderAgeGroups(items) {
  if (!items || items.length === 0) {
    renderEmpty("No hay opciones disponibles por ahora.");
    return;
  }

  catalogEl.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h2 class="card-title">${item.label}</h2>
        </div>
      </div>

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-top:6px;
      ">
        <div></div>

        <div id="controls-${item.id}">
          <button
            class="add-btn"
            type="button"
            data-action="add"
            data-id="${item.id}"
          >
            + Agregar
          </button>
        </div>
      </div>
    `;

    catalogEl.appendChild(card);
  });
}

catalogEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const ageGroup = button.dataset.id;
  const action = button.dataset.action;

  if (!ageGroup || !action) return;

  if (action === "add") {
  changeQty(ageGroup, 1);
  }
  
  if (action === "plus") {
    changeQty(ageGroup, 1);
  }
  
  if (action === "minus") {
    changeQty(ageGroup, -1);
  }
});

// =====================================================
// API
// =====================================================

async function resolveSessionFromToken() {
  if (householdId || !token) return;

  const response = await fetch(
    `${API_BASE}/fruti/session-validate?t=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Session validate HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data?.household_id) {
    throw new Error("Session token did not return household_id");
  }

  householdId = data.household_id;
}

async function submitHouseholdMembers() {
  if (!householdId) {
    setStatus("Falta household_id en la URL.", "error");
    return;
  }

  const members = buildMembersPayload();

  if (members.length === 0) {
    setStatus("Elegí al menos una persona.", "error");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const phone = params.get("phone");
    
  const payload = {
    phone,
    members
  };

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";
    setStatus("");

    const response = await fetch(`${API_BASE}/onboarding/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Household members HTTP ${response.status}`);
    }

    const data = await response.json();
    
    window.location.href = data.pedido_url;
    
    return;

  } catch (error) {
    console.error("Error saving household members:", error);
    setStatus("No se pudieron guardar los datos del hogar.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmar hogar";
    updateSubmitButton();
  }
}

// =====================================================
// INIT
// =====================================================

submitBtn.addEventListener("click", submitHouseholdMembers);

async function initHouseholdPage() {
  try {
      await resolveSessionFromToken();   // 👈 comentar
      //householdId = "test";                // 👈 agregar

    if (!householdId) {
      setStatus("Abrí este link desde WhatsApp con una sesión válida.", "error");
      return;
    }

    renderAgeGroups(ageGroups);
    updateSubmitButton();
    setStatus("");
  } catch (error) {
    console.error("Error resolving session:", error);
    setStatus("No se pudo validar la sesión.", "error");
  }
}

initHouseholdPage();
