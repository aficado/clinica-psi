import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canManageSchedule } from "@/lib/rbac";
import { getProfessionalsAll } from "@/lib/professionals";
import { getServices } from "@/lib/content";
import { Icon } from "@/components/ui";
import { ProfessionalsManager } from "@/components/admin/ProfessionalsManager";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profesionales",
  description: "Profesionales de la agenda: servicios, modalidades, horario, alta y baja.",
};

/**
 * Módulo Profesionales (R4-B-2, refactor R4-B-PROF-1): gestión de quién
 * atiende qué, en qué modalidad y con qué horario.
 * Acceso: administrador y terapeuta (`canManageSchedule`), igual que la
 * agenda. Al guardar, las reglas de `availability_rules` se alinean
 * con el perfil, de modo que la agenda pública refleja los cambios.
 */
export default async function ProfesionalesPage() {
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
          <p>Solo el administrador y la terapeuta gestionan los profesionales.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Profesionales</h1>
        <p className="mt-1.5 text-ink-soft">
          Quiénes atienden la agenda: puedes añadir, editar, poner inactivo o dar de
          baja (baja blanda). Al guardar, el horario se ajusta en la agenda pública.
        </p>
      </div>
      <ProfessionalsManager pros={getProfessionalsAll()} services={getServices()} />
    </div>
  );
}
