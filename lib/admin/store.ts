// ============================================================
// ALMACENAMIENTO EXPERIMENTAL — Panel admin (Fase 3, R3-A)
//
// NO es una base de datos real. Todo vive en memoria del servidor
// (se resetea al reiniciar el dev server) para pruebas rápidas.
//
// Sesión sin estado (stateless): ver `lib/admin/session.ts`. Este
// módulo solo contiene datos de demo seguros para el cliente
// (credenciales y perfiles) y la validación de login.
//
// Credenciales de demo (todas /demo123):
//   admin@raizviva.mx     → Administrador
//   terapista@raizviva.mx → Terapeuta
//   asistente@raizviva.mx → Asistente
// ============================================================

export type RoleId = "admin" | "therapist" | "assistant";

export interface Profile {
  id: string;
  email: string;
  role: RoleId;
  full_name: string | null;
}

interface DemoUser {
  id: string;
  email: string;
  password: string;
  role: RoleId;
  full_name: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    id: "u-admin",
    email: "admin@raizviva.mx",
    password: "demo123",
    role: "admin",
    full_name: "Administrador demo",
  },
  {
    id: "u-therapist",
    email: "therapista@raizviva.mx",
    password: "demo123",
    role: "therapist",
    full_name: "Terapeuta demo",
  },
  {
    id: "u-assistant",
    email: "asistente@raizviva.mx",
    password: "demo123",
    role: "assistant",
    full_name: "Asistente demo",
  },
];

/** Credenciales de demo (para mostrarlas en el login). */
export const DEMO_CREDENTIALS = DEMO_USERS.map((u) => ({
  email: u.email,
  password: u.password,
}));

// Perfiles (simulan la tabla `profiles`).
let profiles: Profile[] = DEMO_USERS.map((u) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  full_name: u.full_name,
}));

/** Autenticación demo (email/password). Devuelve el perfil o `null`. */
export function signIn(email: string, password: string): Profile | null {
  const user = DEMO_USERS.find(
    (u) =>
      u.email === email.trim().toLowerCase() && u.password === password,
  );
  if (!user) return null;
  return (
    profiles.find((p) => p.id === user.id) ??
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name }
  );
}

/** Lista de perfiles (para la demo de gestión de usuarios). */
export function listProfiles(): Profile[] {
  return profiles;
}
