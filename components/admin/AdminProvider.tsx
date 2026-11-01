"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getStoredSession } from "@/lib/admin/storage";

/**
 * Proveedor de sesión del panel admin (R3-A, 8.01).
 *
 * Expone `useAdminSession()`. La sesión se valida en el servidor por la
 * cookie `rv_admin_session` (ver `lib/admin/session.ts`); este proveedor
 * solo alimenta la UI del cliente. Recibe la sesión sembrada desde el
 * servidor (`session`) para que el contexto tenga valor durante el SSR y
 * luego sincroniza desde `localStorage`.
 */
export interface AdminSession {
  user: { id: string; email: string };
}

const AdminSessionContext = createContext<AdminSession | null | undefined>(
  undefined,
);

export function AdminProvider({
  children,
  session: initialSession,
}: {
  children: ReactNode;
  /** Sesión sembrada desde el servidor (SSR). Opcional. */
  session?: AdminSession;
}) {
  const [session, setSession] = useState<AdminSession | null>(
    initialSession ?? null,
  );
  const [loading, setLoading] = useState(initialSession === undefined);

  useEffect(() => {
    const stored = getStoredSession();
    setSession(
      stored ? { user: { id: stored.userId, email: stored.email } } : null,
    );
    setLoading(false);
  }, []);

  return (
    <AdminSessionContext.Provider value={loading ? undefined : session}>
      {children}
    </AdminSessionContext.Provider>
  );
}

/** Devuelve la sesión actual (o `undefined` mientras carga). */
export function useAdminSession(): AdminSession | null | undefined {
  const ctx = useContext(AdminSessionContext);
  if (ctx === undefined) {
    throw new Error("useAdminSession debe usarse dentro de <AdminProvider>.");
  }
  return ctx;
}
