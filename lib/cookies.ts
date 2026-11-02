/** Utilidades de cookies del navegador. Solo para datos locales de la UI (nada sensible). */

export const BOOKING_STATE_COOKIE = "booking_state";
const COOKIE_DAYS = 7;

/** Días hasta que expire la cookie (ajustable: `?` no se recomienda tocar). */
function expires(): string {
  const d = new Date();
  d.setDate(d.getDate() + COOKIE_DAYS);
  return d.toUTCString();
}

/** Escribir el estado de la programación en una cookie (`booking_state`). */
export function setBookingState(partial: Record<string, unknown>): void {
  try {
    const current = getBookingState();
    for (const key in partial) {
      if (partial[key] === undefined || partial[key] === null) delete current[key];
      else current[key] = partial[key];
    }
    document.cookie = `${BOOKING_STATE_COOKIE}=${JSON.stringify(
      current,
    )}; expires=${expires()}; path=/; SameSite=Lax`;
  } catch {
    /* cookies bloqueadas: la UI solo pierde el estado, no se cae */
  }
}

/** Leer el estado guardado; `{}` si no existe. */
export function getBookingState(): Record<string, unknown> {
  const value = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${BOOKING_STATE_COOKIE}=`))
    ?.split("=")[1];
  if (!value) return {};
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return {};
  }
}

/** Borrar el estado (cita confirmada o nueva agenda). */
export function clearBookingState(): void {
  document.cookie = `${BOOKING_STATE_COOKIE}=; expires=${new Date(0).toUTCString()}; path=/; SameSite=Lax`;
}
