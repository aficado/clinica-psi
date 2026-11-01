import { professionals as defaultProfessionals } from "./data";
import type { Professional, Service } from "./data";
import { slotKey } from "./utils";

/**
 * Motor de disponibilidad (demo, Fase 1–2).
 * TODO (Fase 4): reemplazar por la disponibilidad real en el almacenamiento real
 * (availability_rules + appointments con control de concurrencia).
 *
 * El servicio y los profesionales llegan por parámetro (desde la BD o,
 * por defecto, de `lib/data.ts`), así que las ediciones de duración o
 * modalidad hechas en el panel se reflejan en la agenda.
 *
 * Aquí la "ocupación" es determinista (hash), para que la demo se
 * vea realista y estable entre cargas sin una base de datos.
 */

export interface Slot {
  dateIso: string; // YYYY-MM-DD
  hour: number; // 24h
  serviceSlug: string;
  proId: string;
  taken: boolean;
}

/** Hash simple y estable para simular slots ocupados de forma realista (~30 %). */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function hashTaken(dateIso: string, hour: number, serviceSlug: string, proId: string): boolean {
  return hash(slotKey(dateIso, hour, serviceSlug, proId)) % 10 < 3;
}

/** Profesionales que pueden atender un servicio en una modalidad. */
export function professionalsFor(
  service: Service,
  modality: "presencial" | "enlinea",
  pros: Professional[] = defaultProfessionals,
): Professional[] {
  if (!service.modalities.includes(modality)) return [];
  return pros.filter((p) => p.services.includes(service.slug));
}

/** Genera slots para el servicio/profesional en los próximos `days` días. */
export function slotsFor(
  service: Service,
  proId: string,
  days = 21,
  pros: Professional[] = defaultProfessionals,
): Slot[] {
  const pro = pros.find((p) => p.id === proId);
  if (!pro) return [];

  const out: Slot[] = [];
  const now = new Date();
  for (let d = 1; d <= days; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    const dow = day.getDay(); // 0=domingo
    // ISO en hora local (evita el desfase UTC de toISOString)
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;

    if (dow === 0) continue; // domingo cerrado
    if (!pro.days.includes(dow)) continue;

    const sat = dow === 6 && pro.saturday;
    const open = sat ? sat.open : pro.open;
    const close = sat ? sat.close : pro.close;

    for (let h = open; h + Math.ceil(service.duration / 60) <= close; h++) {
      out.push({
        dateIso: iso,
        hour: h,
        serviceSlug: service.slug,
        proId,
        taken: hashTaken(iso, h, service.slug, proId),
      });
    }
  }
  return out;
}
