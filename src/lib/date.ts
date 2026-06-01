// src/lib/date.ts

/**
 * Ajusta una fecha al horario de México (UTC-6)
 */
export function getMexicoDate(date: Date = new Date()): Date {
  const mexicoDate = new Date(date);
  mexicoDate.setUTCHours(mexicoDate.getUTCHours() - 6);
  return mexicoDate;
}

/**
 * Formatea una fecha a español MX con el desfase correcto
 */
export function formatMexicoDate(date: Date) {
  const mexicoDate = getMexicoDate(date);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(mexicoDate).toLowerCase();
}

/**
 * Calcula el inicio de la semana (Lunes) en horario de México
 */
export function getMexicoMonday(date: Date = new Date()) {
  const mexicoDate = getMexicoDate(date);
  const day = mexicoDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  mexicoDate.setDate(mexicoDate.getDate() + diff);
  mexicoDate.setHours(0, 0, 0, 0);
  return mexicoDate;
}