const params = new URLSearchParams(window.location.search);

const type = params.get("type");
const next = params.get("next");

const transitionTitle =
  document.getElementById("transitionTitle");

const transitionSubtitle =
  document.getElementById("transitionSubtitle");

const transitionFooter =
  document.getElementById("transitionFooter");

const TRANSITIONS = {

  onboarding: {
    background: "#1E3A2F",
    text: "#F0F7EC",
    accent: "#7AB86A",

    title:
      "Comer bien es más fácil de lo que creés.",

    subtitle:
      "Lo hacemos por vos, estamos eligiendo lo mejor para tu familia.",

    footer:
      "ARMANDO TU PEDIDO...",

    duration: 2200
  },

  confirmation: {
    background: "#F5F0E8",
    text: "#2C2C2A",
    accent: "#A0845C",

    title:
      "Listo. Hasta el miércoles no pensás más en frutas y verduras.",

    subtitle:
      "",

    footer:
      "PREPARANDO TU REPORTE...",

    duration: 1400
  },

  invite: {
    background: "#4A7C3F",
    text: "#FFFFFF",
    accent: "#C8E6B0",

    title:
      "La mejor forma de cuidar a alguien es regalarle tiempo y salud.",

    subtitle:
      "",

    footer:
      "COMPARTIENDO FRUTI...",

    duration: 1000
  }
};

const config =
  TRANSITIONS[type] ||
  TRANSITIONS.onboarding;

document.body.style.background =
  config.background;

document.body.style.color =
  config.text;

document.documentElement.style.setProperty(
  "--transition-accent",
  config.accent
);

transitionTitle.textContent =
  config.title;

transitionSubtitle.textContent =
  config.subtitle;

transitionFooter.textContent =
  config.footer;

setTimeout(() => {

  if (next) {
    window.location.href = next;
  }

}, config.duration);
