"use client";

import { useState } from "react";
import Link from "next/link";
import { clinic } from "@/lib/data";
import type { NavItemView } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Button, Icon } from "./ui";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Encabezado del sitio. El menú llega por props desde la base de datos
 * (`nav_items`, 8.11) y se edita desde /admin/menu.
 */
export function Header({ nav }: { nav: NavItemView[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-sand/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
          <Link href="/" className="flex items-center gap-2 no-underline" aria-label={`${clinic.name}, ir al inicio`}>
            <Icon name="leaf" className="h-7 w-7 text-sage" />
            <span className="font-display text-xl font-semibold sm:text-2xl">{clinic.name}</span>
          </Link>

          <nav aria-label="Navegación principal" className="hidden md:block">
            <ul className="flex items-center gap-6">
              {nav.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="no-underline text-ink-soft transition-colors duration-200 hover:text-sage"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button href="/agendar" variant="primary" className="hidden sm:inline-flex">
              Agendar cita
            </Button>
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-(--radius-btn) text-ink md:hidden"
              aria-expanded={open}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil (panel a pantalla completa).
          Vive fuera del <header> a propósito: el backdrop-filter del header
          lo convierte en contenedor de descendientes position:fixed, lo que
          rompería la cobertura a pantalla completa de inset-0. */}
      {open ? (
        <nav
          aria-label="Navegación móvil"
          className="menu-fade-in fixed inset-0 z-50 flex flex-col bg-sand pt-16 sm:pt-20 md:hidden"
        >
          <div className="flex items-center justify-end gap-2 px-4">
            <ThemeToggle />
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-(--radius-btn) text-ink"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
            >
              <Icon name="close" className="h-6 w-6" />
            </button>
          </div>
          <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6">
            {nav.map((item, i) => (
              <li key={item.id} style={{ animationDelay: `${i * 40}ms` }} className="menu-rise-in">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-14 items-center rounded-xl px-3 py-3 font-display text-2xl text-ink no-underline hover:bg-mist"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="menu-rise-in px-4 pb-8" style={{ animationDelay: `${nav.length * 40}ms` }}>
            <Button href="/agendar" variant="primary" className="w-full" onClick={() => setOpen(false)}>
              Agendar cita
            </Button>
          </div>
        </nav>
      ) : null}
    </>
  );
}
