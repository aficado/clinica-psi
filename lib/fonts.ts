// ============================================================
// TIPOGRÁFIAS CURADAS + TEMA POR DEFECTO — R3-B (8.05)
//
// Lista curada de tipografías permitidas (validación del lado del
// servidor) y el tema por defecto.
//
// Decisión: las tipografías curadas coinciden con las fuentes de
// Google ya usadas en el sitio (`next/font/google` en `app/layout.tsx`)
// más un par adicional seguro para el cliente. Cualquier valor fuera
// de esta lista se rechaza en el servidor (regla del PROMPT §12.x).
// ============================================================

/** Tipografías que el panel permite elegir (curadas). */
export const CURATED_FONTS: string[] = [
  "Fraunces",
  "Inter",
  "Playfair Display",
  "Lora",
  "Merriweather",
  "Sora",
  "Manrope",
  "Public Sans",
];

/**
 * Mapeo entre el nombre curado y la fuente real de `next/font/google`.
 * Las no disponibles en Google Fonts se mapean a una alternativa
 * cercana (decisión documentada: no se pueden inyectar fuentes locales
 * sin un archivo de fuente; se prioriza disponibilidad real).
 */
export const FONT_TO_NEXT: Record<string, string> = {
  Fraunces: "Fraunces",
  Inter: "Inter",
  "Playfair Display": "Playfair Display",
  Lora: "Lora",
  Merriweather: "Merriweather",
  Sora: "Sora",
  Manrope: "Manrope",
  "Public Sans": "Public Sans",
};

/** Paleta + tipografías por defecto (coincide con `app/globals.css`). */
export const DEFAULT_THEME = {
  id: "current",
  primary_color: "#3f5e52",
  accent_color: "#c97b5a",
  background_color: "#f5efe6",
  text_color: "#1f2a27",
  text_soft_color: "#4c5b55",
  font_display: "Fraunces",
  font_sans: "Inter",
  hero_image_id: null,
  updated_at: 0,
} as const;
