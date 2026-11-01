// ============================================================
// MEDIA_ASSETS — R3-B (8.06)
//
// CRUD de medios (imágenes subidas + videos YouTube/Vimeo) contra la
// base de datos local (`media_assets`).
//
// - Las imágenes subidas se guardan en `public/uploads/` y se sirven
//   desde `/uploads/<archivo>`, así que el resto del sitio puede
//   referenciarlas por URL.
// - Los videos se guardan por ID de activo (no por URL cruda): al
//   reemplazar un medio, las referencias existentes se conservan.
// - Las referencias viven en la columna `references` (JSON) de la
//   tabla. Al eliminar, se avisa si el medio está referenciado.
//
// SOLO servidor (usa `lib/db.ts`, que depende de `node:sqlite` y
// `node:fs`). No importar desde el cliente.
// ============================================================

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import type { SQLInputValue } from "node:sqlite";
import { getDb } from "./db";
import type { MediaAssetRow, MediaKind, MediaSource } from "./db";

/** Máximo tamaño aceptado para una subida (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Imágenes permitidas. Lenguaje técnico interno; el usuario ve mensajes claros. */
export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

/** Directorio donde se guardan las subidas dentro de `public/`. */
export const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

/** Limpia el directorio de subidas si no existe. */
export function ensureUploadDir(): void {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

/** Resultado de validar una URL de video. */
export interface VideoUrlResult {
  ok: boolean;
  source: "youtube" | "vimeo" | null;
  provider: "youtube" | "vimeo" | null;
  videoId: string | null;
  embedUrl: string | null;
  error: string | null;
}

/**
 * Valida una URL de YouTube o Vimeo y extrae el ID para embeber.
 * No requiere que el video exista (solo valida el formato del enlace).
 */
export function validateVideoUrl(url: string): VideoUrlResult {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    // YouTube: youtube.com/watch?v=, /shorts/, /embed/ o youtu.be/
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (/^[A-Za-z0-9_-]{1,12}$/.test(id)) {
        return okVideo("youtube", id);
      }
    }
    if (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id && /^[A-Za-z0-9_-]{1,12}$/.test(id)) {
        return okVideo("youtube", id);
      }
      // /shorts/<id> y /embed/<id>
      const shorts = parsed.pathname.match(/\/shorts\/([A-Za-z0-9_-]{1,12})$/);
      if (shorts) return okVideo("youtube", shorts[1]);
      const embed = parsed.pathname.match(/\/embed\/([A-Za-z0-9_-]{1,12})$/);
      if (embed) return okVideo("youtube", embed[1]);
    }
    // Vimeo: vimeo.com/<id>
    if (parsed.hostname === "player.vimeo.com" || parsed.hostname === "www.vimeo.com" || parsed.hostname === "vimeo.com") {
      const id = parsed.pathname.match(/\/video\/?([0-9]{3,})$/)?.[1];
      if (id) return okVideo("vimeo", id);
    }
  } catch {
    // URL mal formada
  }
  return {
    ok: false,
    source: null,
    provider: null,
    videoId: null,
    embedUrl: null,
    error: "Ese enlace no es un video de YouTube o Vimeo. Revisa que empiece por https://",
  };
}

function okVideo(provider: "youtube" | "vimeo", videoId: string): VideoUrlResult {
  const embedUrl =
    provider === "youtube"
      ? `https://www.youtube.com/embed/${videoId}`
      : `https://player.vimeo.com/video/${videoId}`;
  return { ok: true, source: provider, provider, videoId, embedUrl, error: null };
}

/**
 * Valida una subida de imagen. Devuelve mensajes en lenguaje claro
 * (no técnico) para el usuario.
 */
export function validateUpload(input: {
  name: string;
  size: number;
  mime: string;
}): { ok: boolean; error: string | null; mime: string; size: number } {
  const { name, size, mime } = input;

  if (!name) {
    return { ok: false, error: "No se pudo leer el archivo. Intenta de nuevo.", mime: "", size: 0 };
  }
  if (!ALLOWED_IMAGE_MIME.includes(mime)) {
    return {
      ok: false,
      error: "Ese tipo de archivo no es válido. Sube una imagen (JPEG, PNG, WEBP, GIF o SVG).",
      mime,
      size,
    };
  }
  if (size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `El archivo pesa demasiado (máximo 5 MB). Prueba con una imagen más pequeña.`,
      mime,
      size,
    };
  }
  return { ok: true, error: null, mime, size };
}

/** Guarda una imagen subida en disco y devuelve su URL pública. */
export async function saveUploadedFile(
  file: { name: string; arrayBuffer: () => Promise<ArrayBuffer>; type: string },
  id: string,
): Promise<string> {
  ensureUploadDir();
  const safeName = `${id}${extname(file.name).slice(0, 8)}`.replace(/[^A-Za-z0-9._-]/g, "");
  const fileName = `rv-${id}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(join(UPLOAD_DIR, fileName), buffer);
  return `/uploads/${fileName}`;
}

/** Listar todos los medios (excluye los borrados, 8.13). */
export function listMediaAssets(): MediaAssetRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM media_assets WHERE deleted_at IS NULL ORDER BY created_at DESC")
    .all() as unknown as MediaAssetRow[];
}

/** Busca un medio por ID. */
export function getMediaAsset(id: string): MediaAssetRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM media_assets WHERE id = ?").get(id) as MediaAssetRow | undefined;
  return row ?? null;
}

/** Devuelve las claves de referencia que apuntan a este medio. */
export function findReferenced(assetId: string): string[] {
  const asset = getMediaAsset(assetId);
  if (!asset) return [];
  try {
    return JSON.parse(asset.references) as string[];
  } catch {
    return [];
  }
}

/** Crea un registro de medio (subido o video enlazado). */
export function createMediaAsset(record: Omit<MediaAssetRow, "id" | "created_at" | "updated_at">): MediaAssetRow {
  const db = getDb();
  const now = Date.now();
  const row: MediaAssetRow = {
    ...record,
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    references: record.references ?? "[]",
  };
  db.prepare(
    `INSERT INTO media_assets
       (id, name, mime, size, kind, source, file_path, file_url, video_provider, video_id, thumbnail_url, "references", created_at, updated_at)
     VALUES
       (@id, @name, @mime, @size, @kind, @source, @file_path, @file_url, @video_provider, @video_id, @thumbnail_url, @references, @created_at, @updated_at)`,
  ).run(row as unknown as Record<string, SQLInputValue>);
  return row;
}

/** Actualiza campos de un medio (p. ej. referencias al reemplazar). */
export function updateMediaAsset(
  id: string,
  patch: Partial<Pick<MediaAssetRow, "name" | "references" | "thumbnail_url" | "file_url">>,
): MediaAssetRow | null {
  const db = getDb();
  const current = db.prepare("SELECT * FROM media_assets WHERE id = ?").get(id) as MediaAssetRow | undefined;
  if (!current) return null;
  const updated = { ...current, ...patch, updated_at: Date.now() };
  db.prepare(
    `UPDATE media_assets SET
       name = @name, "references" = @references, thumbnail_url = @thumbnail_url, file_url = @file_url, updated_at = @updated_at
     WHERE id = @id`,
  ).run(updated);
  return updated;
}

/**
 * Elimina un medio. Si está referenciado, NO lo elimina y devuelve el
 * error con las claves references. Si no, lo elimina (archivo incluido).
 */
export function deleteMediaAsset(id: string): { deleted: boolean; error?: string; references: string[] } {
  const references = findReferenced(id);
  if (references.length > 0) {
    return {
      deleted: false,
      error: `Este medio está en uso en: ${references.join(", ")}. Retíralo de ahí antes de eliminarlo.`,
      references,
    };
  }
  // Borrado blando (8.13): la fila y el archivo en disco se conservan y
  // pueden restaurarse con "Deshacer" hasta que una purga futura los limpie.
  const db = getDb();
  const result = db
    .prepare("UPDATE media_assets SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL")
    .run(Date.now(), id);
  if (result.changes === 0) {
    return { deleted: false, error: "Ese medio no existe o ya fue eliminado.", references };
  }
  return { deleted: true, references };
}

/** Restaura un medio borrado (acción "Deshacer", 8.13). */
export function restoreMediaAsset(id: string): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE media_assets SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL")
    .run(id);
  return result.changes > 0;
}

/**
 * Reemplaza un medio por otro SIN romper referencias: el nuevo activo
 * hereda las mismas claves de referencia. Opcionalmente se puede
 * eliminar el antiguo si ya no tiene referencias.
 */
export function replaceMedia(
  oldId: string,
  newRecord: Omit<MediaAssetRow, "id" | "created_at" | "updated_at">,
  references: string[],
): { newId: string; oldDeleted: boolean } {
  const db = getDb();
  const oldAsset = getMediaAsset(oldId);
  // El nuevo hereda las referencias del antiguo (o las que se pasen).
  const ref = references.length > 0 ? references : oldAsset ? JSON.parse(oldAsset.references) : [];
  const newAsset = createMediaAsset({ ...newRecord, references: JSON.stringify(ref) });

  // Si el antiguo solo referenciaba este reemplazo y ahora el nuevo
  // las tiene, se puede eliminar.
  let oldDeleted = false;
  if (oldAsset && ref.length === findReferenced(oldId).length) {
    const res = deleteMediaAsset(oldId);
    oldDeleted = res.deleted;
  }
  return { newId: newAsset.id, oldDeleted };
}

/** Agrega una clave de referencia a un medio (p. ej. "hero"). */
export function assignReference(assetId: string, key: string): void {
  const asset = getMediaAsset(assetId);
  if (!asset) return;
  const refs = new Set(JSON.parse(asset.references) as string[]);
  refs.add(key);
  updateMediaAsset(assetId, { references: JSON.stringify([...refs]) });
}

/** Quita una clave de referencia de un medio. */
export function unreference(assetId: string, key: string): void {
  const asset = getMediaAsset(assetId);
  if (!asset) return;
  const refs = (JSON.parse(asset.references) as string[]).filter((r) => r !== key);
  updateMediaAsset(assetId, { references: JSON.stringify(refs) });
}

/** Convierte un medio a un mapa para renderizar (URL + metadata limpia). */
export function mediaToView(asset: MediaAssetRow): {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: MediaKind;
  source: MediaSource;
  url: string;
  videoProvider: "youtube" | "vimeo" | null;
  videoId: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  references: string[];
  createdAt: number;
} {
  return {
    id: asset.id,
    name: asset.name,
    mime: asset.mime,
    size: asset.size,
    kind: asset.kind,
    source: asset.source,
    url: asset.file_url,
    videoProvider: asset.video_provider as "youtube" | "vimeo" | null,
    videoId: asset.video_id,
    embedUrl: asset.source === "youtube" && asset.video_id
      ? `https://www.youtube.com/embed/${asset.video_id}`
      : asset.source === "vimeo" && asset.video_id
        ? `https://player.vimeo.com/video/${asset.video_id}`
        : null,
    thumbnailUrl: asset.thumbnail_url,
    references: findReferenced(asset.id),
    createdAt: asset.created_at,
  };
}
