// ============================================================
// THEME_TOKENS — R3-B (8.05)
//
// Lectura y escritura de los tokens de diseño (paleta + tipografías)
// contra la base de datos local (`theme_tokens`).
//
// Un solo registro (id 'current'): todo el sitio lee de aquí para
// aplicar la apariencia en vivo. Los valores se inyectan como
// variables CSS en `:root` (ver `app/layout.tsx`), así que las
// utilidades de Tailwind que referencian `var(--color-*)` cambian
// al vuelo sin recargar.
//
// SOLO servidor (usa `lib/db.ts`, que depende de `node:sqlite`).
// ============================================================

import { getDb } from "./db";
import type { ThemeTokenRow } from "./db";
import { canEditAppearance } from "./rbac";
import { CURATED_FONTS, DEFAULT_THEME } from "./fonts";

/** Lee los tokens del tema guardados (o el defecto si no hay fila). */
export function getThemeTokens(): ThemeTokenRow {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM theme_tokens WHERE id = 'current'")
    .get() as ThemeTokenRow | undefined;
  // Copia a objeto plano: las filas de `node:sqlite` tienen prototipo
  // nulo y Next no puede pasarlas tal cual a un componente de cliente.
  if (row) return { ...row };
  // Fallback por si la siembra no corrió (p. ej. DB en solo lectura).
  return { ...DEFAULT_THEME, id: "current", updated_at: Date.now() };
}

/**
 * Valida y guarda los tokens del tema. Devuelve `{ error }` si algo no
 * es válido (por ejemplo, una tipografía fuera de la lista curada).
 *
 * @param partial Solamente los campos que cambian; los que faltan se
 * conservan del registro actual.
 * @param rol Rol autenticado; se valida aquí (RBAC: solo admin).
 */
export async function saveThemeTokens(
  partial: Partial<Omit<ThemeTokenRow, "id" | "updated_at">>,
  rol: string | null | undefined,
): Promise<{ error?: string }> {
  // RBAC: solo el rol Administrador puede editar la apariencia.
  if (!canEditAppearance(rol)) {
    return { error: "No tienes permisos para editar la apariencia." };
  }

  const errors = validateTheme(partial);
  if (errors) return { error: errors };

  const db = getDb();
  const current = getThemeTokens();
  const merged = { ...current, ...partial, updated_at: Date.now() };

  db.prepare(
    `UPDATE theme_tokens SET
       primary_color = ?, accent_color = ?, background_color = ?,
       text_color = ?, text_soft_color = ?, font_display = ?, font_sans = ?,
       hero_image_id = ?, updated_at = ?
     WHERE id = 'current'`,
  ).run(
    merged.primary_color,
    merged.accent_color,
    merged.background_color,
    merged.text_color,
    merged.text_soft_color,
    merged.font_display,
    merged.font_sans,
    merged.hero_image_id ?? null,
    merged.updated_at,
  );

  return {};
}

/** Valida los campos editables (formato hex + tipografías curadas). */
export function validateTheme(
  partial: Partial<Record<string, unknown>>,
): string | null {
  const hex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  const colorKeys = [
    "primary_color",
    "accent_color",
    "background_color",
    "text_color",
    "text_soft_color",
  ] as const;
  for (const key of colorKeys) {
    const value = partial[key];
    if (value !== undefined && !hex.test(String(value))) {
      return `El color ${keyify(key)} no es válido. Usa un código hexadecimal como #3f5e52.`;
    }
  }
  if (
    partial.font_display !== undefined &&
    !CURATED_FONTS.includes(String(partial.font_display))
  ) {
    return `La tipografía "Título" no está en la lista permitida. Elige una de las curadas.`;
  }
  if (
    partial.font_sans !== undefined &&
    !CURATED_FONTS.includes(String(partial.font_sans))
  ) {
    return `La tipografía "Cuerpo" no está en la lista permitida. Elige una de las curadas.`;
  }
  return null;
}

function keyify(key: string): string {
  return key === "text_soft_color"
    ? "Texto secundario"
    : key === "primary_color"
      ? "Color principal"
      : key === "accent_color"
        ? "Color de acento"
        : key === "background_color"
          ? "Fondo"
          : key === "text_color"
            ? "Texto"
            : key;
}

// La conversión a variables CSS es pura y vive en `lib/themes-core.ts`
// (segura para cliente); se reexporta aquí para mantener la API.
export { themeToCssVars } from "./themes-core";
