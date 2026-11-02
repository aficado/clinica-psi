// ============================================================
// BASE DE DATOS LOCAL — R3-B (8.05/8.06)
//
// Capa de datos contra una base de datos local REAL.
//
// Decisión (documentada): el proyecto no tenía ORM ni driver de base
// de datos. Para R3-B se elige la opción más ligera posible y sin
// dependencias nuevas: `node:sqlite` (SQLite integrado en Node 22).
// La base vive en un archivo local (`data/clinica-bienestar.db`) y se
// crea con el esquema más simple (dos tablas reales: `theme_tokens`
// y `media_assets`). Sin variables de entorno adicionales.
//
// SOLO servidor. `node:sqlite` no existe en el navegador, así que
// este módulo NO debe importarse desde componentes de cliente.
// ============================================================

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/** Rutas y tipos de la base de datos local (R3-B). */
export interface ThemeTokenRow {
  id: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  text_soft_color: string;
  font_display: string;
  font_sans: string;
  hero_image_id: string | null;
  updated_at: number;
}

export type MediaKind = "image" | "video";
export type MediaSource = "upload" | "youtube" | "vimeo";

export interface MediaAssetRow {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: MediaKind;
  source: MediaSource;
  file_path: string | null;
  file_url: string;
  video_provider: string | null;
  video_id: string | null;
  thumbnail_url: string | null;
  references: string; // JSON: array de claves de referencia
  created_at: number;
  updated_at: number;
}

/**
 * Ruta del archivo de la base de datos local. Se resuelve respecto a la
 * raíz del proyecto (`process.cwd()`), no respecto a este archivo. Se
 * usa `process.cwd()` en vez de una ruta relativa estática porque
 * Next.js/webpack intentaría "empaquetar" un archivo `.db` y fallaría
 * al construir. Se puede sobrescribir con `LOCAL_DB_PATH`.
 */
function dbPath(): string {
  return process.env.LOCAL_DB_PATH ?? join(process.cwd(), "data", "clinica-bienestar.db");
}

let db: DatabaseSync | null = null;

/**
 * Abre (una sola vez) la base de datos local y asegura el esquema.
 * Llama `initDb()` al inicio de toda operación del servidor.
 */
/**
 * Abre (una sola vez) la base de datos local y asegura el esquema.
 * Llama `getDb()` al inicio de toda operación del servidor.
 */
export function getDb(): DatabaseSync {
  if (db) return db;

  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });

  db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  ensureSchema(db);
  return db;
}

/** Crea las tablas reales si no existen y siembra el tema por defecto. */
function ensureSchema(conn: DatabaseSync): void {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS theme_tokens (
      id              TEXT PRIMARY KEY,
      primary_color   TEXT NOT NULL,
      accent_color    TEXT NOT NULL,
      background_color TEXT NOT NULL,
      text_color      TEXT NOT NULL,
      text_soft_color TEXT NOT NULL,
      font_display    TEXT NOT NULL,
      font_sans       TEXT NOT NULL,
      hero_image_id   TEXT,
      updated_at      INTEGER NOT NULL
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      mime           TEXT NOT NULL,
      size           INTEGER NOT NULL,
      kind           TEXT NOT NULL,
      source         TEXT NOT NULL,
      file_path      TEXT,
      file_url       TEXT NOT NULL,
      video_provider TEXT,
      video_id       TEXT,
      thumbnail_url  TEXT,
      "references"   TEXT NOT NULL DEFAULT '[]',
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL
    );
  `);

  // ---- Tablas de contenido (R3-C / R3-D) ----
  // Una tabla por tipo de contenido. El `slug` es clave primaria SOLO
  // dentro de cada tabla (aprende y gratis pueden compartir el mismo
  // slug). Los campos escalares viven en columnas (filas/CTA/metadata);
  // el contenido anidado (secciones, FAQ, beneficios, etc.) vive en la
  // columna `content` como JSON. `deleted_at` habilita el borrado
  // blando + "Deshacer" (R3-D, 8.13).
  conn.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      slug         TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      category     TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'publicado',
      scheduled_at INTEGER,
      author       TEXT NOT NULL,
      date         TEXT NOT NULL,
      excerpt      TEXT NOT NULL,
      content      TEXT NOT NULL DEFAULT '{}',
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      deleted_at   INTEGER
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS free_resources (
      slug         TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      category     TEXT NOT NULL,
      minutes      INTEGER NOT NULL,
      level        TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'publicado',
      scheduled_at INTEGER,
      description  TEXT NOT NULL,
      content      TEXT NOT NULL DEFAULT '{}',
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      deleted_at   INTEGER
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS services (
      slug         TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      category     TEXT NOT NULL,
      duration     INTEGER NOT NULL,
      buffer       INTEGER NOT NULL,
      position     INTEGER NOT NULL DEFAULT 0,
      visible      INTEGER NOT NULL DEFAULT 1,
      description  TEXT NOT NULL,
      content      TEXT NOT NULL DEFAULT '{}',
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      deleted_at   INTEGER
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      slug         TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      theme        TEXT NOT NULL,
      modality     TEXT NOT NULL,
      weeks        INTEGER NOT NULL,
      schedule     TEXT NOT NULL,
      position     INTEGER NOT NULL DEFAULT 0,
      visible      INTEGER NOT NULL DEFAULT 1,
      content      TEXT NOT NULL DEFAULT '{}',
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      deleted_at   INTEGER
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS short_links (
      slug       TEXT PRIMARY KEY,
      target     TEXT NOT NULL,
      label      TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS link_items (
      id         TEXT PRIMARY KEY,
      label      TEXT NOT NULL,
      href       TEXT NOT NULL,
      is_primary INTEGER NOT NULL DEFAULT 0,
      position   INTEGER NOT NULL DEFAULT 0,
      visible    INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS nav_items (
      id         TEXT PRIMARY KEY,
      label      TEXT NOT NULL,
      href       TEXT NOT NULL,
      position   INTEGER NOT NULL DEFAULT 0,
      visible    INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      context    TEXT NOT NULL DEFAULT '',
      text       TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'pendiente',
      consent    INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_email TEXT NOT NULL,
      actor_role  TEXT NOT NULL,
      action      TEXT NOT NULL,
      entity      TEXT NOT NULL,
      entity_id   TEXT,
      detail      TEXT,
      created_at  INTEGER NOT NULL
    );
  `);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id         TEXT PRIMARY KEY,
      instagram  TEXT NOT NULL DEFAULT '',
      facebook   TEXT NOT NULL DEFAULT '',
      map_type   TEXT NOT NULL DEFAULT '',
      map_query  TEXT NOT NULL DEFAULT '',
      map_url    TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );
  `);

  // ---- Agenda real (R4-A: 5.01–5.05, 5.07, 5.10 parciales) ----
  // Decisión: misma capa SQLite de R3; la migración a Supabase + RLS
  // espera el despliegue (TODO). `ux_appt_slot` es la garantía dura
  // anti-doble-reserva (5.04): un profesional no puede tener dos citas
  // `confirmada` en el mismo día y hora, aunque dos procesos escriban
  // a la vez. Los cancelados liberan el slot porque el índice es parcial.
  conn.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      token         TEXT NOT NULL UNIQUE,
      service_slug  TEXT NOT NULL,
      pro_id        TEXT NOT NULL,
      modality      TEXT NOT NULL,
      date          TEXT NOT NULL,
      hour          INTEGER NOT NULL,
      duration      INTEGER NOT NULL,
      patient_name  TEXT NOT NULL,
      patient_phone TEXT NOT NULL DEFAULT '',
      patient_email TEXT NOT NULL DEFAULT '',
      note          TEXT NOT NULL DEFAULT '',
      consent       INTEGER NOT NULL DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'confirmada',
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL,
      cancelled_at  INTEGER
    );
  `);
  conn.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_appt_slot
      ON appointments(pro_id, date, hour) WHERE status = 'confirmada';
  `);

  // Horario por profesional y día de la semana (5.02 simplificado:
  // una regla por (pro, día) con franja abierta/cerrada; bloqueos y
  // excepciones por fecha: TODO R4-B).
  conn.exec(`
    CREATE TABLE IF NOT EXISTS availability_rules (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      pro_id     TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      open_hour  INTEGER NOT NULL,
      close_hour INTEGER NOT NULL,
      active     INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  conn.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_rule_pro_day
      ON availability_rules(pro_id, day_of_week);
  `);

  // Cola de correos (5.06/5.08): la entrega real espera credenciales
  // de Resend (TODO); `scripts/process-notifications.mjs` marca los
  // vencidos como enviados por el proveedor actual ('stub').
  conn.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      kind           TEXT NOT NULL,
      to_email       TEXT NOT NULL,
      due_at         INTEGER NOT NULL,
      sent_at        INTEGER,
      provider       TEXT NOT NULL DEFAULT 'stub',
      detail         TEXT NOT NULL DEFAULT ''
    );
  `);

  // Profesionales de la agenda (R4-B-1/R4-B-2: 5.03/5.10). La tabla guarda la
  // IDENTIDAD (perfil) del profesional: los horarios que usa el motor siguen
  // viniendo de `availability_rules` (última palabra) — guardar los días y
  // horas aquí en columnas permite sembrar reglas nuevas al dar de alta un
  // profesional desde el panel, y que siempre queden coherentes.
  conn.exec(`
    CREATE TABLE IF NOT EXISTS professionals (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT '',
      services_json TEXT NOT NULL DEFAULT '[]',
      days_json     TEXT NOT NULL DEFAULT '[]',
      open_hour     INTEGER NOT NULL DEFAULT 9,
      close_hour    INTEGER NOT NULL DEFAULT 17,
      sat_open      INTEGER,
      sat_close     INTEGER,
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL,
      deleted_at    INTEGER
    );
  `);

  // 5.07 (D4 pendiente de decisión del dueño): anticipación mínima para
  // cancelar/reprogramar desde `/mi-cita`, configurable. Default 24 h.
  const agendaSiteCols = conn
    .prepare("PRAGMA table_info(site_settings)")
    .all() as Array<{ name: string }>;
  if (!agendaSiteCols.some((c) => c.name === "cancel_cutoff_hours")) {
    conn.exec(
      "ALTER TABLE site_settings ADD COLUMN cancel_cutoff_hours INTEGER NOT NULL DEFAULT 24;",
    );
  }

  // 8.13: `media_assets` gana borrado blando. `ALTER TABLE ADD COLUMN`
  // falla si la columna ya existe, así se comprueba antes.
  const mediaCols = conn
    .prepare("PRAGMA table_info(media_assets)")
    .all() as Array<{ name: string }>;
  if (!mediaCols.some((c) => c.name === "deleted_at")) {
    conn.exec("ALTER TABLE media_assets ADD COLUMN deleted_at INTEGER;");
  }

  // 8.15 (R3-E): `site_settings` gana el mapa editable (tipo + consulta +
  // URL). Mismo patrón: comprobar columnas antes de ALTER (BD ya creadas).
  const siteCols = conn
    .prepare("PRAGMA table_info(site_settings)")
    .all() as Array<{ name: string }>;
  for (const col of ["map_type", "map_query", "map_url"]) {
    if (!siteCols.some((c) => c.name === col)) {
      conn.exec(`ALTER TABLE site_settings ADD COLUMN ${col} TEXT NOT NULL DEFAULT '';`);
    }
  }

  // Siembra el tema por defecto (paleta + tipografías curadas) si no
  // hay fila. Una sola fila con id 'current' para todo el sitio.
  const exists = conn
    .prepare("SELECT 1 FROM theme_tokens WHERE id = 'current' LIMIT 1")
    .get() as { 1: unknown } | undefined;
  if (!exists) {
    conn
      .prepare(
        `INSERT INTO theme_tokens (
           id, primary_color, accent_color, background_color,
           text_color, text_soft_color, font_display, font_sans,
           hero_image_id, updated_at
         ) VALUES (
           'current', ?, ?, ?, ?, ?, ?, ?, NULL, ?
         )`,
      )
      .run(
        "#3f5e52", // primario
        "#c97b5a", // acento / CTA
        "#f5efe6", // fondo
        "#1f2a27", // texto
        "#4c5b55", // texto secundario
        "Fraunces", // display
        "Inter", // cuerpo
        Date.now(),
      );
  }
}

/** Libera la conexión (útil en pruebas). En producción se mantiene viva. */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
