import type { Metadata } from "next";
import { getAppointmentByToken } from "@/lib/schedule";
import { MiCitaClient } from "@/components/MiCitaClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cita",
  description:
    "Consulta el estado de la cita que agendaste y confírmala, reprogámala o cancélala desde tu enlace único.",
};

/**
 * Página server de `/mi-cita/<token>` (R4-A, 5.06/5.07): la cita se lee
 * de la base de datos por su token — el enlace funciona desde cualquier
 * dispositivo (antes vivía en `localStorage`). TODO (5.07): expiración
 * del enlace firmado, pendiente de la política D4 del dueño.
 */
export default async function MiCitaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const appointment = getAppointmentByToken(token);
  return <MiCitaClient appointment={appointment} />;
}
