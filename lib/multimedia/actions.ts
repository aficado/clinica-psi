// ============================================================
// SERVER ACTIONS — Multimedia (R3-B, 8.06)
//
// Enlazar videos (YouTube/Vimeo) y eliminar medios. La subida de
// imágenes va por el ruteador `POST /api/media/upload` (barra de
// progreso). Todo contra la base de datos local.
//
// Control por rol (RBAC): solo el rol Administrador puede enlazar o
// eliminar medios. La validación es en el servidor (la defensa fuerte);
// `RoleGuard` también oculta los controles en la UI.
// ============================================================

"use server";

import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import type { Profile } from "@/lib/admin/store";
import { logAudit } from "@/lib/audit";
import { canManageMedia } from "@/lib/rbac";
import {
  createMediaAsset,
  deleteMediaAsset,
  getMediaAsset,
  listMediaAssets,
  mediaToView,
  restoreMediaAsset,
  validateVideoUrl,
} from "@/lib/media";
import type { MediaAssetRow } from "@/lib/db";

const SESSION_COOKIE = "rv_admin_session";

/** Verifica que hay sesión de Administrador; si no, devuelve el error. */
async function requireAdmin(): Promise<{ error?: string; profile?: Profile }> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile) {
    return { error: "Inicia sesión para gestionar medios." };
  }
  if (!canManageMedia(profile.role)) {
    return { error: "Solo el administrador puede gestionar medios." };
  }
  return { profile };
}

/**
 * Enaza un video de YouTube/Vimeo. Devuelve `{ error }` o `{ ok, asset }`.
 * Valida la URL (solo YouTube/Vimeo) en el servidor.
 */
export async function addVideo(url: string): Promise<{ error?: string; asset?: MediaAssetRow }> {
  const guard = await requireAdmin();
  if (guard.error || !guard.profile) {
    return { error: guard.error ?? "Solo el administrador puede enlazar videos." };
  }
  const validated = validateVideoUrl(url);
  if (!validated.ok || !validated.embedUrl || !validated.videoId || !validated.source) {
    return { error: validated.error ?? "Ese enlace no es un video de YouTube o Vimeo." };
  }
  const asset = createMediaAsset({
    name: `Video ${validated.provider} (${validated.videoId})`,
    mime: `video/${validated.provider}`,
    size: 0, // sin tamaño: es un enlace, no un archivo
    kind: "video",
    source: validated.source,
    file_path: null,
    file_url: validated.embedUrl,
    video_provider: validated.provider,
    video_id: validated.videoId,
    thumbnail_url: null,
    references: "[]",
  });
  logAudit(guard.profile, "medio.video", "medio", asset.id, `video=${validated.videoId}`);
  return { asset };
}

/**
 * Elimina un medio (borrado blando, 8.13). Si está referenciado, NO lo
 * elimina y devuelve las referencias para avisar al usuario. Se puede
 * revertir con `restoreMedia` ("Deshacer" en la UI).
 */
export async function removeMedia(id: string): Promise<{ error?: string; deleted?: boolean; references?: string[] }> {
  const guard = await requireAdmin();
  if (guard.error || !guard.profile) {
    return { error: guard.error ?? "Solo el administrador puede eliminar medios." };
  }
  if (!getMediaAsset(id)) {
    return { error: "Ese medio no existe." };
  }
  const result = deleteMediaAsset(id);
  if (!result.deleted) {
    return { error: result.error, references: result.references };
  }
  logAudit(guard.profile, "medio.eliminar", "medio", id);
  return { deleted: true };
}

/** Restaura un medio eliminado hace poco (botón "Deshacer", 8.13). */
export async function restoreMedia(id: string): Promise<{ error?: string; restored?: boolean }> {
  const guard = await requireAdmin();
  if (guard.error || !guard.profile) {
    return { error: guard.error ?? "Solo el administrador puede gestionar medios." };
  }
  if (!restoreMediaAsset(id)) {
    return { error: "Ese medio ya no se puede restaurar." };
  }
  logAudit(guard.profile, "medio.restaurar", "medio", id);
  return { restored: true };
}

/** Lista los medios (para la UI). */
export async function listMedia(): Promise<ReturnType<typeof mediaToView>[]> {
  return listMediaAssets().map(mediaToView);
}
