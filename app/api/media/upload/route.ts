// ============================================================
// SUBIDA DE MEDIOS — R3-B (8.06)
//
// Endpoint para subir imágenes con barra de progreso. El cliente
// sube vía XMLHttpRequest (para escuchar el progreso de subida) y este
// ruteador guarda el archivo en `public/uploads/` y devuelve la URL
// pública y el registro creado.
//
// El resto de mutaciones (enlazar video, eliminar) siguen siendo server
// actions en `lib/multimedia/actions.ts`, como el resto del panel.
//
// Control por rol (RBAC): solo el rol Administrador puede subir.
// ============================================================

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { logAudit } from "@/lib/audit";
import { canManageMedia } from "@/lib/rbac";
import {
  ALLOWED_IMAGE_MIME,
  MAX_UPLOAD_BYTES,
  createMediaAsset,
  ensureUploadDir,
  saveUploadedFile,
} from "@/lib/media";

const SESSION_COOKIE = "rv_admin_session";

/** POST /api/media/upload — guarda una imagen subida. */
export async function POST(request: Request) {
  // RBAC: solo el Administrador puede subir medios.
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile || !canManageMedia(profile.role)) {
    return NextResponse.json({ error: "No tienes permisos para subir medios." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "El archivo no se envió correctamente. Sube de nuevo." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || !file.name) {
    return NextResponse.json(
      { error: "No se pudo leer el archivo. Prueba con una imagen (JPEG, PNG, WEBP, GIF o SVG)." },
      { status: 400 },
    );
  }

  const mime = file.type || mimeFromName(file.name);
  if (!ALLOWED_IMAGE_MIME.includes(mime)) {
    return NextResponse.json(
      { error: "Ese tipo de archivo no es válido. Sube una imagen (JPEG, PNG, WEBP, GIF o SVG)." },
      { status: 415 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `El archivo pesa demasiado (máximo 5 MB). Prueba con una imagen más pequeña.` },
      { status: 413 },
    );
  }

  ensureUploadDir();
  const url = await saveUploadedFile(file, crypto.randomUUID());
  const asset = createMediaAsset({
    name: file.name,
    mime,
    size: file.size,
    kind: "image",
    source: "upload",
    file_path: null, // se resuelve como URL pública (ver `url`)
    file_url: url,
    video_provider: null,
    video_id: null,
    thumbnail_url: null,
    references: "[]",
  });
  logAudit(profile, "medio.subir", "medio", asset.id, url);

  return NextResponse.json({
    id: asset.id,
    url,
    name: asset.name,
    mime,
    size: asset.size,
  });
}

/** Deduce el MIME del nombre si el navegador no lo envía. */
function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}
