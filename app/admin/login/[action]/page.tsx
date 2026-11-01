"use client";

import { useState, type FormEvent, use } from "react";
import Link from "next/link";
import { setStoredSession } from "@/lib/admin/storage";
import { Icon } from "@/components/ui";
import { DEMO_CREDENTIALS } from "@/lib/admin/store";

/**
 * Recuperación de contraseña (R3-A, 8.01) — DEMO.
 *
 * Ruta: /admin/login/[action]
 *   - `confirm` → el usuario "hizo clic" en el link de recuperación y
 *     escribe una nueva contraseña. Es una demo: restablece en memoria y
 *     regresa al login.
 *   - `verify`  → la contraseña "ya se restableció"; mensaje de éxito.
 *   - cualquier otro valor → enlace inválido.
 *
 * Sin correo real ni base de datos: es un flujo de prueba.
 */

const DEMO_EMAIL = DEMO_CREDENTIALS[0].email;
const DEMO_PASSWORD = DEMO_CREDENTIALS[0].password;

export default function RecoveryActionPage({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const action = (use(params)).action;
  const canReset = action === "confirm";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError(null);
    setLoading(true);
    // Demo: se "restablece" en memoria; la sesión real se inicia al login.
    setTimeout(() => {
      setDone(true);
      setLoading(false);
    }, 400);
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-mist px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-sage">
          <Icon name="arrow" className="h-4 w-4 rotate-180" />
          Volver al sitio
        </Link>

        <div className="mt-8 rounded-(--radius-card) bg-white px-6 py-8 shadow-[0_8px_24px_rgba(31,42,39,0.08)]">
          {done || action === "verify" ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage/15">
                <Icon name="check" className="h-7 w-7 text-sage" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-ink">¡Listo!</h1>
                <p className="mt-1 text-sm text-ink-soft">
                  tu contraseña se restableció (demo). Ya puedes iniciar sesión.
                </p>
              </div>
              <Link
                href="/admin/login"
                className="btn flex h-12 items-center justify-center rounded-(--radius-btn) bg-terracotta px-4 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : canReset ? (
            <>
              <div className="mb-6 flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-ink">Nueva contraseña</h1>
                <p className="text-sm text-ink-soft">
                  Elige una fuerte que no hayas usado antes.
                </p>
              </div>

              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-ink">Correo</span>
                  <input
                    type="email"
                    value={DEMO_EMAIL}
                    readOnly
                    className="h-12 rounded-(--radius-input) border border-ink/15 bg-mist px-3 text-ink outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-ink">Contraseña nueva</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-(--radius-input) border border-ink/15 bg-white px-3 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-ink">Confirmar contraseña</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-(--radius-input) border border-ink/15 bg-white px-3 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
                  />
                </label>

                {error ? (
                  <div role="alert" className="rounded-(--radius-input) bg-terracotta/10 px-3 py-2 text-sm text-terracotta-dark">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn flex h-12 items-center justify-center rounded-(--radius-btn) bg-terracotta px-4 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? "Guardando…" : "Guardar contraseña"}
                </button>
              </form>

              <p className="text-center text-xs text-ink-soft">
                Demo: usa la misma contraseña o una nueva (≥ 6 caracteres).
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/15">
                <Icon name="close" className="h-7 w-7 text-terracotta-dark" />
              </div>
              <p className="text-sm text-ink-soft">
                Este enlace es inválido o ya se usó. Solicita uno nuevo en el inicio
                de sesión.
              </p>
              <Link
                href="/admin/login"
                className="btn flex h-12 items-center justify-center rounded-(--radius-btn) bg-terracotta px-4 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              >
                Volver al login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
