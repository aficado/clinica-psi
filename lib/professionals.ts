// ============================================================
// PROFESIONALES — R4-B-2 (5.03/5.10)
//
// Capa de datos de los profesionales de la agenda. Sustituye la
// constante fija de `lib/data.ts` (que queda como SEMILLA demo,
// TODO D8). Cada dato vive en un solo sitio: la tabla
// `professionals` (identidad) y `availability_rules` (horario
// operativo que consume el motor de R4-A — última palabra).
//
// SOLO servidor: usa `node:sqlite`.
// ============================================================

import { getDb } from "@/lib/db";
import { professionals as demoProfessionals, type Professional } from "@/lib/data";

/** Fila cruda de la tabla (nombres SQLite; los array van en JSON). */
interface ProfessionalRow {
  id: string;
  name: string;
  role: string;
  services_json: string;
  modalities_json: string;
  days_json: string;
  open_hour: number;
  close_hour: number;
  sat_open: number | null;
  sat_close: number | null;
  active: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

/** Vista del panel (R4-B-2): identidad + estado, sin los JSON crudos. */
export interface ProfessionalAdminView {
  id: string;
  name: string;
  role: string;
  services: string[];
  /** R4-B-PROF-1: modalidades que ofrece (al menos una). */
  modalities: Array<"presencial" | "enlinea">;
  days: number[];
  open: number;
  close: number;
  saturdayOpen: number | null;
  saturdayClose: number | null;
  saturday: { open: number; close: number } | null;
  active: boolean;
  updatedAt: number;
}

/** JSON.parse seguro: mal formado o no-array → fallback []. */
function parseIds(json: string, fallback: number[] = []): number[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function parseStrings(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** R4-B-PROF-1: modalidades guardadas; ausente/vacío = ambas (compatibilidad). */
function parseModalities(json: string): Array<"presencial" | "enlinea"> {
  const v = parseStrings(json).filter((m) => m === "presencial" || m === "enlinea");
  return (v.length > 0 ? v : ["presencial", "enlinea"]) as Array<"presencial" | "enlinea">;
}

/** Fila → vista del panel (filas de `node:sqlite` → SIEMPRE objeto plano). */
function rowToView(r: ProfessionalRow): ProfessionalAdminView {
  const saturday =
    r.sat_open !== null && r.sat_close !== null
      ? { open: r.sat_open, close: r.sat_close }
      : null;
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    services: parseStrings(r.services_json),
    modalities: parseModalities(r.modalities_json ?? ""),
    days: parseIds(r.days_json),
    open: r.open_hour,
    close: r.close_hour,
    saturdayOpen: r.sat_open,
    saturdayClose: r.sat_close,
    saturday,
    active: r.active === 1,
    updatedAt: r.updated_at,
  };
}

/** Vista del panel → `Professional` (el tipo que ya usa toda la app). */
function viewToProfessional(v: ProfessionalAdminView): Professional {
  return {
    id: v.id,
    name: v.name,
    role: v.role,
    services: v.services,
    modalities: v.modalities,
    days: v.days,
    open: v.open,
    close: v.close,
    ...(v.saturday ? { saturday: v.saturday } : {}),
  };
}

let seeded = false;

/**
 * Siembra los profesionales DEMO desde `lib/data.ts` si la tabla está
 * vacía (idempotente). TODO D8: sembrar con los datos reales del dueño.
 */
export function seedProfessionalsIfEmpty(): void {
  if (seeded) return;
  const count = getDb()
    .prepare("SELECT COUNT(*) AS n FROM professionals WHERE deleted_at IS NULL")
    .get() as { n: number };
  if (count.n === 0) {
    const now = Date.now();
    const ins = getDb().prepare(
      `INSERT INTO professionals
         (id, name, role, services_json, modalities_json, days_json, open_hour, close_hour, sat_open, sat_close, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    );
    for (const p of demoProfessionals) {
      ins.run(
        p.id,
        p.name,
        p.role,
        JSON.stringify(p.services),
        JSON.stringify(p.days),
        p.open,
        p.close,
        p.saturday?.open ?? null,
        p.saturday?.close ?? null,
        now,
        now,
      );
    }
  }
  seeded = true;
}

/** Consulta parametrizable: activo o todos (no borrados). */
function list(includeInactive: boolean): ProfessionalRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM professionals
       WHERE deleted_at IS NULL ${includeInactive ? "" : "AND active = 1"}
       ORDER BY rowid ASC`,
    )
    .all() as unknown as ProfessionalRow[];
}

/** Profesionales ACTIVOS (lo que ve el paciente en `/agendar`). */
export function getProfessionals(): Professional[] {
  seedProfessionalsIfEmpty();
  return list(false).map((r) => viewToProfessional(rowToView(r)));
}

/** Profesionales sin borrar, activos e inactivos (panel). */
export function getProfessionalsAll(): ProfessionalAdminView[] {
  seedProfessionalsIfEmpty();
  return list(true).map((r) => rowToView(r));
}

/** Un profesional por `id` (activo o inactivo); null si no existe. */
export function getProfessionalById(id: string): ProfessionalAdminView | null {
  seedProfessionalsIfEmpty();
  const rows = getDb()
    .prepare(
      `SELECT * FROM professionals WHERE id = ? AND deleted_at IS NULL`,
    )
    .all(id) as unknown as ProfessionalRow[];
  return rows[0] ? rowToView(rows[0]) : null;
}

/**
 * Sincroniza `availability_rules` con los días/horario del perfil del
 * profesional (INSERT OR REPLACE; índice único `ux_rule_pro_day`).
 * El motor de R4-A sigue leyendo las reglas — esto solo alinea el
 * perfil con ellas cuando el panel guarda. Se llama en cada guardado.
 */
export function upsertRulesForPro(pro: {
  id: string;
  days: number[];
  open: number;
  close: number;
  saturday?: { open: number; close: number } | null;
}): void {
  const db = getDb();
  const now = Date.now();
  const up = db.prepare(
    `INSERT INTO availability_rules
       (pro_id, day_of_week, open_hour, close_hour, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(pro_id, day_of_week) DO UPDATE SET
       open_hour = excluded.open_hour,
       close_hour = excluded.close_hour,
       active = excluded.active,
       updated_at = excluded.updated_at`,
  );
  for (const dow of pro.days) {
    const open = dow === 6 ? pro.saturday?.open : undefined;
    const close = dow === 6 ? pro.saturday?.close : undefined;
    up.run(pro.id, dow, open ?? pro.open, close ?? pro.close, now, now);
  }
}
