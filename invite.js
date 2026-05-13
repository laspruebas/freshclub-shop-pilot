// =====================================================
// INVITE PAGE
// =====================================================

const WHATSAPP_RETURN_URL = "https://wa.me/14155238886";

const params = new URLSearchParams(window.location.search);
const referralCode = params.get("ref");

if (referralCode) {
  sessionStorage.setItem("referral_code", referralCode);
}

const startInviteBtn = document.getElementById("startInviteBtn");
const inviteRefLabel = document.getElementById("inviteRefLabel");

if (inviteRefLabel) {
  inviteRefLabel.textContent = referralCode
    ? `Código de invitación: ${referralCode}`
    : "";
}

startInviteBtn?.addEventListener("click", () => {
  const message = referralCode
    ? `Hola, quiero sumarme a FRUTI con este código de invitación: ${referralCode}`
    : "Hola, quiero sumarme a FRUTI";

  window.location.href =
    `${WHATSAPP_RETURN_URL}?text=${encodeURIComponent(message)}`;
});
