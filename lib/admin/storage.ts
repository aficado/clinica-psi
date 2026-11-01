// Utilidades de localStorage para el panel admin (almacenamiento
// experimental). El perfil del usuario autenticado se guarda aquí para
// que el cliente pueda leer el rol sin depender de un backend.

import type { Profile, RoleId } from "./store";

const PROFILE_KEY = "rv_admin_profile";

export interface StoredSession {
  userId: string;
  email: string;
  profile: Profile;
}

/** Lee la sesión almacenada en localStorage (solo cliente). */
export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.profile?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Guarda la sesión en localStorage. */
export function setStoredSession(profile: Profile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        userId: profile.id,
        email: profile.email,
        profile,
      }),
    );
  } catch {
    // Si localStorage no está disponible (modo privado), se ignora.
  }
}

/** Limpia la sesión de localStorage. */
export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Ignorar.
  }
}

/** Utilidad: ¿el rol puede hacer esto? (para badges/estados). */
export function canRole(
  role: RoleId | string | null | undefined,
  rolesPermitidos: string[],
): boolean {
  return !!role && rolesPermitidos.includes(role);
}
