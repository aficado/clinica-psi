// ============================================================
// SERVER ACTIONS — Panel admin (Fase 3, R3-A)
//
// Almacenamiento experimental (memoria + cookie `rv_admin_session`).
// Sin base de datos real. La validación de rol (RBAC) se hace contra
// el perfil del experimento en `lib/admin/store.ts`. La sesión es
// stateless y está firmada en `lib/admin/session.ts`.
// ============================================================

"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  signIn as storeSignIn,
  type Profile,
} from "@/lib/admin/store";
import { createSession, signOut as storeSignOut } from "@/lib/admin/session";

const SESSION_COOKIE = "rv_admin_session";

/**
 * Inicia sesión con credenciales demo. Guarda la sesión en la cookie
 * `rv_admin_session` y en localStorage (vía el cliente tras el retorno)
 * y redirige al dashboard.
 *
 * Devuelve `{ error }` si las credenciales son incorrectas.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ error?: string; profile?: Profile }> {
  const profile = storeSignIn(email, password);
  if (!profile) {
    return {
      error: "Correo o contraseña incorrectos. Intenta de nuevo.",
    };
  }
  const token = createSession(profile);
  // Solo marcar `Secure` si la conexión es HTTPS real. Se detecta por el
  // encabezado `x-forwarded-proto` que pone el proxy/terminación TLS. En una
  // conexión HTTP directa (como esta demo) el encabezado no llega, así que la
  // cookie se guarda normalmente y el login funciona por HTTP.
  const forwardedProto = (await headers()).get("x-forwarded-proto");
  const isHttps = forwardedProto === "https";
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 h
  });
  return { profile };
}

/** Cierra la sesión y vuelve al login. Stateless: solo se borra la cookie. */
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  storeSignOut();
  redirect("/admin/login");
}
