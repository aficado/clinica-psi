import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canAdmin } from "@/lib/rbac";
import { getNavItems, getSiteSettings } from "@/lib/content";
import { Icon } from "@/components/ui";
import { MenuManager } from "@/components/admin/MenuManager";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menú y redes",
  description: "Elementos del menú y perfiles de redes sociales.",
};

/** Módulo de menú y redes (8.11). Solo administrador. */
export default async function MenuPage() {
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
          <p>Solo el administrador puede editar el menú y las redes sociales.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Menú, redes y mapa</h1>
        <p className="mt-1.5 text-ink-soft">
          Decide qué enlaces ve la gente en el encabezado y el pie del sitio, dónde te encuentran
          en redes sociales y qué mapa se muestra en la home y en Contacto.
        </p>
      </div>
      <MenuManager navItems={getNavItems(true)} settings={getSiteSettings()} />
    </div>
  );
}
