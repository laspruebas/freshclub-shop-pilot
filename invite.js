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

startInviteBtn?.addEventListener("click", () => {

  const message = referralCode
    ? `Hola, quiero sumarme a FRUTI con el código ${referralCode}`
    : "Hola, quiero sumarme a FRUTI";

  window.location.href =
    `${WHATSAPP_RETURN_URL}?text=${encodeURIComponent(message)}`;
});
