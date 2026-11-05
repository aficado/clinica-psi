"use client";

// ============================================================
// AJUSTES DE AGENDA (R4-B-3, PB-1): anticipación para cancelar,
// ventana de reserva y zona horaria. Escritura validada en el
// servidor (`saveBooking` → RBAC admin + auditoría).
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBooking } from "@/lib/content/actions";
import { Button, Card, Icon } from "@/components/ui";

const TIMEZONES: { id: string; label: string }[] = [
  { id: "America/Mexico_City", label: "Ciudad de México (GMT‑6)" },
  { id: "America/Cancun", label: "Cancún / Quintana Roo (GMT‑5)" },
  { id: "America/Merida", label: "Mérida (GMT‑6)" },
  { id: "America/Monterrey", label: "Monterrey (GMT‑6)" },
  { id: "America/Tijuana", label: "Tijuana / Baja California (GMT‑8)" },
  { id: "America/Hermosillo", label: "Hermosillo / Sonora (GMT‑7)" },
  { id: "America/Chihuahua", label: "Chihuahua (GMT‑7)" },
  { id: "UTC", label: "UTC" },
];

export function BookingSettings({
  initial,
}: {
  initial: { cancelCutoffHours: number; bookingWindowDays: number; timeZone: string };
}) {
  const router = useRouter();
  const [cutoff, setCutoff] = useState(String(initial.cancelCutoffHours));
  const [windowDays, setWindowDays] = useState(String(initial.bookingWindowDays));
  const [timeZone, setTimeZone] = useState(initial.timeZone);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty =
    cutoff !== String(initial.cancelCutoffHours) ||
    windowDays !== String(initial.bookingWindowDays) ||
    timeZone !== initial.timeZone;

  async function onSave() {
    setBusy(true);
    setMsg(null);
    const res = await saveBooking({
      cancelCutoffHours: Number(cutoff),
      bookingWindowDays: Number(windowDays),
      timeZone,
    });
    setBusy(false);
    setMsg(
      res.ok
        ? { kind: "ok", text: "Ajustes guardados. El sitio ya usa la nueva política." }
        : { kind: "err", text: res.error },
    );
    if (res.ok) router.refresh();
  }

  let localClock = "";
  try {
    localClock = new Intl.DateTimeFormat("es-MX", {
      timeZone,
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
  } catch {
    localClock = "";
  }

  return (
    <div className="space-y-6">
      {msg ? (
        <p
          role="status"
          className={
            msg.kind === "ok"
              ? "rounded-(--radius-btn) bg-sage/15 px-4 py-3 text-sm font-medium text-sage-dark"
              : "rounded-(--radius-btn) bg-terracotta/15 px-4 py-3 text-sm font-medium text-terracotta-dark"
          }
        >
          {msg.text}
        </p>
      ) : null}

      <Card className="p-6">
        <h2 className="text-xl">Política de citas</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Estos valores rigen el flujo de agendado y de <code>/mi-cita</code> en todo el sitio.
        </p>
        <div className="mt-4 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Horas de anticipación para cancelar o mover una cita</span>
            <span className="text-ink-soft">
              El paciente solo puede autogestionar su cita si faltan al menos estas horas (5.07).
              El administrador siempre puede cancelar.
            </span>
            <input
              type="number"
              min={0}
              max={720}
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value)}
              className="h-12 w-40 rounded-(--radius-input) border border-ink/15 bg-white px-3 font-mono"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Ventana de reserva (días hacia el futuro)</span>
            <span className="text-ink-soft">
              Hasta cuántos días adelante se puede agendar. La gente ve el calendario completo,
              pero no podrá reservar más allá de la ventana (D-R4-B-5).
            </span>
            <input
              type="number"
              min={1}
              max={730}
              value={windowDays}
              onChange={(e) => setWindowDays(e.target.value)}
              className="h-12 w-40 rounded-(--radius-input) border border-ink/15 bg-white px-3 font-mono"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Zona horaria del sitio</span>
            <span className="text-ink-soft">
              Se usa para mostrar fechas y horas en el panel. Cambiarla no mueve las citas
              existentes (D-R4-4).
            </span>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="h-12 w-full max-w-md rounded-(--radius-input) border border-ink/15 bg-white px-3"
            >
              {!TIMEZONES.some((t) => t.id === timeZone) ? (
                <option value={timeZone}>{timeZone}</option>
              ) : null}
              {TIMEZONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {localClock ? (
              <span className="flex items-center gap-2 text-sm text-ink-soft">
                <Icon name="clock" className="h-4 w-4" />
                Hora allí ahora: {localClock}
              </span>
            ) : null}
          </label>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={onSave} disabled={busy || !dirty}>
            {busy ? "Guardando…" : "Guardar ajustes"}
          </Button>
          {!dirty ? <span className="text-sm text-ink-soft">sin cambios</span> : null}
        </div>
      </Card>
    </div>
  );
}
