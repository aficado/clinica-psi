import { NextResponse } from "next/server";
import { getShortLink } from "@/lib/content";

export const dynamic = "force-dynamic";

/**
 * Enlaces cortos (7.01): /c/<slug> redirige 301 al destino registrado
 * en `short_links`. Desde R4-B-ADMIN-5 el destino se guarda como URL
 * completa; los destinos antiguos internos (`/ruta`) se completan con el
 * origen REAL de la petición (antes se usaba el dominio de ejemplo y
 * morían en la LAN).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const link = getShortLink(slug);
  if (!link) {
    return new NextResponse("Enlace no encontrado", { status: 404 });
  }
  const origin = new URL(_req.url).origin;
  const target = /^https?:\/\//i.test(link.target) ? link.target : `${origin}${link.target}`;
  return NextResponse.redirect(target, 301);
}
