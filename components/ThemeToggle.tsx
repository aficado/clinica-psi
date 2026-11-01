"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./ui";

/**
 * Toggle de modo oscuro (R3-E, 8.14).
 *
 * La clase `dark` vive en `<html>`; el script inline del layout la aplica
 * ANTES del primer paint (según `localStorage.rv_theme` o el ajuste del
 * sistema), así no hay flash de fondo claro. Este botón solo cambia la
 * clase y persiste la elección; la paleta oscura está en `globals.css`.
 */
export function ThemeToggle({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("rv_theme", next ? "dark" : "light");
    } catch {
      // Sin almacenamiento disponible, el cambio sigue vigente en la sesión.
    }
  }

  const text = dark ? "Activar modo claro" : "Activar modo oscuro";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={text}
      title={text}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-(--radius-btn) border border-ink/15 bg-white/10 text-ink transition-colors hover:border-sage hover:text-sage",
        className,
      )}
    >
      <Icon name={dark ? "sun" : "moon"} className="h-5 w-5" />
      {label ? <span className="text-sm font-semibold">{label}</span> : null}
      {/* Antes de montar se muestra el botón neutro (el estado real llega
          del script inline); `mounted` evita el mismatch de hidratación. */}
      {!mounted ? <span className="sr-only" aria-hidden="true">…</span> : null}
    </button>
  );
}
