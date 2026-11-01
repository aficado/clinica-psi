"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clinic } from "@/lib/data";
import type { Professional, Service } from "@/lib/data";
import { professionalsFor } from "@/lib/slots";
import type { DaySlots } from "@/lib/schedule";
import { bookAppointment, fetchAvailability } from "@/lib/schedule/actions";
import { cn, formatDateLongMX, timeLabel, waLink } from "@/lib/utils";
import { Button, Card, Icon, TodoChip } from "./ui";

interface BookingInitial {
  service?: string;
  mode?: string;
  pro?: string;
}

const STEPS = ["Servicio", "Modalidad", "Profesional", "Horario", "Tus datos"];

const modLabel = (m: string) =>
  m === "enlinea" ? "En línea" : m === "presencial" ? "Presencial" : m;

function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00-06:00`).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

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
 * Flujo de reserva en 4 pasos (R4-A: 5.05 sobre la agenda REAL).
 * La disponibilidad se consulta al servidor (`fetchAvailability`) y la
 * cita se registra en la base de datos (`bookAppointment`) con
 * anti-doble-reserva transaccional (5.04). El enlace `/mi-cita/<token>`
 * funciona ahora desde cualquier dispositivo.
 * TODO (R4-D): confirmación por email con Resend cuando haya
 * credenciales (la cola `notifications` ya encola el pendiente).
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

  // Disponibilidad real (5.03): se pide al servidor al llegar al paso 3.
  const [availDays, setAvailDays] = useState<DaySlots[] | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const reqSeq = useRef(0);

  const service = serviceSlug ? services.find((s) => s.slug === serviceSlug) ?? null : null;
  const pro = proId ? professionals.find((p) => p.id === proId) ?? null : null;
  const pros = service && modality ? professionalsFor(service, modality, professionals) : [];

  useEffect(() => {
    if (step !== 3 || !serviceSlug || !proId) return;
    const seq = ++reqSeq.current;
    setAvailLoading(true);
    setAvailError(null);
    fetchAvailability(serviceSlug, proId)
      .then((res) => {
        if (seq !== reqSeq.current) return;
        if (res.ok) setAvailDays(res.days);
        else {
          setAvailDays(null);
          setAvailError(res.error);
        }
      })
      .catch(() => {
        if (seq !== reqSeq.current) return;
        setAvailError("No pudimos consultar la disponibilidad. Revisa tu conexión e inténtalo otra vez.");
      })
      .finally(() => {
        if (seq === reqSeq.current) setAvailLoading(false);
      });
  }, [step, serviceSlug, proId]);

  const dates = useMemo(() => {
    if (!availDays) return [];
    return availDays
      .filter((d) => d.hours.some((h) => !h.taken))
      .slice(0, 14)
      .map((d) => [d.dateIso, d.hours.filter((h) => !h.taken).length] as [string, number]);
  }, [availDays]);

  const dayHours = useMemo(() => {
    if (!dateIso || !availDays) return [];
    return availDays.find((d) => d.dateIso === dateIso)?.hours ?? [];
  }, [availDays, dateIso]);

  function clearDownstream(resetFrom: "service" | "mode" | "pro") {
    if (resetFrom !== "pro") setProId(null);
    if (resetFrom !== "pro" && resetFrom !== "mode") setModality(null);
    setDateIso(null);
    setHour(null);
    setAvailDays(null);
    setAvailError(null);
    setError(null);
  }

  function pickService(slug: string) {
    const svc = services.find((s) => s.slug === slug);
    if (!svc) return;
    clearDownstream("service");
    setServiceSlug(slug);
    if (svc.modalities.length === 1) setModality(svc.modalities[0]);
    setStep(svc.modalities.length === 1 ? 2 : 1);
  }

  function pickModality(m: "presencial" | "enlinea") {
    clearDownstream("mode");
    setModality(m);
    setStep(2);
  }

  function pickPro(id: string) {
    clearDownstream("pro");
    setProId(id);
    setStep(3);
  }

  function pickDate(iso: string) {
    setError(null);
    setDateIso(iso);
    const first = availDays?.find((d) => d.dateIso === iso)?.hours.find((h) => !h.taken);
    setHour(first ? first.hour : null);
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
        // Si el slot se ocupó mientras tanto, refrescar la disponibilidad.
        if (res.error.includes("horario")) {
          setHour(null);
          setAvailDays(null);
          reqSeq.current++;
          const seq = reqSeq.current;
          fetchAvailability(service.slug, pro.id).then((r) => {
            if (seq === reqSeq.current && r.ok) setAvailDays(r.days);
          });
        }
        return;
      }
      setDone({ token: res.token ?? "" });
      setStep(5);
    } catch {
      setError("No pudimos registrar la cita. Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
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
    setAvailDays(null);
    setAvailError(null);
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
            <Button variant="ghost" className="mt-6" onClick={() => setStep(0)}>
              Volver
            </Button>
          </section>
        ) : null}
        {step === 2 && service && modality ? (
          <section aria-labelledby="bk-paso3">
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

            {availLoading ? (
              <p role="status" className="mt-4 text-ink-soft">
                Consultando la agenda de {pro.name}…
              </p>
            ) : availError ? (
              <Card className="mt-4 p-5">
                <p>{availError}</p>
                <Button variant="ghost" className="mt-4" onClick={() => setStep(2)}>
                  Elegir otro profesional
                </Button>
              </Card>
            ) : dates.length === 0 ? (
              <Card className="mt-4 p-5">
                <p>
                  No hay cupos disponibles en los próximos 21 días para esta combinación.
                  Puedes pedirnos horario por WhatsApp o probar con otro profesional.
                </p>
                <p className="mt-4">
                  <a
                    href={waLink(
                      clinic.whatsappNumber,
                      `Hola, quiero agendar ${service.name} (${modLabel(modality ?? "presencial")}) con ${pro.name} y no veo cupo en la página. ¿Puedes ayudarme?`,
                    )}
                    target="_blank"
                    rel="noopener"
                    className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-terracotta px-5 py-2.5 font-semibold text-ink no-underline hover:bg-terracotta-dark"
                  >
                    <Icon name="whatsapp" className="h-4 w-4" />
                    Pedir horario por WhatsApp
                  </a>
                </p>
              </Card>
            ) : (
              <>
                <h3 className="mt-4 text-lg">
                  Elige el día
                  <span className="ml-2 text-sm font-normal text-ink-soft">
                    (el número entre paréntesis es la cantidad de horarios libres)
                  </span>
                </h3>
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Días con disponibilidad"
                >
                  {dates.map(([iso, freeCount]) => {
                    const selected = iso === dateIso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => pickDate(iso)}
                        className={cn(
                          "min-h-11 rounded-(--radius-btn) border-2 px-4 py-2 text-sm font-semibold",
                          selected
                            ? "border-sage bg-sage text-white"
                            : "border-sage/40 bg-white text-ink hover:border-sage hover:bg-sage/10",
                        )}
                      >
                        {shortDate(iso)}
                        <span
                          className={cn(
                            "ml-1 text-xs font-normal",
                            selected ? "text-white/85" : "text-ink-soft",
                          )}
                        >
                          ({freeCount})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {dateIso ? (
                  <>
                    <h3 className="mt-8 text-lg">Elige la hora</h3>
                    <p className="mt-1 text-sm text-ink-soft">
                      Los horarios tachados ya están reservados por otras personas.
                    </p>
                    <div
                      className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4"
                      role="group"
                      aria-label="Horarios del día"
                    >
                      {dayHours.map((s) => {
                        const selected = hour === s.hour;
                        return (
                          <button
                            key={s.hour}
                            type="button"
                            disabled={s.taken}
                            aria-pressed={selected}
                            aria-label={
                              s.taken ? `Horario ${timeLabel(s.hour)}, ocupado` : timeLabel(s.hour)
                            }
                            onClick={() => setHour(s.hour)}
                            className={cn(
                              "min-h-11 rounded-(--radius-btn) border-2 px-2 py-2 text-sm font-semibold",
                              s.taken
                                ? "cursor-not-allowed border-mist bg-mist text-ink-soft line-through"
                                : selected
                                  ? "border-sage bg-sage text-white"
                                  : "border-sage/40 bg-white text-ink hover:border-sage hover:bg-sage/10",
                            )}
                          >
                            {timeLabel(s.hour)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : null}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    Volver
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!dateIso || hour === null}
                    onClick={() => {
                      setError(null);
                      setStep(4);
                    }}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            )}
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
