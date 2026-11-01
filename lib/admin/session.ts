// ============================================================
// SESIÓN FIRMAADA — Panel admin (Fase 3, R3-A)
//
// SOLO servidor. Contiene la lógica de sesión sin estado (stateless)
// y usa `node:crypto` (HMAC-SHA256), por lo que NO debe importarse
// desde componentes de cliente (Next.js no puede empaquetar crypto
// del servidor para el navegador).
//
// La sesión NO se guarda en memoria: el token de la cookie
// `rv_admin_session` ES el perfil firmado (id, email, rol, expiración
// + HMAC). El servidor valida recomputeando la firma, sin precisar
// estado compartido entre la acción y la página.
// ============================================================

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Profile, RoleId } from "./store";

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 h
const TOKEN_PREFIX = "rv_";

// Secret de firma de la sesión. En producción debe venir de una
// variable de entorno; aquí usamos uno f para la demo.
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "raizviva-demo-secret-no-usar-en-prod";

interface SessionPayload {
  id: string;
  email: string;
  role: RoleId;
  full_name: string | null;
  exp: number;
}

function b64u(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadB64: string): string {
  return b64u(createHmac("sha256", SESSION_SECRET).update(payloadB64).digest());
}

/**
 * Crea un token de sesión firmado que codifica el perfil (stateless).
 * El token ya contiene todo lo necesario para validar la sesión.
 */
export function createSession(profile: Profile): string {
  const payload: SessionPayload = {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    full_name: profile.full_name ?? null,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadB64 = b64u(JSON.stringify(payload));
  return TOKEN_PREFIX + payloadB64 + "." + sign(payloadB64);
}

/**
 * Valida un token de sesión firmado y devuelve el perfil, o `null` si es
 * inválido (firma incorrecta) o está expirado. No requiere estado
 * compartido: todo se deduce del propio token.
 */
export function getSessionProfile(
  token: string | null | undefined,
): Profile | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  const body = token.slice(TOKEN_PREFIX.length);
  const dot = body.lastIndexOf(".");
  if (dot === -1) return null;
  const payloadB64 = body.slice(0, dot);
  const sig = body.slice(dot + 1);
  // Verifica la firma sin exponer tiempo (comparación de tiempo constante).
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as SessionPayload;
  } catch {
    return null;
  }
  if (!payload?.id || !payload?.email || !payload?.role) return null;
  if (payload.exp < Date.now()) return null; // expirado

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    full_name: payload.full_name ?? null,
  };
}

/** Cierra la sesión. Stateless: no hay estado que limpiar en el servidor. */
export function signOut(): void {
  // Nada que limpiar: la sesión vive firmada en la cookie.
}
