import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canAdmin } from "@/lib/rbac";
import { getTestimonials } from "@/lib/content";
import { Icon } from "@/components/ui";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";

const SESSION_COOKIE = "rv_admin_session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testimonios",
  description: "Cola de aprobación de testimonios.",
};

/**
 * Cola de aprobación de testimonios (8.10). Ningún testimonio llega al
 * sitio sin consentimiento registrado: se exige en la UI y en la
 * action `approveTestimonial`. Solo administrador.
 */
export default async function TestimoniosPage() {
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
          <p>Solo el administrador puede aprobar y gestionar testimonios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Testimonios</h1>
        <p className="mt-1.5 text-ink-soft">
          Registra testimonios con el consentimiento por escrito de cada persona y apruébalos
          para que aparezcan en el inicio del sitio.
        </p>
      </div>
      <TestimonialsManager items={getTestimonials()} />
    </div>
  );
}
