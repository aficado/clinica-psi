import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canManageSchedule } from "@/lib/rbac";
import { getProfessionals } from "@/lib/professionals";
import { getRules, listAppointments } from "@/lib/schedule";
import { Icon } from "@/components/ui";
import { ScheduleManager } from "@/components/admin/ScheduleManager";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda y horarios",
  description: "Citas registradas y horarios de atención por profesional.",
};

/**
 * Módulo Agenda (R4-A, 5.10 parcial): ver/cancelar citas reales y
 * editar los horarios por día de cada profesional (5.02). Acceso:
 * administrador y terapeuta (`canManageSchedule`); asistente fuera
 * (TODO: decidir si recepción también agenda — nota D-R4).
 */
export default async function HorariosPage() {
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

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Agenda y horarios</h1>
        <p className="mt-1.5 text-ink-soft">
          Las citas que agenda la gente desde el sitio aparecen aquí. Puedes cancelarlas y
          ajustar en qué días y horas atiende cada profesional.
        </p>
      </div>
      <ScheduleManager
        rules={getRules()}
        appointments={listAppointments()}
        professionals={getProfessionals()}
      />
    </div>
  );
}
