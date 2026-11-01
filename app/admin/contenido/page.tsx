import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canEditContent } from "@/lib/rbac";
import {
  getArticlesAll,
  getCoursesAll,
  getFreeResourcesAll,
  getServicesAll,
} from "@/lib/content";
import { asString } from "@/lib/utils";
import { Icon } from "@/components/ui";
import { ContentHub } from "@/components/admin/ContentHub";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contenido",
  description: "Artículos, recursos, servicios y cursos.",
};

/**
 * Hub de contenido (R3-C, 8.07/8.08): una sola pantalla con pestañas
 * para las cuatro colecciones. Deep-link: `?tab=<pestaña>&edit=<slug>`
 * abre el formulario de un elemento concreto (lo usan los enlaces de
 * "editar" del resto del panel).
 */
export default async function ContenidoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile) {
    redirect("/admin/login");
  }
  const sp = await searchParams;

  // Artículos y recursos: admin y terapeuta. Borrar/restaurar: solo admin.
  if (!canEditContent(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-(--radius-card) border border-terracotta/40 bg-terracotta/10 px-5 py-4 text-sm text-ink">
        <div className="flex items-start gap-3">
          <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-terracotta-dark" />
          <p>
            Tu rol no tiene permisos de edición de contenido. El administrador puede
            habilitarte desde la gestión de usuarios (Fase 4).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Contenido</h1>
        <p className="mt-1.5 text-ink-soft">
          Crea y edita artículos, recursos gratuitos, servicios y cursos. Los borradores y
          programados no se ven en público; usa «Ver» para revisarlos con tu sesión.
        </p>
      </div>
      <ContentHub
        articles={getArticlesAll()}
        resources={getFreeResourcesAll()}
        services={getServicesAll()}
        courses={getCoursesAll()}
        isAdmin={profile.role === "admin"}
        initialTab={asString(sp.tab) || undefined}
        initialEdit={asString(sp.edit) || undefined}
      />
    </div>
  );
}
