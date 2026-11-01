// ============================================================
// THEME_TOKENS (PURAS) — R3-B (8.05)
//
// Función PURA de apariencia: conversión de tokens guardados a
// variables CSS. NO depende de la base de datos ni del sistema de
// archivos, así que ES SEGURO importarla desde componentes de
// cliente (Next.js/webpack no intenta empaquetar `node:sqlite`).
//
// Las operaciones contra la base de datos viven en `lib/themes.ts`
// (solo servidor), que reexporta esta función.
// ============================================================

import type { ThemeTokenRow } from "./db";

/**
 * Convierte los tokens guardados en un mapa de variables CSS para
 * inyectar en `:root`. Las claves siguen la convención de Tailwind
 * (--color-*, --font-*) para que las utilidades las hereden.
 */
export function themeToCssVars(theme: ThemeTokenRow): Record<string, string> {
  return {
    "--color-sage": theme.primary_color,
    "--color-sage-dark": mix(theme.primary_color, "#000000", 15),
    "--color-sage-light": mix(theme.primary_color, "#ffffff", 25),
    "--color-terracotta": theme.accent_color,
    "--color-terracotta-dark": mix(theme.accent_color, "#000000", 12),
    "--color-sand": theme.background_color,
    "--color-ink": theme.text_color,
    "--color-ink-soft": theme.text_soft_color,
    "--color-mist": mix(theme.primary_color, "#ffffff", 65),
    "--color-mist-deep": mix(theme.primary_color, "#ffffff", 45),
    "--font-display": theme.font_display,
    "--font-sans": theme.font_sans,
  };
}

/** Mezcla dos colores hex en porcentaje (0-100 de b). Simplificado. */
function mix(hexA: string, hexB: string, pct: number): string {
  const a = normalizeHex(hexA);
  const b = normalizeHex(hexB);
  const r = Math.round((a[0] * (100 - pct) + b[0] * pct) / 100);
  const g = Math.round((a[1] * (100 - pct) + b[1] * pct) / 100);
  const bl = Math.round((a[2] * (100 - pct) + b[2] * pct) / 100);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function normalizeHex(hex: string): [number, number, number] {
  let value = hex.replace("#", "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}
