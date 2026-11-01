import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { listMediaAssets, mediaToView } from "@/lib/media";
import { Icon } from "@/components/ui";
import { RoleGuard } from "@/components/admin/RoleGuard";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

const SESSION_COOKIE = "rv_admin_session";

/**
 * Módulo de Multimedia (R3-B, 8.06).
 *
 * Componente de servidor: lee los medios de la base de datos local y
 * los pasa a la biblioteca en vivo. La subida va por
 * `POST /api/media/upload` y la validación/eliminación por server
 * actions. El control por rol (RBAC) se aplica en el servidor.
 */
export default async function MultimediaPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile) {
    redirect("/admin/login");
  }

  const initial = listMediaAssets().map(mediaToView);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Multimedia</h1>
        <p className="mt-1.5 text-ink-soft">
          Sube y reemplaza imágenes con barra de progreso, o enaza videos de
          YouTube o Vimeo. Los medios se guardan por ID, así que reemplazar
          uno no rompe sus referencias.
        </p>
      </div>

      <RoleGuard rolesPermitidos={["admin"]}>
        <div className="mb-6 rounded-(--radius-input) bg-mist px-3 py-2 text-xs text-ink-soft">
          <Icon name="shield" className="inline h-4 w-4 -translate-y-0.5 text-sage" />
          Solo el administrador puede subir y eliminar medios.
        </div>
      </RoleGuard>

      <MediaLibrary initial={initial} />
    </div>
  );
}
