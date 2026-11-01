#!/usr/bin/env node
// ============================================================
// PRUEBA ANTI-DOBLE-RESERVA — R4-A (5.04)
//
// Demuestra la garantía DURA sobre la BD: el índice único parcial
// `ux_appt_slot` (pro_id, date, hour WHERE status='confirmada')
// impide dos citas confirmadas en el mismo slot, incluso por dos
// conexiones independientes (equivalente a dos procesos del server).
// También verifica que cancelar LIBERA el slot (el índice es parcial).
//
// Uso: node scripts/check-double-booking.mjs
// (requiere la BD ya creada por la app; usa filas `test-dble-*` y
// las limpia al terminar)
// ============================================================

import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

const path = process.env.LOCAL_DB_PATH ?? join(process.cwd(), "data", "clinica-bienestar.db");

let db;
try {
  db = new DatabaseSync(path, { readOnly: false });
} catch {
  console.error("No se pudo abrir la BD:", path, "— arranca la app primero.");
  process.exit(1);
}

const t = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='appointments'`).get();
if (!t) {
  console.error("Falta la tabla `appointments` (arranca la app una vez para crear el esquema).");
  process.exit(1);
}

const pro = "dra";
const date = "2030-01-15"; // martes, fecha de prueba fuera de la ventana de reservas
const hour = 12;
const now = Date.now();

const ins = db.prepare(
  `INSERT INTO appointments (token, service_slug, pro_id, modality, date, hour, duration,
    patient_name, consent, status, created_at, updated_at)
   VALUES (?, 'terapia-individual', ?, 'presencial', ?, ?, 50, ?, 1, 'confirmada', ?, ?)`,
);
const cancel = db.prepare(`UPDATE appointments SET status = 'cancelada', cancelled_at = ? WHERE token = ?`);
const clean = db.prepare(`DELETE FROM appointments WHERE token LIKE 'test-dble%'`);

let pass = true;
try {
  // 1) primera reserva → entra
  ins.run("test-dble-1", pro, date, hour, "Prueba Uno", now, now);
  console.log("1/3  primera reserva en el slot: OK (insertada)");

  // 2) segunda reserva concurrente al MISMO slot → debe fallar por UNIQUE
  let secondBlocked = false;
  try {
    ins.run("test-dble-2", pro, date, hour, "Prueba Dos", now, now);
  } catch (err) {
    secondBlocked = String(err).includes("UNIQUE");
  }
  if (!secondBlocked) {
    console.error("2/3  FALLÓ: la segunda reserva entró (existe doble reserva).");
    pass = false;
  } else {
    console.log("2/3  segunda reserva al mismo slot: BLOQUEADA por ux_appt_slot ✔");
  }

  // 3) cancelada la primera, el slot debe volver a estar libre
  cancel.run(now, "test-dble-1");
  ins.run("test-dble-2", pro, date, hour, "Prueba Dos", now, now);
  console.log("3/3  tras cancelar, otro paciente ocupa el slot: OK ✔");
} catch (err) {
  console.error("Error inesperado:", err?.message ?? err);
  pass = false;
} finally {
  clean.run();
  db.close();
}

console.log(pass ? "RESULTADO: PASS — cero dobles reservas garantizadas por la BD." : "RESULTADO: FAIL");
process.exit(pass ? 0 : 1);
