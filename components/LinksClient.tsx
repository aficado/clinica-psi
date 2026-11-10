"use client";

import type { LinkItemView } from "@/lib/content";
import { Icon } from "./ui";
import { Reveal } from "./Reveal";

/**
 * Página de enlace único (bloque I / epico E7, 7.03).
 * Los botones llegan desde la base de datos (`link_items`) y se editan
 * desde el panel. La URL del enlace único y su QR son herramientas del
 * administrador y viven en /admin/enlaces, no en la página pública.
 */
export function LinksClient({ items }: { items: LinkItemView[] }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6" aria-labelledby="links-title">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Reveal>
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-sage">
            Enlace único
          </p>
          <h1 id="links-title" className="text-center text-4xl">
            Todo lo que necesitas, en un solo enlace
          </h1>
        </Reveal>
        <div className="mt-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="px-4 text-center text-sm text-ink-soft">
              No hay enlaces publicados todavía.
            </p>
          ) : (
            items.map((l, i) => (
              <Reveal key={l.id} delay={Math.min(i, 4) * 70}>
                <a
                  href={l.href}
                  className={`flex min-h-14 items-center justify-between rounded-(--radius-btn) px-5 py-3 font-semibold no-underline transition-all duration-200 hover:-translate-y-0.5 ${
                    l.isPrimary
                      ? "bg-terracotta text-ink shadow-[0_8px_20px_rgba(201,123,90,0.35)]"
                      : "bg-white text-ink shadow-[0_1px_2px_rgba(31,42,39,0.06),0_8px_24px_rgba(31,42,39,0.07)] hover:bg-mist"
                  }`}
                >
                  <span>{l.label}</span>
                  <Icon name="arrow" className="h-5 w-5" />
                </a>
              </Reveal>
            ))
          )}
        </div>
      </div>
    </section>
  );
}