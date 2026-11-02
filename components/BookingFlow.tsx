"use client";

import { useEffect, useState } from "react";
import { clinic } from "@/lib/data";
import type { Professional, Service } from "@/lib/data";
import { professionalsFor } from "@/lib/slots";
import { bookAppointment } from "@/lib/schedule/actions";
import { cn, formatDateLongMX, timeLabel, waLink } from "@/lib/utils";
import { setBookingState, getBookingState, clearBookingState } from "@/lib/cookies";
import { Button, Card, Icon, TodoChip } from "./ui";
import { CalendarView } from "./CalendarView";

/** `Date` → `YYYY-MM-DD` en la zona horaria del navegador (para restaurar el estado de la agenda). */
function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Pasos que viven en cookies (`booking_state`): no se pierden al recargar o navegar (R4-B).
 *  Máquina de pasos REAL (R4-A): 0=Servicio, 1=Modalidad, 2=Profesional, 3=Horario (calendario),
 *  4=Tus datos; 5="done" NO se guarda (se alcanza solo con cita confirmada). */
const COOKIE_STEP = 4;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface BookingInitial {
  service?: string;
  mode?: string;
  pro?: string;
}

const STEPS = ["Servicio", "Modalidad", "Profesional", "Horario", "Tus datos"];

const modLabel = (m: string) =>
  m === "enlinea" ? "En línea" : m === "presencial" ? "Presencial" : m;


interface NormalizedInitial {
  service: string | null;
  mode: "presencial" | "enlinea" | null;
  pro: string | null;
  step: number;
}

function normalizeInitial(
  service?: string,
  mode?: string,
  pro?: string,
  services: Service[] = [],
  pros: Professional[] = [],
): NormalizedInitial {
  const svc = service ? services.find((s) => s.slug === service) : undefined;
  if (!svc) {
    return { service: null, mode: null, pro: null, step: 0 };
  }
  const m = mode === "presencial" || mode === "enlinea" ? mode : null;
  const modeOk = m && svc.modalities.includes(m) ? m : null;
  const proOk =
    modeOk && pro && professionalsFor(svc, modeOk, pros).some((p) => p.id === pro) ? pro : null;
  const step = proOk ? 3 : modeOk ? 2 : 1;
  return { service: svc.slug, mode: modeOk, pro: proOk, step };
}

/**
 * Flujo de reserva en 4 pasos (R4-A: 5.05 sobre la agenda REAL; R4-B: calendario de mes completo,
 * cualquier día del año seleccionable + cookies `booking_state`).
 * La disponibilidad la consulta el calendario (`CalendarView`, mes completo por acción) y la cita se
 * registra en la base de datos (`bookAppointment`) con anti-doble-reserva transaccional (5.04). El
 * enlace `/mi-cita/<token>` funciona ahora desde cualquier dispositivo.
 * TODO (R4-D): confirmación por email con Resend cuando haya credenciales (la cola `notifications`
 * ya encola el pendiente).
 */
export function BookingFlow({
  initial,
  services,
  professionals,
}: {
  initial: BookingInitial;
  services: Service[];
  professionals: Professional[];
}) {
  const init = normalizeInitial(initial.service, initial.mode, initial.pro, services, professionals);

  const [step, setStep] = useState(init.step);
  const [serviceSlug, setServiceSlug] = useState<string | null>(init.service);
  const [modality, setModality] = useState<"presencial" | "enlinea" | null>(init.mode);
  const [proId, setProId] = useState<string | null>(init.pro);
  const [dateIso, setDateIso] = useState<string | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ token: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // La disponibilidad la maneja `CalendarView` (mes completo al elegir el profesional); aquí solo se
  // mantiene el mes visible para restaurarlo desde la cookie. D-R4-B-1: cualquier día es seleccionable.
  const [monthIso, setMonthIso] = useState<string>(() => localIso(new Date()).slice(0, 7));

  const service = serviceSlug ? services.find((s) => s.slug === serviceSlug) ?? null : null;
  const pro = proId ? professionals.find((p) => p.id === proId) ?? null : null;
  const pros = service && modality ? professionalsFor(service, modality, professionals) : [];

  function clearDownstream(resetFrom: "service" | "mode" | "pro") {
    if (resetFrom !== "pro") setProId(null);
    if (resetFrom !== "pro" && resetFrom !== "mode") setModality(null);
    setDateIso(null);
    setHour(null);
    setError(null);
  }

  /** Guardar lo que lleva el paciente para no perderlo si recarga o va a `/privacidad` (R4-B).
   *  Las llaves con `null` se BORRAN (misma firma: `dateIso: null` limpia la fecha guardada). */
  function writeState(partial: Record<string, unknown>): void {
    setBookingState({ ...getBookingState(), ...partial });
  }

  /** Leer el estado guardado al montar (`booking_state`); `{}` si no hay nada usable. */
  function cookieState(): Record<string, unknown> {
    const saved = getBookingState();
    if (!saved || typeof saved !== "object" || Object.keys(saved).length === 0) return {};

    // Validar contra el catálogo ACTUAL: el servicio/profesional pudo haber cambiado desde
    // que se guardó; algo invalidado se descarta en cadena (menor dato → menor paso).
    const svc =
      typeof saved.serviceSlug === "string"
        ? services.find((s) => s.slug === saved.serviceSlug) ?? null
        : null;
    if (!svc) return {};

    const modality =
      typeof saved.modality === "string" &&
      (saved.modality === "presencial" || saved.modality === "enlinea") &&
      svc.modalities.includes(saved.modality)
        ? (saved.modality as "presencial" | "enlinea")
        : null;
    const proId =
      modality &&
      typeof saved.proId === "string" &&
      professionalsFor(svc, modality, professionals).some((p) => p.id === saved.proId)
        ? (saved.proId as string)
        : null;
    const dateIso =
      typeof saved.dateIso === "string" && ISO_DATE_RE.test(saved.dateIso)
        ? saved.dateIso
        : null;
    const hour =
      typeof saved.hour === "number" &&
      Number.isInteger(saved.hour) &&
      saved.hour >= 0 &&
      saved.hour <= 23 &&
      dateIso
        ? (saved.hour as number)
        : null;
    const monthIso =
      typeof saved.monthIso === "string" && /^\d{4}-\d{2}$/.test(saved.monthIso)
        ? (saved.monthIso as string)
        : dateIso
          ? dateIso.slice(0, 7)
          : null;

    // Paso guardado, CLAMPEADO a los pasos reales (0–4; el paso 5 "done" no se restaura).
    let st =
      typeof saved.step === "number" && Number.isInteger(saved.step) ? saved.step : 0;
    st = Math.min(Math.max(st, 0), COOKIE_STEP);
    if (st >= 4 && hour === null) st = 3;
    if (st >= 3 && proId === null) st = 2;
    if (st >= 2 && modality === null) st = 1;
    st = Math.min(Math.max(st, 1), COOKIE_STEP);

    return { ...saved, serviceSlug: svc.slug, modality, proId, dateIso, hour, monthIso, step: st };
  }

  useEffect(() => {
    const saved = cookieState();
    if (Object.keys(saved).length === 0) return;
    if (typeof saved.serviceSlug === "string") setServiceSlug(saved.serviceSlug);
    setModality((saved.modality as "presencial" | "enlinea" | null) ?? null);
    setProId((saved.proId as string | null) ?? null);
    setDateIso((saved.dateIso as string | null) ?? null);
    setHour((saved.hour as number | null) ?? null);
    if (typeof saved.monthIso === "string") setMonthIso(saved.monthIso);
    if (typeof saved.step === "number") setStep(saved.step);
    // Re-normalizar la cookie: nada de lo invalidado sobrevive (R4-B).
    setBookingState({
      serviceSlug: saved.serviceSlug,
      modality: saved.modality ?? null,
      proId: saved.proId ?? null,
      dateIso: saved.dateIso ?? null,
      hour: saved.hour ?? null,
      monthIso: saved.monthIso ?? null,
      step: saved.step,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Mes visible al elegir el profesional (usado por `CalendarView`). */
  function monthFor(iso: string | null): string {
    return iso ? iso.slice(0, 7) : localIso(new Date());
  }

  function pickService(slug: string) {
    const svc = services.find((s) => s.slug === slug);
    if (!svc) return;
    clearDownstream("service");
    setServiceSlug(slug);
    const single = svc.modalities.length === 1;
    if (single) setModality(svc.modalities[0]);
    const nextStep = single ? 2 : 1;
    setStep(nextStep);
    // La cookie se escribe completa: lo que trae queda invalidado por el nuevo servicio.
    writeState({
      serviceSlug: slug,
      modality: single ? svc.modalities[0] : null,
      proId: null,
      dateIso: null,
      hour: null,
      step: nextStep,
    });
  }

  function pickModality(m: "presencial" | "enlinea") {
    clearDownstream("mode");
    setModality(m);
    setStep(2);
    writeState({ modality: m, proId: null, dateIso: null, hour: null, step: 2 });
  }

  function pickPro(id: string) {
    clearDownstream("pro");
    setProId(id);
    setStep(3);
    writeState({ proId: id, dateIso: null, hour: null, step: 3 });
  }

  /** Selecciona día y hora desde el calendario (R4-B): se queda en el paso 3 (el "Cuándo"); se
   *  pasa al paso 4 "Tus datos" con el botón Continuar. */
  function pickDateAndHour(iso: string, hour: number) {
    setError(null);
    setDateIso(iso);
    setHour(hour);
    setMonthIso(monthFor(iso));
    writeState({ dateIso: iso, hour, step: 3, monthIso: monthFor(iso) });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !pro || !modality || !dateIso || hour === null || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await bookAppointment({
        serviceSlug: service.slug,
        proId: pro.id,
        modality,
        dateIso,
        hour,
        name,
        phone,
        email,
        note,
        consent,
      });
      if (!res.ok) {
        setError(res.error);
        // Si el slot se ocupó mientras tanto, borrar la selección para pedir otro (el
        // calendario vuelve a consultar al montarse de nuevo).
        if (res.error.includes("horario")) {
          setHour(null);
          setDateIso(null);
        }
        return;
      }
      setDone({ token: res.token ?? "" });
      setStep(5);
      // Cita confirmada: el estado guardado ya no representa nada (y así una
      // recarga de la página de confirmación no restaura el flujo viejo).
      clearBookingState();
    } catch {
      setError("No pudimos registrar la cita. Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    clearBookingState();
    setDone(null);
    setStep(0);
    setServiceSlug(null);
    setModality(null);
    setProId(null);
    setDateIso(null);
    setHour(null);
    setName("");
    setPhone("");
    setEmail("");
    setNote("");
    setConsent(false);
    setError(null);
    setCopied(false);
  }

  async function copyLink() {
    if (!done) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/mi-cita/${done.token}`);
      setCopied(true);
    } catch {
      setError("No pudimos copiar el enlace automáticamente.");
    }
  }

  const waText =
    done && service && pro && dateIso && hour !== null
      ? `Hola, acabo de agendar ${service.name} (${modLabel(modality ?? "presencial")}) con ${pro.name} el ${formatDateLongMX(dateIso)} a las ${timeLabel(hour)}. Nombre: ${name.trim()}. Referencia: ${done.token}.`
      : "Hola, me gustaría más información.";

  const summary = (svc: NonNullable<typeof service>, pr: NonNullable<typeof pro>) => (
    <dl className="mt-4 space-y-2 text-sm text-ink-soft">
      <div className="flex gap-2">
        <dt className="font-semibold">Servicio:</dt>
        <dd>{svc.name}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="font-semibold">Modalidad:</dt>
        <dd>{modLabel(modality ?? "presencial")}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="font-semibold">Profesional:</dt>
        <dd>{pr.name}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="font-semibold">Fecha:</dt>
        <dd>{dateIso ? formatDateLongMX(dateIso) : ""}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="font-semibold">Hora:</dt>
        <dd>{hour !== null ? timeLabel(hour) : ""}</dd>
      </div>
    </dl>
  );

  return (
    <div>
      {step < 5 ? (
        <ol aria-label="Progreso de la reserva" className="mt-6 flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <li key={label}>
              <span
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
                  i < step
                    ? "bg-sage/15 text-sage-dark"
                    : i === step
                      ? "bg-sage text-white"
                      : "bg-mist text-ink-soft",
                )}
              >
                <span aria-hidden="true">{i + 1}.</span>
                {label}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-(--radius-btn) bg-terracotta/15 px-4 py-3 text-sm font-medium text-terracotta-dark"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        {step === 0 ? (
          <section aria-labelledby="bk-paso1">
            <h2 id="bk-paso1" className="text-xl">
              ¿Qué servicio quieres?
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => pickService(s.slug)}
                  className="btn rounded-(--radius-card) border-2 border-sage/40 bg-white p-4 text-left font-semibold hover:border-sage hover:bg-sage/10"
                >
                  {s.name}
                  <span className="mt-1 block text-sm font-normal text-ink-soft">
                    {s.duration} min · {s.modalities.map(modLabel).join(" / ")}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === 1 && service ? (
          <section aria-labelledby="bk-paso2">
            {/* PB-1 (R4-B-BUG-1): "Volver" arriba de todo el paso, no al pie. */}
            <div className="mb-5 flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Volver
              </Button>
            </div>
            <h2 id="bk-paso2" className="text-xl">
              ¿Presencial o en línea?
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {service.name} se ofrece en estas modalidades:
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {service.modalities.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => pickModality(m)}
                  className="btn rounded-(--radius-card) border-2 border-sage/40 bg-white p-4 text-left font-semibold hover:border-sage hover:bg-sage/10"
                >
                  {modLabel(m)}
                  <span className="mt-1 block text-sm font-normal text-ink-soft">
                    {m === "enlinea"
                      ? "Videoconsulta desde casa, sin traslado."
                      : "Sesión en la clínica, con acompañamiento presencial."}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {step === 2 && service && modality ? (
          <section aria-labelledby="bk-paso3">
            {/* PB-1 (R4-B-BUG-1): "Volver" arriba de todo el paso, no al pie. */}
            <div className="mb-5 flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Volver
              </Button>
            </div>
            <h2 id="bk-paso3" className="text-xl">
              ¿Con quién?
            </h2>
            {pros.length === 0 ? (
              <p className="mt-4 text-ink-soft">
                No hay profesionales disponibles para {service.name} en modalidad{" "}
                {modLabel(modality)}.
                <a
                  href={waLink(
                    clinic.whatsappNumber,
                    `Hola, quiero información sobre ${service.name} (${modLabel(modality)}).`,
                  )}
                  target="_blank"
                  rel="noopener"
                  className="ml-2 font-semibold text-sage-dark no-underline underline"
                >
                  Escríbenos por WhatsApp
                </a>
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {pros.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickPro(p.id)}
                    className="btn w-full rounded-(--radius-card) border-2 border-sage/40 bg-white p-4 text-left font-semibold hover:border-sage hover:bg-sage/10"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      {p.name}
                      <TodoChip>TODO: profesional de muestra</TodoChip>
                    </span>
                    <span className="mt-1 block text-sm font-normal text-ink-soft">{p.role}</span>
                    <span className="mt-1 block text-sm text-ink-soft">
                      {p.days.length === 6 ? "Lunes a sábado" : "Lunes a viernes"} ·{" "}
                      {String(p.open).padStart(2, "0")}:00–{String(p.close).padStart(2, "0")}:00
                    </span>
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" className="mt-6" onClick={() => setStep(1)}>
              Volver
            </Button>
          </section>
        ) : null}

        {step === 3 && service && pro ? (
          <section aria-labelledby="bk-paso4">
            <h2 id="bk-paso4" className="text-xl">
              ¿Cuándo?
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Elige un día de la agenda de {pro.name}: los días fuera de su horario se ven pero no
              se pueden seleccionar.
            </p>
            <Card className="mt-4 p-6">
              <CalendarView
                proId={pro.id}
                dateIso={dateIso}
                hour={hour}
                onSelect={pickDateAndHour}
                onNavigate={(m) => setMonthIso(m)}
              />
              {/* Volver SIEMPRE visible (corrección ronda 15): antes la persona
                  que llegaba al calendario sin elegir fecha/hora se quedaba
                  atrapada — el botón vivía dentro del `dateIso && hour` check. */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Volver
                </Button>
                {dateIso && hour !== null ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setError(null);
                      // Paso 4 real = "Tus datos" (0=Servicio … 3=Horario, 4=Datos).
                      setStep(4);
                      writeState({ step: 4 });
                    }}
                  >
                    Continuar
                  </Button>
                ) : null}
              </div>
            </Card>
          </section>
        ) : null}
        {step === 4 && service && pro && modality && dateIso && hour !== null ? (
          <form onSubmit={submit} noValidate>
            <h2 id="bk-paso5" className="text-xl">
              Tus datos
            </h2>
            <Card className="mt-4 p-5">
              <h3 className="text-lg">Resumen de tu cita</h3>
              {summary(service, pro)}
            </Card>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="bk-nombre" className="mb-1 block text-sm font-semibold">
                  Nombre completo
                </label>
                <input
                  id="bk-nombre"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="bk-correo" className="mb-1 block text-sm font-semibold">
                  Correo electrónico
                </label>
                <input
                  id="bk-correo"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="bk-tel" className="mb-1 block text-sm font-semibold">
                  Teléfono <span className="font-normal text-ink-soft">(opcional)</span>
                </label>
                <input
                  id="bk-tel"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="55 1234 5678"
                  className="w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="bk-nota" className="mb-1 block text-sm font-semibold">
                  Nota <span className="font-normal text-ink-soft">(opcional)</span>
                </label>
                <textarea
                  id="bk-nota"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="¿Algo que debamos saber antes de tu cita?"
                  className="w-full rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
                />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-5 w-5 accent-sage"
                />
                <span>
                  Acepto el{" "}
                  <a
                    href="/privacidad"
                    className="font-semibold text-sage-dark no-underline underline"
                  >
                    aviso de privacidad
                  </a>{" "}
                  y entiendo que mi cita queda registrada en la agenda de la clínica. Mientras la
                  confirmación por correo no esté activada, te escribiremos por WhatsApp.
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="ghost" type="button" onClick={() => setStep(3)}>
                Volver
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Registrando…" : "Confirmar cita"}
              </Button>
            </div>
          </form>
        ) : null}

        {step === 5 && done && service && pro ? (
          <div role="status" className="space-y-6">
            <Card className="p-6">
              <p className="flex items-center gap-2 text-xl font-semibold text-sage-dark">
                <Icon name="check" className="h-6 w-6" />
                Tu cita quedó agendada
              </p>
              {summary(service, pro)}
              <div className="mt-3 flex gap-2 text-sm text-ink-soft">
                <dt className="font-semibold">Referencia:</dt>
                <dd>
                  <span className="rounded bg-sand px-2 py-0.5 font-mono text-xs">
                    {done.token}
                  </span>
                </dd>
              </div>
              <p className="mt-4 text-sm text-ink-soft">
                Guarda el enlace de tu cita: con él puedes ver, reprogramar o cancelar desde
                cualquier dispositivo, sin llamar.
              </p>
              <p className="mt-3 rounded-(--radius-btn) bg-mist px-4 py-3 text-sm text-ink-soft">
                <TodoChip>
                  TODO: confirmación por email (Resend) en cuanto haya credenciales (la cola de
                  correos ya encola el pendiente)
                </TodoChip>
              </p>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button href={`/mi-cita/${done.token}`} variant="primary">
                Ver mi cita
              </Button>
              <Button type="button" variant="ghost" onClick={copyLink}>
                {copied ? "Enlace copiado" : "Copiar enlace"}
              </Button>
              <a
                href={waLink(clinic.whatsappNumber, waText)}
                target="_blank"
                rel="noopener"
                className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) border-2 border-sage/40 px-5 py-2.5 font-semibold text-sage no-underline hover:border-sage hover:bg-sage/10"
              >
                <Icon name="whatsapp" className="h-4 w-4" />
                Confirmar por WhatsApp
              </a>
              <Button variant="ghost" onClick={reset}>
                Agendar otra cita
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
