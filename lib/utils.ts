/** Utilidades compartidas. */

/** Une clases CSS de forma condicional. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Enlace de WhatsApp con mensaje precargado. */
export function waLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** URL base absoluta del sitio (7.01 / QR); configurable vía SITE_BASE_URL. */
export function siteUrl(): string {
  return (process.env.SITE_BASE_URL ?? "https://www.raizviva.mx").replace(/\/$/, "");
}

/** Normaliza un texto a enlace: minúsculas, sin acentos, [a-z0-9-]. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Fecha legible en español (MX): "lun, 3 jun 2026". */
export function formatDateMX(iso: string): string {
  return new Date(`${iso}T12:00:00-06:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Día completo: "lunes, 3 de junio". */
export function formatDateLongMX(iso: string): string {
  return new Date(`${iso}T12:00:00-06:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Etiqueta de hora: 9 -> "9:00", 14 -> "14:00". */
export function timeLabel(hour: number): string {
  return `${hour}:00`;
}

/** Tiempo de lectura aproximado en minutos. */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 180));
}

/** Clave única de un slot (para anti-doble-reserva local en la demo). */
export function slotKey(dateIso: string, hour: number, serviceSlug: string, proId: string): string {
  return `${dateIso}T${String(hour).padStart(2, "0")}:00-${serviceSlug}-${proId}`;
}

/** Convirtie un searchParam (que puede ser string[] en Next 15) a string. */
export function asString(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}
