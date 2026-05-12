// =====================================================
// INVITE PAGE
// =====================================================

const params = new URLSearchParams(window.location.search);
const referralCode = params.get("ref");

const startInviteBtn = document.getElementById("startInviteBtn");
const inviteRefLabel = document.getElementById("inviteRefLabel");

if (inviteRefLabel) {
  inviteRefLabel.textContent = referralCode
    ? `Código de invitación: ${referralCode}`
    : "";
}

startInviteBtn?.addEventListener("click", () => {
  const targetUrl = referralCode
    ? `./index.html?ref=${encodeURIComponent(referralCode)}`
    : "./index.html";

  window.location.href = targetUrl;
});
