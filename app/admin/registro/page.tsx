import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canAdmin } from "@/lib/rbac";
import { getSiteTimeZone } from "@/lib/schedule";
import { Icon } from "@/components/ui";
import { RegistroExport } from "@/components/admin/RegistroExport";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registro de actividad",
  // Herramienta interna: no debe indexarse ni aparecer en buscadores.
  robots: { index: false, follow: false },
};

/**
 * Panel OCULTO de auditoría (R4-B-AUDIT-2). No está en el menú del panel:
 * el admin general no lo ve; el programador entra por el enlace discreto
 * «registro» del pie de la barra lateral o por esta URL. Solo administrador.
 * Descarga las entradas por rango de días y horas (.md / .txt).
 */
export default async function RegistroPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile) redirect("/admin/login");
  if (!canAdmin(profile.role)) redirect("/admin");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-btn) bg-sage/10 text-sage">
          <Icon name="shield" className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Registro de actividad</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Herramienta interna para descargar la auditoría por días y horas. No aparece en el
            menú del panel.
          </p>
        </div>
      </div>
      <RegistroExport timeZone={getSiteTimeZone()} />
    </div>
  );
}