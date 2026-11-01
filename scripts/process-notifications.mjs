#!/usr/bin/env node
// ============================================================
// COLA DE NOTIFICACIONES — R4-A (5.06/5.08)
//
// Procesa las filas vencidas de `notifications` (confirmación de
// cita, recordatorio, cancelación). En esta fase la entrega es
// STUB: la fila se marca como enviada con provider='stub' y queda
// el registro. La entrega REAL espera credenciales del dueño.
// TODO (R4-D): conectar Resend (RESEND_API_KEY + remitente verificado):
//   await fetch("https://api.resend.com/emails", { method: "POST", ... })
//
// Uso: node scripts/process-notifications.mjs
// Programación (cron): cada 10-15 min una vez que exista proveedor.
// TODO (5.08): cron real del servidor (Vercel cron / systemd timer).
// ============================================================

import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

const path = process.env.LOCAL_DB_PATH ?? join(process.cwd(), "data", "clinica-bienestar.db");
const db = new DatabaseSync(path);

const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'`)
  .get();
if (!tables) {
  console.error("No existe la tabla `notifications`. Arranca la app una vez (crea y siembra la BD) y reintenta.");
  process.exit(1);
}

const due = db
  .prepare(
    `SELECT id, kind, to_email, due_at, detail FROM notifications
     WHERE sent_at IS NULL AND due_at <= ? ORDER BY due_at ASC LIMIT 200`,
  )
  .all(Date.now());

if (due.length === 0) {
  console.log("notifications: sin vencidas pendientes.");
  process.exit(0);
}

const hasResend = Boolean(process.env.RESEND_API_KEY);
if (hasResend) {
  // Credenciales hay, remitente todavía no: NO marcamos nada como enviado.
  console.error(
    `notifications: ${due.length} vencidas — TODO (R4-D): falta implementar el envío con Resend (este script aún no llama la API). Nada marcado como enviado.`,
  );
  process.exit(2);
}

const mark = db.prepare(`UPDATE notifications SET sent_at = ?, provider = 'stub' WHERE id = ?`);
for (const n of due) {
  mark.run(Date.now(), n.id);
  console.log(`stub: #${n.id} ${n.kind} → ${n.to_email}${n.detail ? ` (${n.detail})` : ""}`);
}
console.log(`notifications: ${due.length} procesadas (stub — TODO Resend).`);
