import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Cache del demo (Fase 0–2): los documentos HTML no se deben cachear en
 * navegador ni CDNs mientras se desarrolla. Los assets con hash
 * (/_next/*) conservan el comportamiento default de Next.js (inmutables).
 *
 * Nota: el panel admin (R3) usa almacenamiento experimental (memoria /
 * localStorage) para pruebas rápidas, sin base de datos real, por lo que
 * NO requiere renovación de sesión por cookie aquí.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Assets construidos con hash: comportamiento immutable de Next.js.
  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Medios subidos por el admin (R3-B, 8.06): assets estáticos que sí
  // pueden cachearse (no son documentos HTML).
  if (pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }

  // Documentos demo: no cachear en navegador ni CDNs en desarrollo.
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}
