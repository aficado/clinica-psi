"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getStoredSession } from "@/lib/admin/storage";
import type { Profile } from "@/lib/admin/store";
import { useAdminSession } from "./AdminProvider";

/**
 * Proveedor de perfil de usuario (R3-A, 8.02).
 *
 * El rol no vive en la sesión del experimento, sino en el perfil guardado
 * en `localStorage`. Este proveedor lee el perfil del usuario
 * autenticado y lo expone vía `useProfile()`. Todo el panel admin debe
 * vivir dentro de este proveedor (y de `AdminProvider`).
 *
 * Recibe el perfil sembrado desde el servidor (`profile`) para el SSR;
 * luego sincroniza desde `localStorage` en el cliente.
 */
const ProfileContext = createContext<Profile | null | undefined>(undefined);

export function ProfileProvider({
  children,
  profile: initialProfile,
}: {
  children: ReactNode;
  /** Perfil sembrado desde el servidor (SSR). Opcional. */
  profile?: Profile;
}) {
  const session = useAdminSession();
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [loading, setLoading] = useState(initialProfile === undefined);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const stored = getStoredSession();
    setProfile(stored?.profile ?? null);
    setLoading(false);
  }, [session]);

  return (
    <ProfileContext.Provider value={loading ? undefined : profile}>
      {children}
    </ProfileContext.Provider>
  );
}

/** Devuelve el perfil del usuario autenticado (o `undefined` si carga). */
export function useProfile(): Profile | null | undefined {
  const ctx = useContext(ProfileContext);
  if (ctx === undefined) {
    throw new Error("useProfile debe usarse dentro de <ProfileProvider>.");
  }
  return ctx;
}
