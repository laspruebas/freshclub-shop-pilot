export function getNextDeliveryMessage(storage = sessionStorage) {
  const schedule =
    JSON.parse(
      storage.getItem("delivery_schedule") || "[]"
    );

  const days =
    schedule.map((item) => item.day);

  if (!days.length) {
    return "Ahora olvidate de las frutas y verduras.";
  }

  if (days.length === 1) {
    return `Hasta el ${days[0]} que viene no pensás más en frutas y verduras.`;
  }

  const orderedDays = [
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes"
  ];

  const today =
    new Date()
      .toLocaleDateString("es-AR", {
        weekday: "long"
      })
      .toLowerCase();

  const currentIndex =
    orderedDays.indexOf(today);

  const future =
    days
      .map((day) => ({
        day,
        index: orderedDays.indexOf(day)
      }))
      .filter((item) => item.index > currentIndex)
      .sort((a, b) => a.index - b.index);

  const nextDay =
    future[0]?.day || days[0];

  return `Hasta el ${nextDay} no pensás más en frutas y verduras.`;
}
