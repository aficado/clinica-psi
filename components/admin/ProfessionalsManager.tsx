"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfessionalAdminView } from "@/lib/professionals";
import {
  deleteProfessional,
  saveProfessional,
  setProfessionalActive,
} from "@/lib/professionals/actions";
import { cn } from "@/lib/utils";
import { Button, Card, Icon } from "@/components/ui";

const DIAS = [
  { dow: 1, label: "Lun" },
  { dow: 2, label: "Mar" },
  { dow: 3, label: "Mié" },
  { dow: 4, label: "Jue" },
  { dow: 5, label: "Vie" },
  { dow: 6, label: "Sáb" },
];

const MODALIDADES = [
  { id: "presencial", label: "Presencial", hint: "En la clínica" },
  { id: "enlinea", label: "En línea", hint: "Videoconsulta" },
] as const;

type Modality = "presencial" | "enlinea";
type Msg = { kind: "ok" | "err"; text: string } | null;

interface FormState {
  id: string | null; // null = alta nueva
  name: string;
  role: string;
  services: string[]; // slugs marcados
  modalities: Modality[];
  days: number[];
  /** Primera cita (hora, inclusiva). */
  open: string;
  /** Última cita (hora, inclusiva): también se ofrece. */
  close: string;
  hasSaturday: boolean;
  satOpen: string;
  satClose: string;
}

/** Estado del formulario desde una vista del panel (o vacío = alta). */
function formFrom(p?: ProfessionalAdminView): FormState {
  return p
    ? {
        id: p.id,
        name: p.name,
        role: p.role,
        services: p.services,
        modalities: (p.modalities.length > 0 ? p.modalities : ["presencial", "enlinea"]) as Modality[],
        days: p.days,
        open: String(p.open),
        close: String(p.close),
        hasSaturday: p.saturday !== null,
        satOpen: String(p.saturdayOpen ?? 10),
        satClose: String(p.saturdayClose ?? 14),
      }
    : {
        id: null,
        name: "",
        role: "",
        services: ["terapia-individual"],
        modalities: ["presencial", "enlinea"],
        days: [1, 2, 3, 4, 5],
        open: "9",
        close: "17",
        hasSaturday: false,
        satOpen: "10",
        satClose: "14",
      };
}

const inputCls =
  "w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-3 py-2";

/** Encabezado de sección del formulario. */
function Section({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/15 text-xs font-bold text-sage-dark">
        {n}
      </span>
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
      </div>
    </div>
  );
}

/** Formulario del profesional (alta o edición) — refactor R4-B-PROF-1. */
export function ProfesionalesForm({
  initial,
  services,
  onDone,
}: {
  initial: FormState;
  services: Array<{ slug: string; name: string }>;
  onDone: () => void;
}) {
  const [f, setF] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((x) => ({ ...x, [k]: v }));

  const toggleIn = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  function validar(): string | null {
    if (f.name.trim().length < 3) return "Escribe el nombre del profesional (mínimo 3 letras).";
    if (f.services.length === 0) return "Marca al menos un servicio que atienda.";
    if (f.modalities.length === 0) return "Marca al menos una modalidad: presencial, en línea o ambas.";
    if (f.days.length === 0) return "Marca al menos un día de atención.";
    const open = parseInt(f.open, 10);
    const close = parseInt(f.close, 10);
    if (!Number.isInteger(open) || !Number.isInteger(close)) return "Las horas deben ser números enteros.";
    if (open < 0 || open > 23) return "La primera cita debe ser entre 0 y 23 h.";
    if (close < 1 || close > 24) return "La última cita debe ser entre 1 y 24 h.";
    if (open >= close) return "La última cita debe ser posterior a la primera (rango inclusivo).";
    if (f.days.includes(6) && f.hasSaturday) {
      const so = parseInt(f.satOpen, 10);
      const sc = parseInt(f.satClose, 10);
      if (!Number.isInteger(so) || !Number.isInteger(sc) || so >= sc)
        return "El horario del sábado necesita una primera hora menor que la última.";
    }
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validar();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await saveProfessional(
      {
        name: f.name,
        role: f.role,
        services: f.services,
        modalities: f.modalities,
        days: f.days,
        open: parseInt(f.open, 10),
        close: parseInt(f.close, 10),
        setActive: true,
        saturday:
          f.hasSaturday && f.days.includes(6)
            ? { open: parseInt(f.satOpen, 10), close: parseInt(f.satClose, 10) }
            : null,
      },
      f.id ?? undefined,
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-(--radius-btn) bg-terracotta/15 px-4 py-3 text-sm font-medium text-terracotta-dark">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <Section n={1} title="Identidad" hint="Cómo aparece en el sitio y en el flujo de citas." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Nombre</label>
            <input
              type="text"
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Dra. Mariana Solís"
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Título o rol</label>
            <input
              type="text"
              value={f.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Ej. Psicóloga clínica"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <Section n={2} title="Servicios que atiende" hint="Solo aparece en la agenda de los servicios marcados." />
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => {
            const checked = f.services.includes(s.slug);
            return (
              <label
                key={s.slug}
                className={cn(
                  "flex items-center gap-2 rounded-(--radius-btn) border-2 px-3 py-2 text-sm",
                  checked ? "border-sage bg-sage/10" : "border-ink/10 bg-white",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => set("services", toggleIn(f.services, s.slug))}
                  className="h-5 w-5 accent-sage"
                />
                {s.name}
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Section
          n={3}
          title="Modalidades"
          hint="Si no marcas «En línea», el profesional no se ofrece para videoconsulta."
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {MODALIDADES.map((m) => {
            const checked = f.modalities.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={checked}
                onClick={() => set("modalities", toggleIn(f.modalities, m.id))}
                className={cn(
                  "flex min-h-11 items-center justify-between gap-2 rounded-(--radius-btn) border-2 px-4 py-2 text-left text-sm font-semibold",
                  checked ? "border-sage bg-sage text-white" : "border-ink/10 bg-white text-ink hover:border-sage",
                )}
              >
                <span>
                  {m.label}
                  <span className={cn("block text-xs font-normal", checked ? "text-white/80" : "text-ink-soft")}>
                    {m.hint}
                  </span>
                </span>
                {checked ? <Icon name="check" className="h-5 w-5" /> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Section n={4} title="Días de atención" hint="El domingo no se atiende por ahora." />
        <div className="flex flex-wrap gap-2">
          {DIAS.map((d) => {
            const checked = f.days.includes(d.dow);
            return (
              <button
                key={d.dow}
                type="button"
                aria-pressed={checked}
                onClick={() => set("days", toggleIn(f.days, d.dow))}
                className={cn(
                  "min-h-11 rounded-(--radius-btn) border-2 px-4 py-2 text-sm font-semibold",
                  checked ? "border-sage bg-sage text-white" : "border-ink/10 bg-white text-ink hover:border-sage",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Section
          n={5}
          title="Horario de citas"
          hint="Rango inclusivo: si la última cita es a las 20, también se ofrece 20:00."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Primera cita (hora)</label>
            <input
              type="number"
              min={0}
              max={23}
              value={f.open}
              onChange={(e) => set("open", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Última cita (hora)</label>
            <input
              type="number"
              min={1}
              max={24}
              value={f.close}
              onChange={(e) => set("close", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {f.days.includes(6) ? (
          <Card className="p-4">
            <p className="text-sm font-semibold">Sábado</p>
            <p className="mt-1 text-xs text-ink-soft">
              Si el sábado atiende en el mismo horario que el resto, deja esta opción desmarcada.
            </p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.hasSaturday}
                onChange={(e) => set("hasSaturday", e.target.checked)}
                className="h-5 w-5 accent-sage"
              />
              Horario propio de sábado
            </label>
            <div className="mt-3 flex flex-wrap gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Primera cita</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={f.satOpen}
                  onChange={(e) => set("satOpen", e.target.value)}
                  disabled={!f.hasSaturday}
                  className="w-24 rounded-(--radius-btn) border border-ink/15 bg-white px-3 py-2 disabled:opacity-40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Última cita</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={f.satClose}
                  onChange={(e) => set("satClose", e.target.value)}
                  disabled={!f.hasSaturday}
                  className="w-24 rounded-(--radius-btn) border border-ink/15 bg-white px-3 py-2 disabled:opacity-40"
                />
              </div>
            </div>
          </Card>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Guardando…" : f.id ? "Guardar cambios" : "Crear profesional"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/**
 * Módulo Profesionales del panel (R4-B-2; refactor R4-B-PROF-1): listado con
 * alta, edición, activar/desactivar y baja blanda. Escrituras con RBAC en el
 * servidor (admin + terapeuta). El horario operativo final vive en
 * `availability_rules` (se alinea al guardar); el ajuste fino por día se hace
 * en «Agenda y horarios».
 */
export function ProfessionalsManager({
  pros,
  services,
}: {
  pros: ProfessionalAdminView[];
  services: Array<{ slug: string; name: string }>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProfesionalesFormKey | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleActive(p: ProfessionalAdminView) {
    setBusy(true);
    const res = await setProfessionalActive(p.id, !p.active);
    setBusy(false);
    setMsg(
      res.ok
        ? { kind: "ok", text: `${p.name} quedó ${!p.active ? "activo" : "inactivo"}.` }
        : { kind: "err", text: res.error },
    );
    if (res.ok) router.refresh();
  }

  async function del(p: ProfessionalAdminView) {
    if (armed !== p.id) {
      setArmed(p.id);
      return;
    }
    setArmed(null);
    setBusy(true);
    const res = await deleteProfessional(p.id);
    setBusy(false);
    const text = res.ok
      ? `${p.name} quedó de baja (el registro se conserva en la BD).`
      : res.error;
    setMsg({ kind: res.ok ? "ok" : "err", text });
    if (res.ok) router.refresh();
  }

  const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

  return (
    <div className="space-y-6">
      {msg ? (
        <p
          role="status"
          className={cn(
            "rounded-(--radius-btn) px-4 py-3 text-sm font-medium",
            msg.kind === "ok" ? "bg-sage/15 text-sage-dark" : "bg-terracotta/15 text-terracotta-dark",
          )}
        >
          {msg.text}
        </p>
      ) : null}

      {editing ? (
        <Card className="p-5">
          <h2 className="text-xl">
            {editing.initial.id ? "Editar profesional" : "Nuevo profesional"}
          </h2>
          <div className="mt-4">
            <ProfesionalesForm
              initial={editing.initial}
              services={services}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setEditing({ initial: formFrom(), key: "new" })}>
              Añadir profesional
            </Button>
            <Button href="/admin/horarios" variant="ghost">
              <Icon name="calendar" className="h-4 w-4" />
              Ver agenda y horarios
            </Button>
          </div>

          <div className="space-y-3">
            {pros.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                      {p.name}
                      {!p.active ? (
                        <span className="rounded bg-mist px-2 py-0.5 text-xs font-normal text-ink-soft">
                          inactivo
                        </span>
                      ) : null}
                      {p.modalities.map((m) => (
                        <span
                          key={m}
                          className="rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sage-dark"
                        >
                          {m === "enlinea" ? "En línea" : "Presencial"}
                        </span>
                      ))}
                    </p>
                    {p.role ? <p className="text-sm text-ink-soft">{p.role}</p> : null}
                    <p className="mt-1 text-sm text-ink-soft">
                      {p.days.length === 0
                        ? "Sin días de atención"
                        : `Días: ${p.days.map((d) => DIAS.find((x) => x.dow === d)?.label ?? d).join(", ")}`}
                      {" · "}citas de {hh(p.open)} a {hh(p.close)}
                      {p.saturday ? ` · Sáb ${hh(p.saturday.open)} a ${hh(p.saturday.close)}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {services
                        .filter((s) => p.services.includes(s.slug))
                        .map((s) => s.name)
                        .join(" · ") || "Sin servicios marcados"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => setEditing({ initial: formFrom(p), key: p.id })}>
                      Editar
                    </Button>
                    <Button variant="ghost" disabled={busy} onClick={() => toggleActive(p)}>
                      {p.active ? "Deshabilitar" : "Habilitar"}
                    </Button>
                    <Button variant="ghost" disabled={busy} onClick={() => del(p)}>
                      {armed === p.id ? "¿Seguro? Confirmar baja" : "Dar de baja"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {pros.length === 0 ? (
              <Card className="p-5">
                <p className="text-sm text-ink-soft">
                  No hay profesionales registrados todavía. Usa «Añadir profesional» para crear el
                  primero.
                </p>
              </Card>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

type ProfesionalesFormKey = { initial: FormState; key: string };