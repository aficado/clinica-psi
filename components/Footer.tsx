import Link from "next/link";
import { clinic } from "@/lib/data";
import type { NavItemView, SiteSettings } from "@/lib/content";
import { waLink } from "@/lib/utils";
import { Icon } from "./ui";

/**
 * Pie del sitio. El menú y las redes llegan por props desde la base de
 * datos (`nav_items` y `site_settings`, 8.11) y se editan en /admin/menu.
 */
export function Footer({ nav, social }: { nav: NavItemView[]; social: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 bg-sage text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 font-display text-2xl">
          <Icon name="leaf" className="h-6 w-6 text-mist" />
            {clinic.name}
          </p>
          <p className="mt-3 text-mist/90">{clinic.tagline}</p>
          <p className="mt-4 text-sm text-mist/70">
            Sitio de demostración: nombres, precios y testimonios son datos de ejemplo
            (marcados con TODO) y se reemplazan desde el panel de administración.
          </p>
        </div>

        <nav aria-label="Enlaces del sitio">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-mist/70">Explora</p>
          <ul className="space-y-2">
            {nav.slice(1).map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="no-underline text-mist/90 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacidad" className="no-underline text-mist/90 hover:text-white">
                Aviso de privacidad
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-mist/70">Contacto</p>
          <ul className="space-y-3">
            <li className="flex gap-2">
              <Icon name="pin" className="mt-0.5 text-mist/80" />
              <span>{clinic.address}</span>
            </li>
            <li className="flex gap-2">
              <Icon name="whatsapp" className="mt-0.5 text-mist/80" />
              <a
                href={waLink(clinic.whatsappNumber, `Hola, escribo desde ${clinic.name}`)}
                target="_blank"
                rel="noopener"
                className="no-underline text-mist/90 hover:text-white"
              >
                {clinic.whatsapp}
              </a>
            </li>
            <li className="flex gap-2">
              <Icon name="mail" className="mt-0.5 text-mist/80" />
              <a href={`mailto:${clinic.email}`} className="no-underline text-mist/90 hover:text-white">
                {clinic.email}
              </a>
            </li>
            <li className="flex gap-2">
              <Icon name="clock" className="mt-0.5 text-mist/80" />
              <span>{clinic.hours}</span>
            </li>
            {social.instagram || social.facebook ? (
              <li className="flex gap-4 pt-1 text-sm">
                {social.instagram ? (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener"
                    className="no-underline text-mist/90 hover:text-white"
                  >
                    Instagram
                  </a>
                ) : null}
                {social.facebook ? (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener"
                    className="no-underline text-mist/90 hover:text-white"
                  >
                    Facebook
                  </a>
                ) : null}
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-mist/70 sm:px-6">
          <p>© {year} {clinic.fullName} · {clinic.city}</p>
          {/* Crédito del sitio (R3-E, 8.16): texto discreto; si el dueño
              aporte una URL, convertir en enlace (target=_blank rel=noopener). */}
          <p>Generada por vegttech</p>
          <p>
            <Link href="/admin" className="no-underline underline hover:text-white">
              Acceso administración
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
