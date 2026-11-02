"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/admin/actions";
import { clearStoredSession } from "@/lib/admin/storage";
import type { Profile, RoleId } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Esqueleto del panel admin (R3-A, 8.04).
 *
 * Sidebar fija (desktop) / drawer (móvil), barra superior con rol y
 * sesión, y botón de cierre. Cada rol ve solo lo que le corresponde
 * (RBAC en el menú, validado de nuevo en cada server action); los
 * módulos que aún no existen se marcan "próximamente".
 */
const navItems: Array<{
  id: string;
  label: string;
  href: string;
  icon: string;
  roles: string[];
  comingSoon?: boolean;
}> = [
  { id: "dashboard", label: "Inicio", href: "/admin", icon: "spark", roles: ["admin", "therapist", "assistant"] },
  { id: "contenido", label: "Contenido", href: "/admin/contenido", icon: "book", roles: ["admin", "therapist"] },
  { id: "agenda", label: "Agenda", href: "/admin/horarios", icon: "calendar", roles: ["admin", "therapist"] },
  { id: "profesionales", label: "Profesionales", href: "/admin/profesionales", icon: "user", roles: ["admin", "therapist"] },
  { id: "servicios", label: "Servicios", href: "/admin/servicios", icon: "check", roles: ["admin", "therapist"] },
  { id: "multimedia", label: "Multimedia", href: "/admin/multimedia", icon: "video", roles: ["admin"] },
  { id: "enlaces", label: "Enlaces", href: "/admin/enlaces", icon: "link", roles: ["admin"] },
  { id: "testimonios", label: "Testimonios", href: "/admin/testimonios", icon: "heart", roles: ["admin"] },
  { id: "menu", label: "Menú y redes", href: "/admin/menu", icon: "menu", roles: ["admin"] },
  { id: "auditoria", label: "Auditoría", href: "/admin/auditoria", icon: "shield", roles: ["admin"] },
  { id: "usuarios", label: "Usuarios y roles", href: "/admin/usuarios", icon: "user", roles: ["admin"], comingSoon: true },
  { id: "ajustes", label: "Ajustes", href: "/admin/ajustes", icon: "shield", roles: ["admin"], comingSoon: true },
];

const roleLabels: Record<RoleId, string> = {
  admin: "Administrador",
  therapist: "Terapeuta",
  assistant: "Asistente",
};

type AdminIcon = React.ComponentProps<typeof Icon>["name"];

export function AdminShell({
  profile,
}: {
  profile: Profile;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function onSignOut() {
    await signOut();
    clearStoredSession();
  }

  const email = profile.email;
  const role = profile.role;
  // Cada rol ve solo sus módulos (el control fuerte está en las actions).
  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Overlay del drawer (móvil) */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Sidebar / drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-ink/10 bg-white transition-transform duration-200 lg:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-60",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-ink/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-(--radius-btn) bg-sage text-white">
            <Icon name="leaf" className="h-5 w-5" />
          </div>
          <span className="truncate font-display text-lg font-semibold text-ink">
            Raíz Viva
          </span>
          <button
            type="button"
            className="ml-auto h-9 w-9 flex items-center justify-center rounded-lg text-ink-soft hover:bg-mist lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menú"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Panel de administración">
          <ul className="flex flex-col gap-1">
            {visibleNav.map((item) => (
              <li key={item.id}>
                {item.comingSoon ? (
                  <span className="flex items-center justify-between rounded-(--radius-btn) px-3 py-2 text-sm text-ink-soft">
                    <span className="flex items-center gap-2">
                      <Icon name={item.icon as AdminIcon} className="h-4 w-4" />
                      {item.label}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-terracotta/70">
                      Próximamente
                    </span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-(--radius-btn) px-3 py-2 text-sm font-semibold transition-colors",
                      pathname === item.href
                        ? "bg-sage text-white"
                        : "text-ink-soft hover:bg-mist hover:text-ink",
                    )}
                  >
                    <Icon name={item.icon as AdminIcon} className="h-4 w-4" />
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-ink/10 p-3">
          <div className="flex items-center gap-3 rounded-(--radius-btn) bg-mist px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-semibold text-white">
              {(profile.full_name ?? email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {profile.full_name ?? "Sin nombre"}
              </p>
              <p className="truncate text-xs text-ink-soft">{roleLabels[role]}</p>
            </div>
          </div>
          <div className="mt-2">
            <ThemeToggle label="Modo oscuro" className="w-full justify-center" />
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-(--radius-btn) border-2 border-sage/40 px-3 py-2 text-sm font-semibold text-sage transition-colors hover:border-sage hover:bg-sage/10"
          >
            <Icon name="close" className="h-4 w-4 rotate-180" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Barra superior (solo móvil: hamburguesa + título). En desktop la
          sidebar siempre está visible, así que aquí no hace falta y evitamos
          que la sidebar (z-50) solape esta barra (z-30). */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-ink/10 bg-white/90 px-4 backdrop-blur lg:hidden lg:px-6">
        <button
          type="button"
          className="h-9 w-9 flex items-center justify-center rounded-lg text-ink-soft hover:bg-mist lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-ink">Panel de administración</p>
        <ThemeToggle className="ml-auto" />
      </header>
    </>
  );
}
