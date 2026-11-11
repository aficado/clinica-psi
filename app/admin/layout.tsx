import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { ProfileProvider } from "@/components/admin/ProfileProvider";
import { AdminShell } from "@/components/admin/AdminShell";

const SESSION_COOKIE = "rv_admin_session";

/**
 * Layout del panel admin (R3-A, 8.01/8.04).
 *
 * Componente de servidor. Renderiza el esqueleto `AdminShell` (sidebar +
 * barra superior) SOLO cuando hay una sesión activa; si no, renderiza a
 * los hijos a pantalla completa (así el login y la recuperación no
 * muestran el shell).
 *
 *   1) Verifica la sesión leyendo la cookie `rv_admin_session`
 *      (almacenamiento experimental, sesión stateless en
 *      `lib/admin/session.ts`).
 *   2) Si hay perfil (rol), envuelve a los hijos en `AdminProvider`
 *      (cliente), renderiza `AdminShell` y el `ProfileProvider`.
 *   3) Si no hay perfil, renderiza a los hijos sin shell (página de
 *      login/recuperación).
 *
 * La redirección a `/admin/login` cuando falta la sesión la hace la página
 * protegida (dashboard) por sí misma: este layout no puede redirigir
 * genéricamente porque el login también llega sin sesión.
 */
export const metadata: Metadata = {
  title: "Administración",
  description: "Panel de administración de la clínica.",
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const profile = getSessionProfile(token);

  // Sin sesión: renderizar a los hijos a pantalla completa (login/recuperación).
  if (!profile) {
    return <>{children}</>;
  }

  return (
    <AdminProvider session={{ user: { id: profile.id, email: profile.email } }}>
      <AdminShell profile={profile} />
      <ProfileProvider profile={profile}>
        <div className="pl-0 pr-4 pt-16 pb-6 sm:pl-64 lg:pt-6">{children}</div>
      </ProfileProvider>
    </AdminProvider>
  );
}
