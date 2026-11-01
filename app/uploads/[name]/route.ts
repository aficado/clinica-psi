// ============================================================
// SERVIDOR DE SUBIDAS — /uploads/<archivo> (R3-B, 8.06)
//
// `next start` sirve `public/` desde la COPIA DEL BUILD: los archivos
// subidos desde el panel DESPUÉS de compilar darían 404 si dependieran
// del snapshot. Esta ruta los lee del disco en cada request (la URL
// pública `/uploads/...` no cambia; si el build ya incluía el archivo,
// gana el snapshot y esto ni se ejecuta).
// ============================================================

import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { NextResponse } from "next/server";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const safe = decodeURIComponent(name);
  // Nombres generados por `saveUploadedFile`: solo [A-Za-z0-9._-];
  // esta guarda bloquea cualquier recorrido de ruta (path traversal).
  if (!/^[A-Za-z0-9._-]+$/.test(safe)) {
    return new NextResponse("Enlace no encontrado", { status: 404 });
  }
  let buf: Buffer;
  try {
    buf = readFileSync(join(process.cwd(), "public", "uploads", safe));
  } catch {
    return new NextResponse("Enlace no encontrado", { status: 404 });
  }
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": TYPES[extname(safe).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
