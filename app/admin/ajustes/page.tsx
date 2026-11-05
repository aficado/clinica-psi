import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canAdmin } from "@/lib/rbac";
import { getSiteSettings } from "@/lib/content";
import { Icon } from "@/components/ui";
import { BookingSettings } from "@/components/admin/BookingSettings";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ajustes",
  description: "Política de la agenda: cancelación, ventana de reserva y zona horaria.",
};

/**
 * Página Ajustes (R4-B-3, PB-1). Solo administrador (`canAdmin`):
 * anticipación de cancelación, ventana de reserva y zona horaria.
 * El resto de la configuración del sitio (contenido, redes, mapa)
 * sigue en sus módulos propios.
 */
export default async function AjustesPage() {
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
          <p>Solo el administrador configura la política de la agenda.</p>
        </div>
      </div>
    );
  }

  const s = getSiteSettings();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Ajustes</h1>
        <p className="mt-1.5 text-ink-soft">
          La política de la clínica: qué tan fácil cancelar, cuánto futuro se puede reservar y en
          qué zona horaria se lee todo. Se aplica al instante en <code>/agendar</code> y
          <code>/mi-cita</code>.
        </p>
      </div>
      <BookingSettings
        initial={{
          cancelCutoffHours: s.cancelCutoffHours,
          bookingWindowDays: s.bookingWindowDays,
          timeZone: s.timeZone,
        }}
      />
    </div>
  );
}
