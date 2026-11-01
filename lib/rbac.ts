// ============================================================
// CONTROL POR ROL (RBAC) — R3-B (8.05/8.06)
//
// El control por rol se aplica en la capa de datos/local y en el
// servidor: cada server action valida el rol antes de escribir.
// La defensa en el cliente es `RoleGuard` (débil); la fuerte es esta
// validación en el servidor.
//
// Roles: admin / therapist / assistant (ver `lib/admin/store.ts`).
// ============================================================

/** ¿El rol puede hacer esta acción? (para validación del servidor). */
export function canRole(
  role: string | null | undefined,
  rolesPermitidos: string[],
): boolean {
  return !!role && rolesPermitidos.includes(role);
}

/** Solo el Administrador puede editar la apariencia. */
export function canEditAppearance(role: string | null | undefined): boolean {
  return canRole(role, ["admin"]);
}

/** Solo el Administrador puede subir/eliminar medios. */
export function canManageMedia(role: string | null | undefined): boolean {
  return canRole(role, ["admin"]);
}

/**
 * Contenido editorial (artículos, recursos, servicios y cursos):
 * el Administrador y la Terapeuta pueden crear/editar y cambiar
 * estados; borrar y restaurar es exclusivo del Administrador
 * (se aplica en `lib/content/actions.ts`).
 */
export function canEditContent(role: string | null | undefined): boolean {
  return canRole(role, ["admin", "therapist"]);
}

/**
 * Agenda real (R4-A): el Administrador y la Terapeuta gestionan la
 * agenda y los horarios. El Asistente queda fuera hasta que el dueño
 * confirme si recepción también agenda citas (TODO: decisión D-R4).
 */
export function canManageSchedule(role: string | null | undefined): boolean {
  return canRole(role, ["admin", "therapist"]);
}

/**
 * Lanza si el rol NO es Administrador. Para server actions que
 * devuelven `{ error }`: usar `canManageMedia`/`canEditAppearance` y
 * devolver el error en vez de lanzar.
 */
export function requireAdmin(role: string | null | undefined): void {
  if (!canAdmin(role)) {
    throw new Error("Solo el administrador puede editar la apariencia.");
  }
}

/** Alias claro para el rol de administración. */
export function canAdmin(role: string | null | undefined): boolean {
  return canRole(role, ["admin"]);
}
