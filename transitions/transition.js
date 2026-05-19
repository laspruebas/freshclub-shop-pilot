const params = new URLSearchParams(window.location.search);

const type = params.get("type");
const next = params.get("next");

const deliveryDays =
  JSON.parse(
    decodeURIComponent(
      params.get("days") || "[]"
    )
  );

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
  
    title: "",
  
    subtitle: "",
  
    footer:
      "PREPARANDO TU REPORTE..."
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

function getNextDeliveryLabel(days) {

  if (!days?.length) {
    return "Hasta tu próximo pedido";
  }

  const normalized =
    days.map((d) => d.toLowerCase());

  const orderedDays = [
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes"
  ];

  const todayIndex =
    new Date().getDay();

  const jsToFruti = {
    1: "lunes",
    2: "martes",
    3: "miércoles",
    4: "jueves",
    5: "viernes"
  };

  const today =
    jsToFruti[todayIndex];

  if (normalized.length === 1) {
    return `Hasta el ${normalized[0]} que viene`;
  }

  const currentIndex =
    orderedDays.indexOf(today);

  const futureDays =
    normalized
      .map((d) => ({
        day: d,
        index: orderedDays.indexOf(d)
      }))
      .filter((d) => d.index > currentIndex)
      .sort((a, b) => a.index - b.index);

  if (futureDays.length) {
    return `Hasta el ${futureDays[0].day}`;
  }

  return `Hasta el ${normalized[0]}`;
}

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

if (type === "confirmation") {

  transitionTitle.textContent =
    `Listo. ${getNextDeliveryLabel(deliveryDays)} no pensás más en frutas y verduras.`;

} else {

  transitionTitle.textContent =
    config.title;
}

transitionSubtitle.textContent =
  config.subtitle;

transitionFooter.textContent =
  config.footer;

setTimeout(() => {

  if (next) {
    window.location.href = next;
  }

}, config.duration);
