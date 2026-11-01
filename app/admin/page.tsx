import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { Icon } from "@/components/ui";
import { RoleGuard } from "@/components/admin/RoleGuard";
import { countUpcoming } from "@/lib/schedule";
import { cn } from "@/lib/utils";

const SESSION_COOKIE = "rv_admin_session";

/**
 * Dashboard del panel admin (R3-A, 8.04).
 *
 * Landing que confirma que el esqueleto del admin funciona: sesión, rol
 * (RBAC) y layout. Los módulos reales llegan en R3-B/C/D.
 *
 * TODO (Fase 3): reemplazar los "stats" de ejemplo por datos reales del
 * almacenamiento experimental (visitas, citas, ingresos) y los accesos
 * rápidos por los módulos activos.
 *
 * Redirige a `/admin/login` si no hay sesión (la sesión se valida en la
 * cookie `rv_admin_session`; el layout no puede redirigir genéricamente
 * porque el login también llega sin sesión).
 */
export default async function DashboardPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!getSessionProfile(token)) {
    redirect("/admin/login");
  }

  const upcoming = countUpcoming();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Bienvenido al panel</h1>
        <p className="mt-1.5 text-ink-soft">
          Control de administración de Raíz Viva. Desde aquí editas contenido
          y enlaces sin tocar código.
        </p>
      </div>

      {/* Estado del panel */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon="calendar"
          label="Agenda"
          value={`${upcoming}`}
          hint={upcoming === 1 ? "cita próxima confirmada" : "citas próximas confirmadas"}
        />
        <StatCard icon="book" label="Contenido" value="Fase 3" hint="artículos, recursos, servicios y cursos" />
        <StatCard icon="link" label="Enlaces" value="Fase 3" hint="botones, cortos, QR y menú" />
      </div>

      {/* Accesos rápidos (módulos) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ModuleCard
          icon="book"
          title="Contenido"
          desc="Crear y editar artículos, recursos, servicios y cursos; publicar y programar."
          href="/admin/contenido"
        />
        <ModuleCard
          icon="calendar"
          title="Agenda"
          desc="Ver y cancelar citas registradas; ajustar horarios por día de cada profesional."
          href="/admin/horarios"
        />
        <ModuleCard
          icon="video"
          title="Multimedia"
          desc="Subir y gestionar imágenes, videos y documentos."
          href="/admin/multimedia"
        />
        <ModuleCard
          icon="link"
          title="Enlaces y QR"
          desc="Botones del enlace único, enlaces cortos /c/ y códigos QR."
          href="/admin/enlaces"
        />
        <ModuleCard
          icon="heart"
          title="Testimonios"
          desc="Aprobar testimonios con consentimiento antes de publicarlos."
          href="/admin/testimonios"
        />
        <ModuleCard
          icon="menu"
          title="Menú y redes"
          desc="Elementos del menú del sitio y perfiles de redes sociales."
          href="/admin/menu"
        />
        <ModuleCard
          icon="shield"
          title="Auditoría"
          desc="Historial de cambios hechos en el panel, por actor y entidad."
          href="/admin/auditoria"
        />
      </div>

      {/* Solo visible para Administrador (RBAC demo) */}
      <RoleGuard rolesPermitidos={["admin"]}>
        <div className="mt-8 rounded-(--radius-card) border border-sage/30 bg-sage/10 px-5 py-4 text-sm text-sage-dark">
          <div className="flex items-start gap-3">
            <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Acceso de administrador</p>
              <p className="mt-0.5 text-sm">
                Tienes rol de administrador. Verás aquí la gestión de usuarios y
                roles en breve (8.02).
              </p>
            </div>
          </div>
        </div>
      </RoleGuard>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: "shield" | "book" | "spark" | "video" | "link" | "calendar";
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-(--radius-card) bg-white px-5 py-4 shadow-[0_4px_16px_rgba(31,42,39,0.06)]">
      <div className="flex items-center gap-2 text-sage">
        <Icon name={icon} className="h-4 w-4" />
        <span className="text-sm text-ink-soft">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink-soft">{hint}</p>
    </div>
  );
}

function ModuleCard({
  icon,
  title,
  desc,
  soon,
  href,
}: {
  icon: "leaf" | "video" | "search" | "link" | "book" | "heart" | "menu" | "shield" | "calendar";
  title: string;
  desc: string;
  soon?: boolean;
  href?: string;
}) {
  const cardClass =
    "flex items-start gap-4 rounded-(--radius-card) bg-white px-5 py-5 shadow-[0_4px_16px_rgba(31,42,39,0.06)]";
  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-btn) bg-sage/10 text-sage">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-ink">{title}</h3>
          {soon ? (
            <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sage-dark">
              Próximamente
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-ink-soft">{desc}</p>
      </div>
    </>
  );
  return href ? (
    <Link href={href} className={cn(cardClass, "transition-colors hover:bg-sage/5")}>
      {content}
    </Link>
  ) : (
    <div className={cardClass}>{content}</div>
  );
}
