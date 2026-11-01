// ============================================================
// AGENDA REAL — R4-A (5.01–5.05, 5.07 y 5.10 parciales)
//
// Motor de disponibilidad y registro de citas sobre la base de
// datos local (la misma capa SQLite de R3). TODO (R4/Fase 4):
// la migración a Supabase + RLS queda pendiente de decidir el
// despliegue; la lógica no cambia, solo el conductor.
//
// Diferencia con `lib/slots.ts` (motor demo de Fase 1–2): aquí la
// ocupación es REAL — se lee de `appointments` y toda escritura va
// en transacción `BEGIN IMMEDIATE` + el índice único parcial
// `ux_appt_slot`, que es la garantía dura anti-doble-reserva (5.04):
// dos pedidos paralelos sobre el mismo slot → uno gana, el otro
// recibe "Ese horario ya no está disponible".
//
// Zona horaria: se usa la del servidor (en el despliegue,
// America/Mexico_City). Configuración explícita: TODO (5.03).
//
// SOLO SERVIDOR: usa `lib/db.ts` (`node:sqlite`). No importar desde
// componentes de cliente (solo tipos, con `import type`).
// ============================================================

import { randomBytes } from "node:crypto";
import { clinic, professionals, type Professional } from "./data";
import { getServices, getServicesAll } from "./content";
import { professionalsFor } from "./slots";
import { getDb } from "./db";

export const BOOKING_WINDOW_DAYS = 21;

export interface DaySlots {
  dateIso: string;
  hours: { hour: number; taken: boolean }[];
}

export type ApptStatus = "confirmada" | "cancelada" | "completada";

export interface AppointmentRow {
  id: number;
  token: string;
  service_slug: string;
  pro_id: string;
  modality: string;
  date: string;
  hour: number;
  duration: number;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  note: string;
  consent: number;
  status: string;
  created_at: number;
  updated_at: number;
  cancelled_at: number | null;
}

export interface RuleView {
  id: number;
  proId: string;
  dow: number; // 0 = domingo ... 6 = sábado
  open: number; // 24h
  close: number; // 24h
  active: boolean;
}

export interface AppointmentView {
  token: string;
  serviceSlug: string;
  serviceName: string;
  proId: string;
  proName: string;
  modality: string;
  dateIso: string;
  hour: number;
  duration: number;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  note: string;
  status: ApptStatus;
  startMs: number;
  createdMs: number;
  /** ¿Puede el paciente gestionar la cita desde `/mi-cita` (5.07)? */
  canPatientManage: boolean;
  cutoffHours: number;
  isPast: boolean;
}

export interface BookingInput {
  serviceSlug: string;
  proId: string;
  modality: string;
  dateIso: string;
  hour: number;
  name: string;
  phone: string;
  email: string;
  note: string;
  consent: boolean;
}

export type ScheduleResult = { ok: true; token?: string } | { ok: false; error: string };

// ------------------------------------------------------------
// Utilidades de fecha/hora (locales, sin sorpresas de UTC)
// ------------------------------------------------------------

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysIso(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return isoLocal(d);
}

function hourOfIso(iso: string): number {
  // "YYYY-MM-DD" → día de la semana local (1=lunes...0=domingo)
  return new Date(`${iso}T12:00:00`).getDay();
}

function startMs(dateIso: string, hour: number): number {
  return new Date(`${dateIso}T${String(hour).padStart(2, "0")}:00:00`).getTime();
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ------------------------------------------------------------
// Semilla de horarios (5.02) — valores DEMO desde `lib/data.ts`
// TODO (D8): horarios reales por profesional, pendientes de las
// respuestas del dueño (cantidad de profesionales, turnos).
// ------------------------------------------------------------

let rulesEnsured = false;

export function seedRulesIfEmpty(): void {
  if (rulesEnsured) return;
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS n FROM availability_rules").get() as { n: number };
  if (count.n === 0) {
    const now = Date.now();
    const ins = db.prepare(
      `INSERT INTO availability_rules (pro_id, day_of_week, open_hour, close_hour, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
    );
    for (const p of professionals) {
      for (const dow of p.days) {
        const sat = dow === 6 ? p.saturday : undefined;
        ins.run(p.id, dow, sat?.open ?? p.open, sat?.close ?? p.close, now, now);
      }
    }
  }
  rulesEnsured = true;
}

// ------------------------------------------------------------
// Lecturas

export function getRules(): RuleView[] {
  seedRulesIfEmpty();
  const rows = getDb()
    .prepare("SELECT * FROM availability_rules ORDER BY pro_id, day_of_week")
    .all() as unknown as Array<{
    id: number;
    pro_id: string;
    day_of_week: number;
    open_hour: number;
    close_hour: number;
    active: number;
  }>;
  // Filas de `node:sqlite` → SIEMPRE objeto plano antes de un cliente.
  return rows.map((r) => ({
    id: r.id,
    proId: r.pro_id,
    dow: r.day_of_week,
    open: r.open_hour,
    close: r.close_hour,
    active: r.active === 1,
  }));
}

/** Anticipación mínima para cancelar/reprogramar (5.07). TODO (D4): decisión del dueño; default 24 h. */
export function getCancellationCutoffHours(): number {
  const row = getDb()
    .prepare("SELECT cancel_cutoff_hours FROM site_settings WHERE id = 'current'")
    .get() as { cancel_cutoff_hours?: number } | undefined;
  const v = row?.cancel_cutoff_hours ?? 24;
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 24;
}

/** Slots del servicio+profesional para las próximas 21 días, con ocupación real (5.03/5.04). */
export function openSlotsFor(
  serviceSlug: string,
  proId: string,
  days = BOOKING_WINDOW_DAYS,
): { ok: true; days: DaySlots[] } | { ok: false; error: string } {
  seedRulesIfEmpty();
  const svc = getServices().find((s) => s.slug === serviceSlug);
  if (!svc) return { ok: false, error: "Ese servicio no está disponible ahora mismo." };
  const pro = professionals.find((p) => p.id === proId);
  if (!pro) return { ok: false, error: "Ese profesional no está disponible ahora mismo." };

  const rules = new Map(getRules().filter((r) => r.active && r.proId === proId).map((r) => [r.dow, r]));
  const first = addDaysIso(1);
  const last = addDaysIso(days);
  const takenRows = getDb()
    .prepare(
      `SELECT date, hour FROM appointments
       WHERE pro_id = ? AND status = 'confirmada' AND date BETWEEN ? AND ?`,
    )
    .all(proId, first, last) as unknown as Array<{ date: string; hour: number }>;
  const taken = new Set(takenRows.map((t) => `${t.date}|${t.hour}`));

  const blocks = Math.max(1, Math.ceil(svc.duration / 60));
  const out: DaySlots[] = [];
  for (let d = 1; d <= days; d++) {
    const dateIso = addDaysIso(d);
    const rule = rules.get(hourOfIso(dateIso));
    if (!rule) continue;
    const hours: { hour: number; taken: boolean }[] = [];
    for (let h = rule.open; h + blocks <= rule.close; h++) {
      hours.push({ hour: h, taken: taken.has(`${dateIso}|${h}`) });
    }
    if (hours.some((x) => !x.taken)) out.push({ dateIso, hours });
  }
  return { ok: true, days: out };
}

function proFor(serviceSlug: string): Professional | undefined {
  return professionals.find((p) => p.services.includes(serviceSlug));
}

/** ¿`hour` es un candidato válido (regla activa, ventana, duración)? Devuelve error o null. */
function slotCandidateError(
  serviceSlug: string,
  proId: string,
  modality: string,
  dateIso: string,
  hour: number,
): string | null {
  if (!ISO_DATE_RE.test(dateIso)) return "La fecha no es válida.";
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return "La hora no es válida.";
  const svc = getServices().find((s) => s.slug === serviceSlug);
  if (!svc) return "Ese servicio no está disponible ahora mismo.";
  const pro = professionals.find((p) => p.id === proId);
  if (!pro) return "Ese profesional no está disponible ahora mismo.";
  if ((modality !== "presencial" && modality !== "enlinea") || !svc.modalities.includes(modality as "presencial" | "enlinea"))
    return "La modalidad no aplica a este servicio.";
  if (!professionalsFor(svc, modality as "presencial" | "enlinea").some((p) => p.id === proId))
    return "Ese profesional no atiende este servicio en esa modalidad.";
  const d0 = new Date(`${addDaysIso(1)}T12:00:00`);
  const dSel = new Date(`${dateIso}T12:00:00`);
  const max = new Date(d0);
  max.setDate(max.getDate() + BOOKING_WINDOW_DAYS - 1);
  if (dSel < d0 || dSel > max) return "Solo puedes agendar entre mañana y dentro de 21 días.";
  const rule = getRules().find((r) => r.active && r.proId === proId && r.dow === hourOfIso(dateIso));
  if (!rule) return "Ese día el profesional no atiende. Elige otro.";
  const blocks = Math.max(1, Math.ceil(svc.duration / 60));
  if (hour < rule.open || hour + blocks > rule.close) return "Esa hora está fuera del horario del profesional.";
  return null;
}

/** Alta/baja de horarios por día (5.02 simplificado: una regla por pro+día). */
export function saveRule(input: {
  id?: number;
  proId: string;
  dow: number;
  open: number;
  close: number;
  active: boolean;
}): { ok: true } | { ok: false; error: string } {
  seedRulesIfEmpty();
  if (!professionals.some((p) => p.id === input.proId)) return { ok: false, error: "Profesional desconocido." };
  if (!Number.isInteger(input.dow) || input.dow < 0 || input.dow > 6) return { ok: false, error: "El día no es válido." };
  if (!Number.isInteger(input.open) || !Number.isInteger(input.close)) return { ok: false, error: "Las horas deben ser enteras." };
  if (input.open < 0 || input.open > 23 || input.close < 0 || input.close > 24)
    return { ok: false, error: "Las horas deben estar entre 0 y 24." };
  if (input.open >= input.close) return { ok: false, error: "La hora de cierre debe ser mayor que la de apertura." };

  const db = getDb();
  const now = Date.now();
  if (input.id != null) {
    const exists = db.prepare("SELECT 1 FROM availability_rules WHERE id = ?").get(input.id);
    if (!exists) return { ok: false, error: "Ese horario ya no existe." };
    db.prepare("UPDATE availability_rules SET open_hour = ?, close_hour = ?, active = ?, updated_at = ? WHERE id = ?").run(
      input.open,
      input.close,
      input.active ? 1 : 0,
      now,
      input.id,
    );
    return { ok: true };
  }
  const clash = db
    .prepare("SELECT 1 FROM availability_rules WHERE pro_id = ? AND day_of_week = ?")
    .get(input.proId, input.dow);
  if (clash) return { ok: false, error: "Ese día ya tiene un horario definido (edítalo en vez de crear otro)." };
  db.prepare(
    `INSERT INTO availability_rules (pro_id, day_of_week, open_hour, close_hour, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(input.proId, input.dow, input.open, input.close, input.active ? 1 : 0, now, now);
  return { ok: true };
}

export function deleteRule(id: number): { ok: true } | { ok: false; error: string } {
  const res = getDb().prepare("DELETE FROM availability_rules WHERE id = ?").run(id);
  return res.changes > 0 ? { ok: true } : { ok: false, error: "Ese horario ya no existe." };
}

// ------------------------------------------------------------
// Escrituras (5.04: transacción + índice único parcial)

function newToken(): string {
  return `rv-${randomBytes(8).toString("hex")}`;
}

function queueNotifications(
  apptId: number,
  email: string,
  atMs: number,
  variant: "new" | "moved",
): void {
  if (!email) return;
  const db = getDb();
  const now = Date.now();
  const cutoffMs = getCancellationCutoffHours() * 3600_000;
  const ins = db.prepare(
    `INSERT INTO notifications (appointment_id, kind, to_email, due_at, detail)
     VALUES (?, ?, ?, ?, ?)`,
  );
  ins.run(apptId, variant === "new" ? "confirmacion" : "confirmacion_reprogramada", email, now, "");
  ins.run(apptId, "recordatorio", email, Math.max(now + 60_000, atMs - cutoffMs), "");
}

/** Alta de cita real con anti-doble-reserva (5.04/5.05). */
export function createAppointment(i: BookingInput): ScheduleResult {
  seedRulesIfEmpty();

  const name = i.name.trim();
  const email = i.email.trim();
  const phone = i.phone.trim();
  if (name.length < 3) return { ok: false, error: "Escribe tu nombre completo (mínimo 3 letras)." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Escribe un correo electrónico válido." };
  if (phone !== "" && phone.replace(/[^0-9]/g, "").length < 10)
    return { ok: false, error: "El teléfono debe tener al menos 10 dígitos (o déjalo vacío)." };
  if (!i.consent) return { ok: false, error: "Debes aceptar el aviso de privacidad para continuar." };

  const slotErr = slotCandidateError(i.serviceSlug, i.proId, i.modality, i.dateIso, i.hour);
  if (slotErr) return { ok: false, error: slotErr };

  const svc = getServices().find((s) => s.slug === i.serviceSlug)!;
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const clash = db
      .prepare(
        "SELECT 1 FROM appointments WHERE pro_id = ? AND date = ? AND hour = ? AND status = 'confirmada' LIMIT 1",
      )
      .get(i.proId, i.dateIso, i.hour);
    if (clash) {
      db.exec("ROLLBACK");
      return { ok: false, error: "Ese horario ya no está disponible. Elige otro." };
    }
    const token = newToken();
    const now = Date.now();
    const res = db
      .prepare(
        `INSERT INTO appointments (
           token, service_slug, pro_id, modality, date, hour, duration,
           patient_name, patient_phone, patient_email, note, consent,
           status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmada', ?, ?)`,
      )
      .run(
        token,
        i.serviceSlug,
        i.proId,
        i.modality,
        i.dateIso,
        i.hour,
        svc.duration,
        name,
        phone,
        email,
        i.note.trim().slice(0, 500),
        1,
        now,
        now,
      );
    queueNotifications(Number(res.lastInsertRowid), email, startMs(i.dateIso, i.hour), "new");
    db.exec("COMMIT");
    return { ok: true, token };
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* la transacción ya cayó */
    }
    if (String(err).includes("UNIQUE")) {
      return { ok: false, error: "Ese horario se ocupó justo ahora. Elige otro." };
    }
    return { ok: false, error: "No pudimos registrar la cita. Intenta de nuevo." };
  }
}

/** Cancelación (5.07). `enforceCutoff` = auto-gestión del paciente; admin cancela siempre. */
export function cancelAppointment(token: string, opts: { enforceCutoff: boolean; reason?: string }): ScheduleResult {
  const row = getDb().prepare("SELECT * FROM appointments WHERE token = ?").get(token) as
    | AppointmentRow
    | undefined;
  if (!row) return { ok: false, error: "No encontramos esa cita." };
  if (row.status === "cancelada") return { ok: false, error: "Esa cita ya fue cancelada." };
  if (row.status !== "confirmada") return { ok: false, error: "Esa cita no se puede cancelar." };

  const cutoffHours = getCancellationCutoffHours();
  if (opts.enforceCutoff && startMs(row.date, row.hour) - Date.now() < cutoffHours * 3600_000) {
    return {
      ok: false,
      error: `Faltan menos de ${cutoffHours} h para tu cita. Para cancelarla escríbenos por WhatsApp (${clinic.whatsappNumber}).`,
    };
  }

  const db = getDb();
  const now = Date.now();
  db.prepare("UPDATE appointments SET status = 'cancelada', cancelled_at = ?, updated_at = ? WHERE id = ?").run(
    now,
    now,
    row.id,
  );
  if (row.patient_email) {
    db.prepare(
      `INSERT INTO notifications (appointment_id, kind, to_email, due_at, detail) VALUES (?, 'cancelacion', ?, ?, ?)`,
    ).run(row.id, row.patient_email, now, opts.reason ?? "");
  }
  return { ok: true };
}

/** Reprogramación con enlace único (5.07): mueve la misma cita a un slot libre, con la misma garantía 5.04. */
export function rescheduleAppointment(token: string, dateIso: string, hour: number): ScheduleResult {
  const row = getDb().prepare("SELECT * FROM appointments WHERE token = ?").get(token) as
    | AppointmentRow
    | undefined;
  if (!row) return { ok: false, error: "No encontramos esa cita." };
  if (row.status !== "confirmada") return { ok: false, error: "Esa cita ya no se puede reprogramar." };

  const cutoffHours = getCancellationCutoffHours();
  // TODO (D4): la anticipación mínima aplica también al cambio; confirmar política con el dueño.
  if (startMs(row.date, row.hour) - Date.now() < cutoffHours * 3600_000) {
    return {
      ok: false,
      error: `Faltan menos de ${cutoffHours} h para tu cita. Para cambiarla escríbenos por WhatsApp (${clinic.whatsappNumber}).`,
    };
  }

  const slotErr = slotCandidateError(row.service_slug, row.pro_id, row.modality, dateIso, hour);
  if (slotErr) return { ok: false, error: slotErr };
  if (dateIso === row.date && hour === row.hour) return { ok: false, error: "La cita ya está en ese horario." };

  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const clash = db
      .prepare(
        "SELECT 1 FROM appointments WHERE pro_id = ? AND date = ? AND hour = ? AND status = 'confirmada' AND id != ? LIMIT 1",
      )
      .get(row.pro_id, dateIso, hour, row.id);
    if (clash) {
      db.exec("ROLLBACK");
      return { ok: false, error: "Ese horario ya no está disponible. Elige otro." };
    }
    const now = Date.now();
    db.prepare("UPDATE appointments SET date = ?, hour = ?, updated_at = ? WHERE id = ?").run(
      dateIso,
      hour,
      now,
      row.id,
    );
    queueNotifications(row.id, row.patient_email, startMs(dateIso, hour), "moved");
    db.exec("COMMIT");
    return { ok: true };
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* la transacción ya cayó */
    }
    if (String(err).includes("UNIQUE")) return { ok: false, error: "Ese horario se ocupó justo ahora. Elige otro." };
    return { ok: false, error: "No pudimos reprogramar la cita. Intenta de nuevo." };
  }
}

// ------------------------------------------------------------
// Vistas para admin y `/mi-cita`

function rowToView(r: AppointmentRow): AppointmentView {
  const cutoffHours = getCancellationCutoffHours();
  const start = startMs(r.date, r.hour);
  const now = Date.now();
  const svc = getServicesAll().find((s) => s.slug === r.service_slug);
  const pro = professionals.find((p) => p.id === r.pro_id) ?? proFor(r.service_slug);
  return {
    token: r.token,
    serviceSlug: r.service_slug,
    serviceName: svc?.name ?? "Servicio dado de baja",
    proId: r.pro_id,
    proName: pro?.name ?? r.pro_id,
    modality: r.modality,
    dateIso: r.date,
    hour: r.hour,
    duration: r.duration,
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    patientEmail: r.patient_email,
    note: r.note,
    status: (["confirmada", "cancelada", "completada"].includes(r.status) ? r.status : "confirmada") as ApptStatus,
    startMs: start,
    createdMs: r.created_at,
    canPatientManage: r.status === "confirmada" && start - now >= cutoffHours * 3600_000,
    cutoffHours,
    isPast: start < now,
  };
}

export function getAppointmentByToken(token: string): AppointmentView | null {
  const row = getDb().prepare("SELECT * FROM appointments WHERE token = ?").get(token) as
    | AppointmentRow
    | undefined;
  return row ? rowToView(row) : null;
}

/** Lista para el panel (5.10): desde 14 días atrás hacia el futuro, máx. 300. */
export function listAppointments(): AppointmentView[] {
  const from = addDaysIso(-14);
  const rows = getDb()
    .prepare(
      `SELECT * FROM appointments WHERE date >= ? ORDER BY date ASC, hour ASC LIMIT 300`,
    )
    .all(from) as unknown as AppointmentRow[];
  return rows.map((r) => rowToView({ ...r }));
}

/** Citas futuras confirmadas (para el dashboard). */
export function countUpcoming(): number {
  const today = isoLocal(new Date());
  const rows = getDb()
    .prepare(`SELECT date, hour FROM appointments WHERE status = 'confirmada' AND date >= ?`)
    .all(today) as unknown as Array<{ date: string; hour: number }>;
  const now = Date.now();
  return rows.filter((r) => startMs(r.date, r.hour) >= now).length;
}

/** Cron demo de notificaciones: las vencidas pendientes (las marca el script, no este módulo). */
export function dueNotifications(limit = 100): Array<{ id: number; kind: string; toEmail: string; dueAt: number; detail: string }> {
  const rows = getDb()
    .prepare(
      `SELECT id, kind, to_email, due_at, detail FROM notifications
       WHERE sent_at IS NULL AND due_at <= ? ORDER BY due_at ASC LIMIT ?`,
    )
    .all(Date.now(), limit) as unknown as Array<{
    id: number;
    kind: string;
    to_email: string;
    due_at: number;
    detail: string;
  }>;
  return rows.map((r) => ({ id: r.id, kind: r.kind, toEmail: r.to_email, dueAt: r.due_at, detail: r.detail }));
}

export function markNotificationSent(id: number, provider: string): void {
  getDb().prepare("UPDATE notifications SET sent_at = ?, provider = ? WHERE id = ?").run(Date.now(), provider, id);
}
