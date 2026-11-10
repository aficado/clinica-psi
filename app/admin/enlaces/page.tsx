import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canAdmin } from "@/lib/rbac";
import { getLinkItems, getShortLinks } from "@/lib/content";
import { siteUrl } from "@/lib/utils";
import { Icon } from "@/components/ui";
import { LinksManager } from "@/components/admin/LinksManager";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enlaces",
  description: "Botones del enlace único y enlaces cortos.",
};

/**
 * Módulo de enlaces (7.01 / 7.03): botones de `/links` y enlaces cortos
 * `/c/<slug>` con su QR. Solo administrador.
 */
export default async function EnlacesPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile) {
    redirect("/admin/login");
  }
  if (!canAdmin(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-(--radius-card) border border-terracotta/40 bg-terracotta/10 px-5 py-4 text-sm text-ink">
        <div className="flex items-start gap-3">
          <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-terracotta-dark" />
          <p>Solo el administrador puede gestionar los enlaces del sitio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Enlaces</h1>
        <p className="mt-1.5 text-ink-soft">
          Ordena los botones de la página de enlace único y crea enlaces cortos con QR para
          carteles, tarjetas y redes sociales.
        </p>
      </div>
      <LinksManager
        linkItems={getLinkItems(true)}
        shortLinks={getShortLinks()}
        siteBase={await baseUrl()}
      />
    </div>
  );
}

/**
 * Base absoluta para los enlaces cortos y sus QR.
 * - Si hay `SITE_BASE_URL` (dominio público en producción), manda esa.
 * - Si no, usa el host REAL de la petición (LAN, localhost o el dominio donde
 *   se abrió el panel): así el QR abre el sitio donde está sirviendo y no un
 *   dominio de ejemplo que no resuelve.
 */
async function baseUrl(): Promise<string> {
  const env = process.env.SITE_BASE_URL?.replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return siteUrl();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
