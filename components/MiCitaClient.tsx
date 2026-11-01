"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clinic } from "@/lib/data";
import type { AppointmentView, DaySlots } from "@/lib/schedule";
import {
  cancelMyAppointment,
  fetchAvailability,
  rescheduleMyAppointment,
} from "@/lib/schedule/actions";
import { cn, formatDateLongMX, timeLabel, waLink } from "@/lib/utils";
import { Button, Card, Icon, TodoChip } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

const modLabel = (m: string) =>
  m === "enlinea" ? "En línea" : m === "presencial" ? "Presencial" : m;

function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00-06:00`).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Gestión de la cita desde el enlace único (R4-A, 5.07). La cita llega
 * por props desde la base de datos; cancelar y reprogramar son server
 * actions reales (con anti-doble-reserva en el movimiento).
 */
export function MiCitaClient({
  appointment,
}: {
  appointment: AppointmentView | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelArmed, setCancelArmed] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [availDays, setAvailDays] = useState<DaySlots[] | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newHour, setNewHour] = useState<number | null>(null);
  const reqSeq = useRef(0);

  const dates = useMemo(
    () =>
      (availDays ?? [])
        .filter((d) => d.hours.some((h) => !h.taken))
        .slice(0, 14)
        .map((d) => [d.dateIso, d.hours.filter((h) => !h.taken).length] as [string, number]),
    [availDays],
  );
  const dayHours = useMemo(
    () => (newDate ? (availDays ?? []).find((d) => d.dateIso === newDate)?.hours ?? [] : []),
    [availDays, newDate],
  );

  if (!appointment) {
    return (
      <Shell>
        <Card className="p-6">
          <h2 className="text-xl">No encontramos esa cita</h2>
          <p className="mt-3 text-ink-soft">
            El enlace no es válido o la referencia fue eliminada de la agenda. Si crees que es un
            error, escríbenos por WhatsApp y la retomamos contigo.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/agendar" variant="primary">
              Agendar una cita
            </Button>
            <Button href="/" variant="ghost">
              Ir al inicio
            </Button>
          </div>
        </Card>
      </Shell>
    );
  }

  const a = appointment;
  const waHref = waLink(
    clinic.whatsappNumber,
    `Hola, sobre mi cita ${a.token}: ${a.serviceName} con ${a.proName} el ${formatDateLongMX(a.dateIso)} a las ${timeLabel(a.hour)}.`,
  );

  async function cancel() {
    if (!cancelArmed) {
      setCancelArmed(true);
      return;
    }
    setCancelArmed(false);
    setError(null);
    setBusy(true);
    try {
      const res = await cancelMyAppointment(a.token);
      if (!res.ok) setError(res.error);
      else {
        setMsg("Tu cita fue cancelada. Si cambias de opinión, puedes agendar de nuevo.");
        router.refresh();
      }
    } catch {
      setError("No pudimos cancelar la cita. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function openMove() {
    setError(null);
    setMoveOpen(true);
    if (availDays) return;
    setAvailLoading(true);
    const seq = ++reqSeq.current;
    try {
      const res = await fetchAvailability(a.serviceSlug, a.proId);
      if (seq !== reqSeq.current) return;
      if (res.ok) setAvailDays(res.days);
      else setError(res.error);
    } catch {
      if (seq === reqSeq.current) setError("No pudimos consultar la agenda. Revisa tu conexión.");
    } finally {
      if (seq === reqSeq.current) setAvailLoading(false);
    }
  }

  async function confirmMove() {
    if (!newDate || newHour === null) return;
    setError(null);
    setBusy(true);
    try {
      const res = await rescheduleMyAppointment(a.token, newDate, newHour);
      if (!res.ok) {
        setError(res.error);
        if (res.error.includes("horario")) {
          setAvailDays(null);
          setNewDate(null);
          setNewHour(null);
        }
        return;
      }
      setMsg("Tu cita quedó reprogramada en el nuevo horario.");
      setMoveOpen(false);
      setAvailDays(null);
      setNewDate(null);
      setNewHour(null);
      router.refresh();
    } catch {
      setError("No pudimos reprogramar la cita. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const past = a.isPast && a.status === "confirmada";
  const manage = a.status === "confirmada" && !past;

  return (
    <Shell>
      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-(--radius-btn) bg-terracotta/15 px-4 py-3 text-sm font-medium text-terracotta-dark"
        >
          {error}
        </p>
      ) : null}
      {msg ? (
        <p
          role="status"
          className="mb-6 rounded-(--radius-btn) bg-sage/15 px-4 py-3 text-sm font-medium text-sage-dark"
        >
          {msg}
        </p>
      ) : null}

      <Card className="p-6">
        <h2 className="text-xl">
          {a.serviceName}
          {a.status === "confirmada" ? null : (
            <span
              className={cn(
                "ml-3 align-middle text-sm font-semibold",
                a.status === "cancelada" ? "text-terracotta-dark" : "text-sage-dark",
              )}
            >
              {a.status === "cancelada" ? "(cancelada)" : "(completada)"}
            </span>
          )}
        </h2>
        <dl className="mt-4 space-y-2 text-sm text-ink-soft">
          <div className="flex gap-2">
            <dt className="font-semibold">Modalidad:</dt>
            <dd>{modLabel(a.modality)}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">Profesional:</dt>
            <dd>
              {a.proName} <TodoChip>TODO: profesional de muestra (D8)</TodoChip>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Fecha:</dt>
            <dd>{formatDateLongMX(a.dateIso)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Hora:</dt>
            <dd>{timeLabel(a.hour)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Duración:</dt>
            <dd>{a.duration} min</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">A nombre de:</dt>
            <dd>{a.patientName}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Referencia:</dt>
            <dd>
              <span className="rounded bg-sand px-2 py-0.5 font-mono text-xs">{a.token}</span>
            </dd>
          </div>
        </dl>
        {a.note ? (
          <p className="mt-4 text-sm text-ink-soft">
            <span className="font-semibold">Tu nota:</span> {a.note}
          </p>
        ) : null}
        {past ? (
          <p className="mt-4 rounded-(--radius-btn) bg-mist px-4 py-3 text-sm text-ink-soft">
            Esta cita ya pasó. Si necesitas otra, agéndala desde el sitio o escríbenos.
          </p>
        ) : null}
        {manage && !a.canPatientManage ? (
          <p className="mt-4 rounded-(--radius-btn) bg-mist px-4 py-3 text-sm text-ink-soft">
            Faltan menos de {a.cutoffHours} h para tu cita, así que no puedes modificarla en línea
            (política provisional — decisión D4 pendiente). Escríbenos por WhatsApp y la ajustamos.
          </p>
        ) : null}
        <p className="mt-4 rounded-(--radius-btn) bg-mist px-4 py-3 text-sm text-ink-soft">
          <TodoChip>TODO: confirmación por email (Resend) en cuanto haya credenciales</TodoChip>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={waHref}
            target="_blank"
            rel="noopener"
            className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-terracotta px-5 py-2.5 font-semibold text-ink no-underline hover:bg-terracotta-dark"
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            Escribir por WhatsApp
          </a>
          {manage && a.canPatientManage ? (
            <>
              <Button variant="ghost" onClick={() => (moveOpen ? setMoveOpen(false) : openMove())}>
                {moveOpen ? "Cerrar reprogramación" : "Reprogramar"}
              </Button>
              {cancelArmed ? (
                <Button variant="primary" onClick={cancel} disabled={busy}>
                  Sí, cancelar definitivamente
                </Button>
              ) : (
                <Button variant="ghost" onClick={cancel} disabled={busy}>
                  Cancelar cita
                </Button>
              )}
            </>
          ) : null}
          <Button href="/agendar" variant="ghost">
            Agendar otra
          </Button>
        </div>

        {moveOpen ? (
          <div className="mt-6 border-t border-ink/10 pt-6">
            <h3 className="text-lg">Elige el nuevo horario</h3>
            {availLoading ? (
              <p role="status" className="mt-3 text-sm text-ink-soft">
                Consultando la agenda de {a.proName}…
              </p>
            ) : dates.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">
                No hay cupos en línea para esta combinación; usa WhatsApp y lo resolvemos.
              </p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Días disponibles">
                  {dates.map(([iso, n]) => (
                    <button
                      key={iso}
                      type="button"
                      aria-pressed={newDate === iso}
                      onClick={() => {
                        setNewDate(iso);
                        const first = (availDays ?? [])
                          .find((d) => d.dateIso === iso)
                          ?.hours.find((h) => !h.taken);
                        setNewHour(first ? first.hour : null);
                      }}
                      className={cn(
                        "min-h-11 rounded-(--radius-btn) border-2 px-4 py-2 text-sm font-semibold",
                        newDate === iso
                          ? "border-sage bg-sage text-white"
                          : "border-sage/40 bg-white text-ink hover:border-sage hover:bg-sage/10",
                      )}
                    >
                      {shortDate(iso)}
                      <span className={cn("ml-1 text-xs font-normal", newDate === iso ? "text-white/85" : "text-ink-soft")}>
                        ({n})
                      </span>
                    </button>
                  ))}
                </div>
                {newDate ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Horarios">
                    {dayHours.map((s) => (
                      <button
                        key={s.hour}
                        type="button"
                        disabled={s.taken}
                        aria-pressed={newHour === s.hour}
                        onClick={() => setNewHour(s.hour)}
                        className={cn(
                          "min-h-11 rounded-(--radius-btn) border-2 px-2 py-2 text-sm font-semibold",
                          s.taken
                            ? "cursor-not-allowed border-mist bg-mist text-ink-soft line-through"
                            : newHour === s.hour
                              ? "border-sage bg-sage text-white"
                              : "border-sage/40 bg-white text-ink hover:border-sage hover:bg-sage/10",
                        )}
                      >
                        {timeLabel(s.hour)}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    disabled={!newDate || newHour === null || busy}
                    onClick={confirmMove}
                  >
                    {busy ? "Moviendo…" : "Confirmar nuevo horario"}
                  </Button>
                  <Button variant="ghost" onClick={() => setMoveOpen(false)}>
                    Descartar
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <Reveal>
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-sage">Mi cita</p>
        <h1 className="text-3xl leading-tight sm:text-4xl">Tu cita</h1>
      </Reveal>
      <Reveal delay={100}>
        <div className="mt-8">{children}</div>
      </Reveal>
    </div>
  );
}
