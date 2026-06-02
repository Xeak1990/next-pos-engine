// src/lib/date.ts

/**
 * Obtiene la fecha y hora actual en la zona horaria de México (America/Mexico_City)
 * y la devuelve como un objeto Date en UTC equivalente.
 * 
 * Ejemplo: Si en México son 2025-06-01 14:30:00, retorna new Date(Date.UTC(2025,5,1,20,30,0))
 * Esto permite guardar en la BD el valor UTC correcto para ese instante mexicano.
 */
export function getCurrentMexicoDate(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const values: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = parseInt(part.value, 10);
    }
  }
  return new Date(Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second
  ));
}

/**
 * Calcula el inicio de la semana (Lunes) en horario de México
 * Devuelve un objeto Date en UTC que representa las 00:00:00 de ese lunes en México.
 */
export function getMexicoMonday(referenceDate: Date = new Date()) {
  const currentMexico = getCurrentMexicoDate();
  const day = currentMexico.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(currentMexico);
  monday.setUTCDate(monday.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

// (Opcional) mantén las funciones anteriores si otros archivos las usan
export function formatMexicoDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatter.format(date).toLowerCase();
}