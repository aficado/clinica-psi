import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canEditContent } from "@/lib/rbac";
import { getServicesAll } from "@/lib/content";
import { Icon } from "@/components/ui";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servicios de la agenda",
  description: "Servicios que se pueden agendar: duración, buffer y modalidades.",
};

const modLabel = (m: string) => (m === "enlinea" ? "En línea" : "Presencial");

/**
 * Vista dedicada de los servicios de la agenda (R4-B-2, D-R4-B-2):
 * un SOLO dato — la tabla `services` de Contenido ya es la única
 * fuente (decisióndocumentada: no se duplica en una tabla aparte).
 * Aquí se listan los campos que la agenda consume (duración, buffer,
 * modalidades, visible) con enlaces profundos al editor de Contenido
 * (`/admin/contenido?tab=servicios&edit=<slug>`), que usa YA las
 * server actions con RBAC+auditoría.
 */
export default async function ServiciosPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile) {
    redirect("/admin/login");
  }
  if (!canEditContent(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-(--radius-card) border border-terracotta/40 bg-terracotta/10 px-5 py-4 text-sm text-ink">
        <div className="flex items-start gap-3">
          <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-terracotta-dark" />
          <p>Tu rol no puede administrar los servicios del catálogo.</p>
        </div>
      </div>
    );
  }

  const services = getServicesAll();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Servicios de la agenda</h1>
          <p className="mt-1.5 text-ink-soft">
            Duración, tiempo entre citas y modalidades de lo que la gente agenda en
            `/agendar`. La edición completa (nombre, descripción, FAQ) vive en
            Contenido.
          </p>
        </div>
        <Link
          href="/admin/contenido?tab=servicios"
          className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) border-2 border-sage/40 px-4 py-2.5 font-semibold text-sage no-underline hover:border-sage hover:bg-sage/10"
        >
          <Icon name="arrow" className="h-4 w-4" />
          Nuevo servicio
        </Link>
      </div>

      <div className="space-y-3">
        {services.map((s) => (
          <div
            key={s.slug}
            className="rounded-(--radius-card) border border-ink/10 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  {s.name}
                  <span className="rounded bg-mist px-2 py-0.5 text-xs font-normal text-ink-soft">
                    {s.category}
                  </span>
                  {!s.visible ? (
                    <span className="rounded bg-mist px-2 py-0.5 text-xs font-normal text-ink-soft">
                      oculto
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {s.duration} min por sesión · {s.buffer} min de buffer entre sesiones ·{" "}
                  {s.modalities.map(modLabel).join(" · ")}
                </p>
                <p className="mt-0.5 font-mono text-xs text-ink-soft">{s.slug}</p>
              </div>
              <Link
                href={`/admin/contenido?tab=servicios&edit=${s.slug}`}
                className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) border-2 border-sage/40 px-4 py-2.5 text-sm font-semibold text-sage no-underline hover:border-sage hover:bg-sage/10"
              >
                Editar en Contenido
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
