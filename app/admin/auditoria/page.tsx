import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canAdmin } from "@/lib/rbac";
import { getAuditLogs } from "@/lib/audit";
import { getSiteTimeZone } from "@/lib/schedule";
import { asString } from "@/lib/utils";
import { Icon } from "@/components/ui";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auditoría",
  description: "Historial de cambios del panel.",
};

function formatWhen(ms: number): string {
  return new Date(ms).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    // Zona horaria configurable del sitio (R4-B-3, D-R4-4; default la de MX).
    timeZone: getSiteTimeZone(),
  });
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  therapist: "Terapeuta",
  assistant: "Asistente",
};

/**
 * Historial de auditoría (8.12): quién hizo qué y cuándo. Server-rendered
 * (las últimas 200 entradas); los filtros van por query para compartir
 * enlaces. Solo administrador.
 */
export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
          <p>Solo el administrador puede ver el historial de auditoría.</p>
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const entity = asString(sp.entidad) || undefined;
  const action = asString(sp.accion) || undefined;
  const q = asString(sp.q) || undefined;
  const logs = getAuditLogs({ entity, action, q });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Auditoría</h1>
        <p className="mt-1.5 text-ink-soft">
          Cada cambio del panel queda registrado: quién lo hizo, sobre qué elemento y cuándo.
          Se muestran las últimas {logs.length} entradas (máximo 200 por consulta).
        </p>
      </div>

      {/* Filtros (GET, para poder enlazar una vista concreta) */}
      <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-ink">Entidad</span>
          <select
            name="entidad"
            defaultValue={entity ?? ""}
            className="rounded-(--radius-input) border border-ink/15 bg-white px-3 py-2 text-ink"
          >
            <option value="">Todas</option>
            {[
              "articulo",
              "recurso",
              "servicio",
              "curso",
              "testimonial",
              "enlace",
              "enlace-corto",
              "menu",
              "sitio",
              "tema",
              "medio",
            ].map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-ink">Acción</span>
          <input
            name="accion"
            defaultValue={action ?? ""}
            placeholder="p. ej. articulo.publicar"
            className="rounded-(--radius-input) border border-ink/15 bg-white px-3 py-2 text-ink"
          />
        </label>
        <label className="block min-w-48 flex-1 text-sm">
          <span className="mb-1 block font-semibold text-ink">Buscar</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="correo, entidad o detalle…"
            className="w-full rounded-(--radius-input) border border-ink/15 bg-white px-3 py-2 text-ink"
          />
        </label>
        <button
          type="submit"
          className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) bg-sage px-5 py-2.5 font-semibold text-white no-underline hover:bg-sage-dark"
        >
          Filtrar
        </button>
      </form>

      {logs.length === 0 ? (
        <p className="rounded-(--radius-card) border border-dashed border-ink/15 bg-white px-4 py-8 text-center text-sm text-ink-soft">
          No hay entradas que coincidan con el filtro.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-(--radius-card) bg-white shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-3 font-semibold">Cuándo</th>
                <th className="px-4 py-3 font-semibold">Quién</th>
                <th className="px-4 py-3 font-semibold">Acción</th>
                <th className="px-4 py-3 font-semibold">Elemento</th>
                <th className="px-4 py-3 font-semibold">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-ink/5 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatWhen(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{l.actor_email}</p>
                    <p className="text-xs text-ink-soft">{roleLabels[l.actor_role] ?? l.actor_role}</p>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-mist px-1.5 py-0.5 text-xs">{l.action}</code>
                  </td>
                  <td className="px-4 py-3">
                    <p>{l.entity}</p>
                    {l.entity_id ? <p className="text-xs text-ink-soft">{l.entity_id}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{l.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
