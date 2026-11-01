// ============================================================
// MEDIA (PURAS) — R3-B (8.06)
//
// Funciones PURAS de medios: validación de URLs/subidas, constantes
// y la función de conversión a vista. NO dependen de la base de
// datos ni del sistema de archivos, así que ES SEGURO importarlas
// desde componentes de cliente (Next.js/webpack no intenta
// empaquetar `node:sqlite`/`node:fs`).
//
// Las operaciones contra la base de datos y el disco viven en
// `lib/media.ts` (solo servidor).
// ============================================================

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

/** Convierte un medio a un mapa para renderizar (URL + metadata limpia). */
export function mediaToView(
  asset: MediaAssetRow,
  references: string[] = [],
): {
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
    references,
    createdAt: asset.created_at,
  };
}
