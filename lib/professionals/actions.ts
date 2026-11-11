"use server";

// ============================================================
// SERVER ACTIONS DE PROFESIONALES — R4-B-2 (5.03/5.10)
//
// DE PANEL: alta/edición/desactivación/baja blanda de los
// profesionales de la agenda. Cada acción valida la sesión
// (`rv_admin_session`) y el RBAC (`canManageSchedule`) antes de
// escribir, y registra en auditoría (8.12).
//
// La lógica de datos vive en `lib/professionals.ts` + `lib/db.ts`;
// aquí solo sesión, permisos, auditoría y revalidación.
// ============================================================

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { logAudit } from "@/lib/audit";
import { canManageSchedule } from "@/lib/rbac";
import { slugify } from "@/lib/utils";
import { getDb } from "@/lib/db";
import {
  getProfessionalById,
  seedProfessionalsIfEmpty,
  upsertRulesForPro,
} from "@/lib/professionals";

const SESSION_COOKIE = "rv_admin_session";

async function currentProfile() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  return getSessionProfile(token);
}

type Result =
  | { ok: true; id?: string }
  | { ok: false; error: string };

interface ProfessionalInput {
  name: string;
  role: string;
  services: string[];
  modalities: string[];
  days: number[];
  open: number;
  close: number;
  setActive: boolean; // sábado atendido
  saturday?: { open: number; close: number } | null;
}

/** Validación común de un alta/edición; devuelve error o null. */
function validate(input: ProfessionalInput, id: string | null): string | null {
  if (!id && input.name.trim().length < 3)
    return "El nombre del profesional es demasiado corto.";
  if (input.open < 0 || input.open > 23 || input.close < 1 || input.close > 24)
    return "El horario de apertura y cierre deben ser horas válidas (0–23 / 1–24).";
  const mods = input.modalities.filter((m) => m === "presencial" || m === "enlinea");
  if (mods.length === 0)
    return "Marca al menos una modalidad: presencial, en línea o ambas.";
  if (input.open >= input.close)
    return "La última cita debe ser posterior a la primera (rango inclusivo x…y).";
  if (input.days.length === 0)
    return "Marca al menos un día de atención (el profesional sin días no aparece en la agenda).";
  if (input.days.some((d) => d < 1 || d > 6))
    return "Los días válidos son 1 (lunes) a 6 (sábado). El domingo no es atendido por ahora.";
  if (input.days.includes(6) && !input.saturday)
    return "El horario del sábado también hay que definirlo (abre y cierra).";
  if (input.services.length === 0)
    return "Marca al menos un servicio que atiende el profesional.";
  return null;
}

/**
 * Alta (sin `id`) o edición (con `id`) de un profesional.
 * Al guardar, las reglas de `availability_rules` se alinean con el
 * perfil (`upsertRulesForPro`) para que la agenda lo refleje enseguida.
 */
export async function saveProfessional(
  input: ProfessionalInput,
  id?: string,
): Promise<Result> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Tu sesión caducó. Vuelve a entrar." };
  if (!canManageSchedule(profile.role))
    return { ok: false, error: "Solo el administrador y la terapeuta gestionan los profesionales." };

  const existing = id ? getProfessionalById(id) : null;
  if (id && !existing) return { ok: false, error: "Ese profesional ya no existe." };
  const err = validate(input, existing?.id ?? null);
  if (err) return { ok: false, error: err };

  const proId = existing?.id ?? makeUniqueId(input.name);
  const now = Date.now();
  const db = getDb();
  seedProfessionalsIfEmpty();

  const modalities = input.modalities.filter((m) => m === "presencial" || m === "enlinea");

  if (existing) {
    db.prepare(
      `UPDATE professionals
         SET name = ?, role = ?, services_json = ?, modalities_json = ?, days_json = ?,
             open_hour = ?, close_hour = ?, sat_open = ?, sat_close = ?,
             active = 1, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
    ).run(
      input.name.trim(),
      input.role.trim(),
      JSON.stringify(input.services),
      JSON.stringify(modalities),
      JSON.stringify(input.days),
      input.open,
      input.close,
      input.saturday?.open ?? null,
      input.saturday?.close ?? null,
      now,
      proId,
    );
  } else {
    db.prepare(
      `INSERT INTO professionals
         (id, name, role, services_json, modalities_json, days_json, open_hour, close_hour,
          sat_open, sat_close, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      proId,
      input.name.trim(),
      input.role.trim(),
      JSON.stringify(input.services),
      JSON.stringify(modalities),
      JSON.stringify(input.days),
      input.open,
      input.close,
      input.saturday?.open ?? null,
      input.saturday?.close ?? null,
      now,
      now,
    );
  }

  // Alinean los horarios con la agenda: el motor lee availability_rules.
  upsertRulesForPro({ id: proId, days: input.days, open: input.open, close: input.close, saturday: input.saturday });

  logAudit(
    { email: profile.email, role: profile.role },
    existing ? "profesional.editar" : "profesional.crear",
    "profesional",
    proId,
    `${input.name.trim()} (${input.days.length} días · ${modalities.join("+")})`,
  );
  revalidatePath("/admin/profesionales");
  revalidatePath("/admin/horarios");
  revalidatePath("/agendar");
  return { ok: true, id: proId };
}

/** Alta/baja lógica del listado: inactivo = desaparece de `/agendar`. */
export async function setProfessionalActive(id: string, active: boolean): Promise<Result> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Tu sesión caducó. Vuelve a entrar." };
  if (!canManageSchedule(profile.role))
    return { ok: false, error: "Solo el administrador y la terapeuta gestionan los profesionales." };
  const existing = getProfessionalById(id);
  if (!existing) return { ok: false, error: "Ese profesional ya no existe." };

  getDb()
    .prepare(
      `UPDATE professionals SET active = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
    )
    .run(active ? 1 : 0, Date.now(), id);

  logAudit(
    { email: profile.email, role: profile.role },
    active ? "profesional.aceptar" : "profesional.deshabilitar",
    "profesional",
    id,
    `${existing.name} → ${active ? "activo" : "inactivo"}`,
  );
  revalidatePath("/admin/profesionales");
  revalidatePath("/admin/horarios");
  revalidatePath("/agendar");
  return { ok: true };
}

/**
 * Baja blanda (el registro se queda, las citas históricas intactas);
 * sus reglas de horario se desactivan (deja de ofrecerse en la agenda).
 */
export async function deleteProfessional(id: string): Promise<Result> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Tu sesión caducó. Vuelve a entrar." };
  if (!canManageSchedule(profile.role))
    return { ok: false, error: "Solo el administrador y la terapeuta gestionan los profesionales." };
  const existing = getProfessionalById(id);
  if (!existing) return { ok: false, error: "Ese profesional ya no existe." };

  const db = getDb();
  const now = Date.now();
  db.prepare(
    `UPDATE professionals SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
  ).run(now, now, id);
  db.prepare(
    `UPDATE availability_rules SET active = 0, updated_at = ? WHERE pro_id = ? AND active = 1`,
  ).run(now, id);

  logAudit(
    { email: profile.email, role: profile.role },
    "profesional.bajar",
    "profesional",
    id,
    `${existing.name} (baja blanda)`,
  );
  revalidatePath("/admin/profesionales");
  revalidatePath("/admin/horarios");
  revalidatePath("/agendar");
  return { ok: true };
}

// ------------------------------------------------------------
// Utilidades

/** `Nombre Apellido` → id tipo slug, único (colisión → sufijo -2, -3…). */
function makeUniqueId(name: string): string {
  const base = slugify(name).slice(0, 40) || "pros";
  let id = base;
  let n = 2;
  while (getProfessionalById(id)) {
    id = `${base}-${n}`;
    n++;
  }
  return id;
}
