import { NextResponse } from "next/server";
import { getShortLink } from "@/lib/content";
import { siteUrl } from "@/lib/utils";

// TODO: cuando el dominio real esté en producción, fijar SITE_BASE_URL
// (o usar el hostname del request en lugar del default).
const BASE = siteUrl();

export const dynamic = "force-dynamic";

/**
 * Enlaces cortos (7.01): /c/<slug> redirige 301 al destino registrado
 * en `short_links`. Los destinos internos se convierten a URL absoluta
 * con `BASE`; los externos (http/https) se usan tal cual.
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
  const target = link.target.startsWith("http") ? link.target : `${BASE}${link.target}`;
  return NextResponse.redirect(target, 301);
}
