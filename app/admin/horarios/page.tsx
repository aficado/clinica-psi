import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canManageSchedule } from "@/lib/rbac";
import { getProfessionals } from "@/lib/professionals";
import { getServices } from "@/lib/content";
import { getRules, listAppointments, listExceptions, yearSchedule } from "@/lib/schedule";
import { Icon } from "@/components/ui";
import { ScheduleManager } from "@/components/admin/ScheduleManager";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda y horarios",
  description: "Citas registradas, horarios de atención y vista anual por profesional.",
};

/** Mes visible del calendario (1–12); default el actual (R4-B-CAL-1). */
function clampMonth(raw: unknown): number {
  const n = Number(typeof raw === "string" ? raw : NaN);
  if (!Number.isInteger(n) || n < 1 || n > 12) return new Date().getMonth() + 1;
  return n;
}

/** Año permitido en la vista anual: del anterior (histórico) a +3 (R4-B-3). */
function clampYear(raw: unknown): number {
  const now = new Date().getFullYear();
  const n = Number(typeof raw === "string" ? raw : NaN);
  if (!Number.isInteger(n)) return now;
  return Math.min(now + 3, Math.max(now - 1, n));
}

/**
 * Módulo Agenda (R4-A, 5.10 parcial; R4-B-3 añade la pestaña
 * "Calendario" con la vista anual por profesional y los bloqueos por
 * fecha — PB-2/PB-3). Acceso: administrador y terapeuta
 * (`canManageSchedule`); asistente fuera (TODO: decidir si recepción
 * también agenda — nota D-R4).
 */
export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile) {
    redirect("/admin/login");
  }
  if (!canManageSchedule(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-(--radius-card) border border-terracotta/40 bg-terracotta/10 px-5 py-4 text-sm text-ink">
        <div className="flex items-start gap-3">
          <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-terracotta-dark" />
          <p>Solo el administrador y la terapeuta gestionan la agenda y los horarios.</p>
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const pros = getProfessionals();
  const year = clampYear(sp.year);
  const month = clampMonth(sp.month);
  const proArg = typeof sp.pro === "string" ? sp.pro : "";
  const proId = pros.some((p) => p.id === proArg) ? proArg : (pros[0]?.id ?? "");
  const initialTab = sp.tab === "calendario" || sp.tab === "horarios" ? sp.tab : "agenda";

  // PB-3 (R4-B-UX-1): enlace de previsualización "cómo lo ve el paciente" por
  // profesional — usa el primer servicio que atiende, con su primera modalidad.
  const services = getServices();
  const previews: Record<string, string> = {};
  for (const p of pros) {
    const svc = services.find((s) => p.services.includes(s.slug) && s.modalities.length > 0);
    if (svc) previews[p.id] = `/agendar?service=${svc.slug}&mode=${svc.modalities[0]}&pro=${p.id}`;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Agenda y horarios</h1>
        <p className="mt-1.5 text-ink-soft">
          Las citas que agenda la gente desde el sitio aparecen aquí. Puedes cancelarlas, ajustar
          en qué días y horas atiende cada profesional y ver el año completo en Calendario.
        </p>
      </div>
      <ScheduleManager
        rules={getRules()}
        appointments={listAppointments()}
        professionals={pros}
        initialTab={initialTab}
        year={year}
        month={month}
        proId={proId}
        yearDays={proId ? yearSchedule(proId, year) : []}
        exceptions={listExceptions()}
        previews={previews}
      />
    </div>
  );
}
