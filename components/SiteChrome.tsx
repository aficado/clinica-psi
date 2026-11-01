"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { NavItemView, SiteSettings } from "@/lib/content";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Reveal } from "./Reveal";
import { WhatsAppFloat } from "./WhatsAppFloat";

/**
 * Chrome del sitio (enlace de saltar contenido, `Header`, `Footer` y el
 * botón flotante de WhatsApp).
 *
 * Se renderiza SOLO en las páginas públicas. El panel admin (`/admin` y
 * subrutas) tiene su propio esqueleto (sidebar + barra superior) y NO
 * debe heredar este chrome: hacerlo solapa el header sticky del sitio
 * sobre la barra superior y la sidebar del admin.
 *
 * La decisión se toma aquí, en el cliente, con `usePathname()`. Next.js
 * no permite que un layout hijo retire el renderizado del `<body>` del
 * root layout, y la cookie `x-next-pathname` no llega en la primera
 * carga directa (p. ej. `/admin/login`), así que `usePathname()` es el
 * único camino fiable en toda navegación.
 */
export function SiteChrome({
  nav,
  social,
  children,
}: {
  nav: NavItemView[];
  social: SiteSettings;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      {!isAdmin && (
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-sage focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
        >
          Saltar al contenido principal
        </a>
      )}
      {!isAdmin && <Header nav={nav} />}
      <main id="main" className="min-h-screen">
        {children}
      </main>
      {!isAdmin && (
        <Reveal>
          <Footer nav={nav} social={social} />
        </Reveal>
      )}
      {!isAdmin && <WhatsAppFloat />}
    </>
  );
}
