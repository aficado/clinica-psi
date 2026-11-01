"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "@/lib/admin/actions";
import { setStoredSession } from "@/lib/admin/storage";
import { TodoChip } from "@/components/ui";
import { Icon } from "@/components/ui";

/**
 * Login del panel admin (R3-A, 8.01).
 *
 * Autenticación demo (email/password) contra el experimento en
 * `lib/admin/store.ts`. Al iniciar, la sesión se guarda en la cookie
 * `rv_admin_session` (servidor) y en `localStorage` (cliente, para el
 * rol). La recuperación de contraseña es una demo (8.01).
 *
 * Credenciales de demo (todas /demo123):
 *   admin@raizviva.mx · terapista@raizviva.mx · asistente@raizviva.mx
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error);
      } else if (res.profile) {
        setStoredSession(res.profile);
        window.location.href = "/admin";
      }
    } catch {
      setError("No se pudo iniciar sesión. Verifica tus datos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-mist px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-sage">
          <Icon name="arrow" className="h-4 w-4 rotate-180" />
          Volver al sitio
        </Link>

        <div className="mt-8 rounded-(--radius-card) bg-white px-6 py-8 shadow-[0_8px_24px_rgba(31,42,39,0.08)]">
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon name="leaf" className="h-6 w-6 text-sage" />
              <span className="text-lg font-semibold text-ink">Raíz Viva Admin</span>
            </div>
            <h1 className="text-2xl font-semibold text-ink">Iniciar sesión</h1>
            <p className="text-sm text-ink-soft">
              Acceso para personal autorizado de la clínica.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Correo</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="t@raizviva.mx"
                className="h-12 rounded-(--radius-input) border border-ink/15 bg-white px-3 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-(--radius-input) border border-ink/15 bg-white px-3 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
              />
            </label>

            {error ? (
              <div
                role="alert"
                className="rounded-(--radius-input) bg-terracotta/10 px-3 py-2 text-sm text-terracotta-dark"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn flex h-12 items-center justify-center rounded-(--radius-btn) bg-terracotta px-4 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Iniciando…" : "Entrar"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setError("Usa una credencial de demo (ver abajo).")}
              disabled={loading}
              className="text-sage hover:underline disabled:opacity-40"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <p className="mt-6 rounded-(--radius-input) bg-mist px-3 py-2 text-xs text-ink-soft">
            <TodoChip>Protegido</TodoChip> — acceso con recuperación de contraseña y
            control por rol (RBAC).
          </p>
        </div>

        <div className="mt-4 rounded-(--radius-input) bg-white px-3 py-2 text-xs text-ink-soft shadow-[0_2px_8px_rgba(31,42,39,0.06)]">
          <p className="font-semibold text-ink-soft">Demo (almacenamiento experimental):</p>
          <ul className="mt-1 space-y-0.5">
            <li>admin@raizviva.mx · demo123 (Administrador)</li>
            <li>therapista@raizviva.mx · demo123 (Terapeuta)</li>
            <li>asistente@raizviva.mx · demo123 (Asistente)</li>
          </ul>
        </div>

        <p className="mt-4 text-center text-xs text-ink-soft">
          ¿Problemas para entrar? Contacta al administrador del panel.
        </p>
      </div>
    </div>
  );
}
