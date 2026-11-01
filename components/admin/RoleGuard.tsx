"use client";

import type { ReactNode } from "react";
import { useProfile } from "./ProfileProvider";

/**
 * Protege un bloque por rol (R3-A, 8.02).
 *
 * Si el rol del usuario no está en `rolesPermitidos`, no renderiza nada.
 * Es la defensa en el cliente; la defensa fuerte es la validación del
 * rol en cada server action (`lib/admin/actions.ts`) y el control por
 * rol en el almacenamiento experimental.
 */
export function RoleGuard({
  rolesPermitidos,
  children,
}: {
  rolesPermitidos: string[];
  children: ReactNode;
}) {
  const profile = useProfile();
  if (!profile) return null; // cargando o sin sesión
  return rolesPermitidos.includes(profile.role) ? <>{children}</> : null;
}

/** Utilidad: ¿el rol actual puede hacer esto? (para badges/estados). */
export function canRole(
  role: string | null | undefined,
  rolesPermitidos: string[],
): boolean {
  return !!role && rolesPermitidos.includes(role);
}
