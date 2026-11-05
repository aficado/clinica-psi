"use server";

// ============================================================
// SERVER ACTIONS DE AGENDA — R4-A (5.05–5.07, 5.10)
//
// Dos superficies:
//  1) PÚBLICAS (el paciente no tiene cuenta): `bookAppointment`,
//     `cancelMyAppointment`, `reprogramar` — su credencial es el
//     enlace único con token (5.07). Rate limiting: TODO (9.06).
//  2) DE PANEL: horarios y cancelación administrativa — validan la
//     sesión (`rv_admin_session`) y el RBAC (`canManageSchedule`)
//     antes de escribir, y registran en auditoría (8.12).
//
// Toda la lógica y las validaciones duras viven en `lib/schedule.ts`;
// aquí solo sesión, permisos, auditoría y revalidación.
// ============================================================

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { logAudit } from "@/lib/audit";
import { canManageSchedule } from "@/lib/rbac";
import { getProfessionals } from "@/lib/professionals";
import { getServices, type ServiceView } from "@/lib/content";
import { isoLocal } from "@/lib/schedule";
import {
  cancelAppointment,
  createAppointment,
  deleteException,
  deleteRule,
  daySlotsFor,
  listExceptions,
  monthSchedule,
  rescheduleAppointment,
  saveException,
  saveRule,
  type BookingInput,
  type DaySlotsWithReason,
  type ExceptionInput,
  type ExceptionView,
} from "@/lib/schedule";

const SESSION_COOKIE = "rv_admin_session";

async function currentProfile() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  return getSessionProfile(token);
}

/** Disponibilidad real del profesional en un mes completo (`/agendar` + `/mi-cita`). */
type AvailabilityResult = { ok: true; days: DaySlotsWithReason[] } | { ok: false; error: string };
type Result = { ok: true; token?: string } | { ok: false; error: string };

// ------------------------------------------------------------
// Público (sin sesión): el token de `/mi-cita/<token>` es la llave

/** Mes completo con la disponibilidad de cada día para el profesional seleccionado (`/agendar`, `/mi-cita`). */
export async function fetchAvailability(serviceSlug: string, proId: string): Promise<AvailabilityResult> {
  const svc = getServices().find((s) => s.slug === serviceSlug);
  if (!svc) return { ok: false, error: "Ese servicio no está disponible ahora mismo." };
  if (!getProfessionals().some((p) => p.id === proId))
    return { ok: false, error: "Ese profesional no está disponible ahora mismo." };
  const today = isoLocal(new Date());
  return { ok: true, days: monthSchedule(proId, today) };
}

/** Mes completo para navegar el calendario (la fecha que sea; se puede pedir cualquier día del año).
 *  NOTA: se compara MES contra MES (`YYYY-MM` vs `YYYY-MM`); comparar `"2026-11"` < `"2026-11-01"`
 *  era true y dejaba el calendario del mes actual vacío. */
export async function fetchMonthSchedule(proId: string, dateIso: string): Promise<AvailabilityResult> {
  const monthIso = dateIso.slice(0, 7);
  const currentMonth = isoLocal(new Date()).slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(monthIso))
    return { ok: false, error: "El mes solicitado no es válido." };
  if (monthIso < currentMonth) return { ok: true, days: [] };
  return { ok: true, days: monthSchedule(proId, monthIso) };
}

/** Disponibilidad de un día concreto (navegación del calendario; se puede pedir cualquier día del año). */
export async function fetchDaySlots(dateIso: string, proId: string): Promise<AvailabilityResult> {
  if (dateIso < isoLocal(new Date())) return { ok: false, error: "No puedes agendar en el pasado." };
  return { ok: true, days: [daySlotsFor(dateIso, proId)] };
}

/** Alta de cita con anti-doble-reserva (5.04/5.05). */
export async function bookAppointment(input: BookingInput): Promise<Result> {
  const res = createAppointment(input);
  if (res.ok) {
    logAudit(
      { email: "anonimo (publico)", role: "paciente" },
      "cita.crear",
      "appointment",
      res.token ?? null,
      `${input.proId} ${input.dateIso} ${input.hour}:00 · ${input.serviceSlug}`,
    );
    revalidatePath("/admin/horarios");
  }
  return res;
}

/** Cancelación del paciente (5.07): sujeta a la anticipación mínima (D4). */
export async function cancelMyAppointment(token: string): Promise<Result> {
  const res = cancelAppointment(token, { enforceCutoff: true });
  if (res.ok) {
    logAudit({ email: "anonimo (publico)", role: "paciente" }, "cita.cancelar", "appointment", token);
    revalidatePath("/admin/horarios");
  }
  return res;
}

/** Reprogramación del paciente desde el enlace único (5.07). */
export async function rescheduleMyAppointment(token: string, dateIso: string, hour: number): Promise<Result> {
  const res = rescheduleAppointment(token, dateIso, hour);
  if (res.ok) {
    logAudit(
      { email: "anonimo (publico)", role: "paciente" },
      "cita.reprogramar",
      "appointment",
      token,
      `${dateIso} ${hour}:00`,
    );
    revalidatePath("/admin/horarios");
  }
  return res;
}

// ------------------------------------------------------------
// Panel (admin + terapeuta)

async function guardSchedule(): Promise<
  { ok: false; error: string } | { ok: true; actor: { email: string; role: string } }
> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Inicia sesión para gestionar la agenda." };
  if (!canManageSchedule(profile.role))
    return { ok: false, error: "Solo el administrador y la terapeuta gestionan la agenda." };
  return { ok: true, actor: { email: profile.email, role: profile.role } };
}

export interface RuleInput {
  id?: number;
  proId: string;
  dow: number;
  open: number;
  close: number;
  active: boolean;
}

/** Alta/edición de horarios por día (5.02). */
export async function saveAvailabilityRule(input: RuleInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await guardSchedule();
  if (!guard.ok) return { ok: false, error: guard.error };
  const res = saveRule(input);
  if (res.ok) {
    logAudit(
      guard.actor,
      "disponibilidad.guardar",
      "availability_rule",
      String(input.id ?? `${input.proId}:${input.dow}`),
      `${input.proId} dia ${input.dow} ${input.open}-${input.close} ${input.active ? "activo" : "inactivo"}`,
    );
    revalidatePath("/admin/horarios");
  }
  return res;
}

/** Quita un día de atención del profesional. */
export async function deleteAvailabilityRule(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await guardSchedule();
  if (!guard.ok) return { ok: false, error: guard.error };
  const res = deleteRule(id);
  if (res.ok) {
    logAudit(guard.actor, "disponibilidad.borrar", "availability_rule", String(id));
    revalidatePath("/admin/horarios");
  }
  return res;
}

/** Cancelación administrativa, sin anticipación mínima (5.10). */
export async function adminCancelAppointment(token: string): Promise<Result> {
  const guard = await guardSchedule();
  if (!guard.ok) return { ok: false, error: guard.error };
  const res = cancelAppointment(token, { enforceCutoff: false, reason: "cancelada desde el panel" });
  if (res.ok) {
    logAudit(guard.actor, "cita.cancelar-admin", "appointment", token);
    revalidatePath("/admin/horarios");
  }
  return res;
}

// ------------------------------------------------------------
// Excepciones por fecha (R4-B-3, PB-3): vacaciones / festivos / bloqueo

type ExceptionsResult =
  | { ok: true; exceptions: ExceptionView[] }
  | { ok: false; error: string };

/** Lista los bloqueos por fecha para el panel. */
export async function fetchExceptions(): Promise<ExceptionsResult> {
  const guard = await guardSchedule();
  if (!guard.ok) return { ok: false, error: guard.error };
  return { ok: true, exceptions: listExceptions() };
}

/** Alta/edición de un bloqueo por rango de fechas (5.02). */
export async function saveDateException(
  input: ExceptionInput,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const guard = await guardSchedule();
  if (!guard.ok) return { ok: false, error: guard.error };
  const res = saveException(input);
  if (res.ok) {
    logAudit(
      guard.actor,
      input.id != null ? "excepcion.actualizar" : "excepcion.crear",
      "date_exception",
      String(res.id),
      `${input.proId} ${input.dateFrom}..${input.dateTo} ${input.kind}`,
    );
    revalidatePath("/admin/horarios");
  }
  return res;
}

/** Borra un bloqueo: los días vuelven a ofrecer sus horarios. */
export async function deleteDateException(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await guardSchedule();
  if (!guard.ok) return { ok: false, error: guard.error };
  const res = deleteException(id);
  if (res.ok) {
    logAudit(guard.actor, "excepcion.borrar", "date_exception", String(id));
    revalidatePath("/admin/horarios");
  }
  return res;
}
