"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Professional } from "@/lib/data";
import type {
  AppointmentView,
  DayOpUndo,
  ExceptionView,
  RuleView,
  YearDay,
} from "@/lib/schedule";
import {
  adminCancelAppointment,
  blockDayAction,
  blockDaysAction,
  deleteAvailabilityRule,
  deleteDateException,
  fetchDayBlocks,
  freeDayAction,
  saveAvailabilityRule,
  saveDateException,
  undoDayAction,
} from "@/lib/schedule/actions";
import { cn, formatDateLongMX, timeLabel } from "@/lib/utils";
import { Button, Card, Icon, TodoChip } from "@/components/ui";

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const KIND_LABEL: Record<string, string> = {
  vacaciones: "Vacaciones",
  festivo: "Festivo",
  bloqueo: "Bloqueo",
};

type Msg = { kind: "ok" | "err"; text: string } | null;
type Tab = "agenda" | "horarios" | "calendario";

interface Draft {
  open: string;
  close: string;
  active: boolean;
}

/**
 * Módulo Agenda del panel (R4-A, 5.10 parcial + 5.02; R4-B-3 añade la
 * pestaña "Calendario"): lista de citas reales con cancelación
 * administrativa, edición de horarios por día, **vista anual por
 * profesional** (PB-2) y **bloqueos por fecha** tipo vacaciones/festivo
 * (PB-3). Las escrituras validan RBAC en el servidor.
 * TODO: 5.09 pagos si el dueño lo aprueba (D3).
 */
export function ScheduleManager({
  rules,
  appointments,
  professionals,
  initialTab = "agenda",
  year,
  month,
  proId,
  yearDays,
  exceptions,
  previews = {},
}: {
  rules: RuleView[];
  appointments: AppointmentView[];
  professionals: Professional[];
  initialTab?: Tab;
  year: number;
  month: number;
  proId: string;
  yearDays: YearDay[];
  exceptions: ExceptionView[];
  /** PB-3: URL base de `/agendar` por profesional, para "ver cómo lo ve el paciente". */
  previews?: Record<string, string>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [msg, setMsg] = useState<Msg>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // R4-B-CAL-1: pestaña Horarios — un profesional a la vez.
  const [rulesPro, setRulesPro] = useState(proId);
  // R4-B-CAL-1: pestaña Calendario — un mes a la vez.
  const [calMonth, setCalMonth] = useState(month);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [adds, setAdds] = useState<Record<string, { dow: string; open: string; close: string }>>({});
  const [exDraft, setExDraft] = useState<{
    proId: string;
    dateFrom: string;
    dateTo: string;
    kind: string;
    note: string;
  }>({ proId: "*", dateFrom: "", dateTo: "", kind: "vacaciones", note: "" });

  // ---- R4-B-UX-1: bloqueo por clic en el día ------------------------------
  const [dayPanel, setDayPanel] = useState<{ iso: string; top: number; left: number } | null>(null);
  const [dayBlocks, setDayBlocks] = useState<ExceptionView[] | null>(null);
  const [dayKind, setDayKind] = useState("festivo");
  const [dayNote, setDayNote] = useState("");
  const [dayAllClinic, setDayAllClinic] = useState(false);
  // R4-B-CAL-1: bloqueo para varios profesionales y por franja de horas.
  const [dayPros, setDayPros] = useState<string[]>([]);
  const [dayAllDay, setDayAllDay] = useState(true);
  const [dayStart, setDayStart] = useState("9");
  const [dayEnd, setDayEnd] = useState("12");
  const [panelBusy, setPanelBusy] = useState(false);
  /** Repintado inmediato del día sin esperar el re-render del servidor. */
  const [override, setOverride] = useState<Record<string, "cerrado" | "abierto">>({});
  /** Pila de operaciones deshacibles (PB-4) — vive en esta sesión de página. */
  const [undoStack, setUndoStack] = useState<{ undo: DayOpUndo; label: string }[]>([]);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string; preview?: string } | null>(null);

  // R4-B-CAL-1: una sola tarjeta (profesional elegido) y un solo mes visibles.
  const shownPro = professionals.find((p) => p.id === rulesPro) ?? professionals[0];
  const calDays = yearDays.filter((d) => Number(d.dateIso.slice(5, 7)) === calMonth);
  const calFirstDow = (new Date(year, calMonth - 1, 1).getDay() + 6) % 7;

  const now = Date.now();
  const upcoming = appointments.filter((a) => a.status === "confirmada" && a.startMs >= now);
  const history = appointments
    .filter((a) => !(a.status === "confirmada" && a.startMs >= now))
    .slice(-40)
    .reverse();

  async function cancelAppt(token: string) {
    if (armed !== token) {
      setArmed(token);
      return;
    }
    setArmed(null);
    setBusy(true);
    const res = await adminCancelAppointment(token);
    setBusy(false);
    setMsg(res.ok ? { kind: "ok", text: "Cita cancelada. El paciente recibirá el aviso cuando el correo esté activo." } : { kind: "err", text: res.error });
    if (res.ok) router.refresh();
  }

  async function saveRow(r: RuleView) {
    const d = drafts[r.id] ?? { open: String(r.open), close: String(r.close), active: r.active };
    setBusy(true);
    const res = await saveAvailabilityRule({
      id: r.id,
      proId: r.proId,
      dow: r.dow,
      open: parseInt(d.open, 10),
      close: parseInt(d.close, 10),
      active: d.active,
    });
    setBusy(false);
    setMsg(res.ok ? { kind: "ok", text: "Horario guardado." } : { kind: "err", text: res.error });
    if (res.ok) router.refresh();
  }

  async function removeRow(r: RuleView) {
    setBusy(true);
    const res = await deleteAvailabilityRule(r.id);
    setBusy(false);
    setMsg(res.ok ? { kind: "ok", text: `Adelante: ${r.proId} ya no atiende los ${DAYS[r.dow]}.` } : { kind: "err", text: res.error });
    if (res.ok) router.refresh();
  }

  async function addDay(proId: string) {
    const a = adds[proId] ?? { dow: "", open: "9", close: "17" };
    if (a.dow === "") {
      setMsg({ kind: "err", text: "Elige el día que quieres añadir." });
      return;
    }
    setBusy(true);
    const res = await saveAvailabilityRule({
      proId,
      dow: parseInt(a.dow, 10),
      open: parseInt(a.open, 10),
      close: parseInt(a.close, 10),
      active: true,
    });
    setBusy(false);
    setMsg(res.ok ? { kind: "ok", text: "Día añadido al horario." } : { kind: "err", text: res.error });
    if (res.ok) {
      setAdds((prev) => ({ ...prev, [proId]: { dow: "", open: "9", close: "17" } }));
      router.refresh();
    }
  }

  const byDate = new Map<string, AppointmentView[]>();
  for (const a of upcoming) {
    const arr = byDate.get(a.dateIso);
    if (arr) arr.push(a);
    else byDate.set(a.dateIso, [a]);
  }

  // ---- Bloqueos por fecha (R4-B-3, PB-3) --------------------------------
  const proName = (id: string) =>
    id === "*" ? "Todos (clínica)" : (professionals.find((p) => p.id === id)?.name ?? id);

  async function addException() {
    const d = exDraft;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(d.dateTo)) {
      setMsg({ kind: "err", text: "Elige la fecha de inicio y la de fin del bloqueo." });
      return;
    }
    if (d.dateFrom > d.dateTo) {
      setMsg({ kind: "err", text: "La fecha inicial no puede ser posterior a la final." });
      return;
    }
    setBusy(true);
    const res = await saveDateException({
      proId: d.proId,
      dateFrom: d.dateFrom,
      dateTo: d.dateTo,
      kind: d.kind,
      note: d.note,
      active: true,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg({ kind: "err", text: res.error });
      return;
    }
    setMsg({
      kind: "ok",
      text: `Bloqueo creado para ${proName(d.proId)} (${d.dateFrom} → ${d.dateTo}). Esos días ya no ofrecen horarios.`,
    });
    setExDraft({ proId: "*", dateFrom: "", dateTo: "", kind: "vacaciones", note: "" });
    router.refresh();
  }

  async function toggleException(e: ExceptionView) {
    setBusy(true);
    const res = await saveDateException({
      id: e.id,
      proId: e.proId,
      dateFrom: e.dateFrom,
      dateTo: e.dateTo,
      kind: e.kind,
      note: e.note,
      active: !e.active,
    });
    setBusy(false);
    setMsg(
      res.ok
        ? { kind: "ok", text: e.active ? "Bloqueo desactivado: esos días vuelven a estar disponibles." : "Bloqueo reactivado." }
        : { kind: "err", text: res.error },
    );
    if (res.ok) router.refresh();
  }

  async function removeException(id: number) {
    if (armed !== `ex-${id}`) {
      setArmed(`ex-${id}`);
      return;
    }
    setArmed(null);
    setBusy(true);
    const res = await deleteDateException(id);
    setBusy(false);
    setMsg(res.ok ? { kind: "ok", text: "Bloqueo eliminado." } : { kind: "err", text: res.error });
    if (res.ok) router.refresh();
  }

  // ---- handlers del panel por día (R4-B-UX-1) -----------------------------
  const todayIso = new Date().toISOString().slice(0, 10);
  const previewHref = (iso: string) => {
    const base = previews[proId];
    return base ? `${base}&dia=${iso}` : `/agendar?dia=${iso}`;
  };

  async function openDayPanel(iso: string) {
    // R4-B-CAL-2: panel FIJO y centrado en la pantalla (antes se anclaba al día y
    // a veces quedaba pegado al borde o fuera de vista).
    setDayPanel({ iso, top: 0, left: 0 });
    setDayBlocks(null);
    setDayNote("");
    setDayAllClinic(false);
    setDayPros([proId]);
    setDayAllDay(true);
    setDayStart("9");
    setDayEnd("12");
    const res = await fetchDayBlocks(proId, iso);
    setDayBlocks(res.ok ? res.blocks : []);
    if (!res.ok) setBanner({ kind: "err", text: res.error });
  }

  function closeDayPanel() {
    setDayPanel(null);
    setDayBlocks(null);
  }

  async function doBlockDay() {
    if (!dayPanel) return;
    const proIds = dayAllClinic ? ["*"] : dayPros.length > 0 ? dayPros : [proId];
    const sh = dayAllDay ? null : parseInt(dayStart, 10);
    const eh = dayAllDay ? null : parseInt(dayEnd, 10);
    if (!dayAllDay) {
      if (sh === null || eh === null || !Number.isInteger(sh) || !Number.isInteger(eh) || sh > eh) {
        setBanner({ kind: "err", text: "La franja debe ir de una hora a otra, con inicio ≤ fin." });
        return;
      }
    }
    setPanelBusy(true);
    const res = await blockDaysAction({
      proIds,
      dates: [dayPanel.iso],
      kind: dayKind,
      note: dayNote,
      startHour: sh,
      endHour: eh,
    });
    setPanelBusy(false);
    if (!res.ok) {
      setBanner({ kind: "err", text: res.error });
      return;
    }
    const label = formatDateLongMX(dayPanel.iso);
    // Con franja horaria el día no queda cerrado entero: no se pinta de rojo.
    if (dayAllDay) setOverride((o) => ({ ...o, [dayPanel.iso]: "cerrado" }));
    setUndoStack((s) => [...s.slice(-19), { undo: res.undo, label: `Bloqueo de ${label}` }]);
    const quien = dayAllClinic
      ? "toda la clínica"
      : proIds.length === 1
        ? proName(proIds[0])
        : `${proIds.length} profesionales`;
    setBanner({
      kind: "ok",
      text: `Día bloqueado: ${label} · ${KIND_LABEL[dayKind]} · ${quien}${dayAllDay ? "" : ` · ${sh ?? ""}:00–${eh ?? ""}:00`}`,
      preview: previewHref(dayPanel.iso),
    });
    closeDayPanel();
    router.refresh();
  }

  async function doFreeDay(blockProId: string) {
    if (!dayPanel) return;
    setPanelBusy(true);
    const res = await freeDayAction(blockProId, dayPanel.iso);
    setPanelBusy(false);
    if (!res.ok) {
      setBanner({ kind: "err", text: res.error });
      return;
    }
    const label = formatDateLongMX(dayPanel.iso);
    setOverride((o) => ({ ...o, [dayPanel.iso]: res.stillBlocked ? "cerrado" : "abierto" }));
    setUndoStack((s) => [...s.slice(-19), { undo: res.undo, label: `Liberar ${label}` }]);
    setBanner({
      kind: "ok",
      text: res.stillBlocked
        ? `Liberado el bloqueo de ${label}, pero el día sigue bloqueado por un bloqueo de toda la clínica.`
        : `Día liberado: ${label}. Si era un rango, el resto de los días sigue bloqueado.`,
      preview: previewHref(dayPanel.iso),
    });
    closeDayPanel();
    router.refresh();
  }

  async function doUndo() {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setPanelBusy(true);
    const res = await undoDayAction(last.undo);
    setPanelBusy(false);
    if (!res.ok) {
      setBanner({ kind: "err", text: res.error });
      return;
    }
    setUndoStack((s) => s.slice(0, -1));
    setOverride((o) => {
      const n = { ...o };
      delete n[last.undo.dayIso];
      return n;
    });
    setBanner({ kind: "ok", text: `Deshecho: ${last.label}.` });
    closeDayPanel();
    router.refresh();
  }

  return (
    <div>
      <div role="tablist" aria-label="Secciones de la agenda" className="flex flex-wrap gap-2">
        {(
          [
            ["agenda", `Citas (${upcoming.length} próximas)`],
            ["horarios", "Horarios por día"],
            ["calendario", "Calendario anual"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setMsg(null);
              setArmed(null);
            }}
            className={cn(
              "min-h-11 rounded-(--radius-btn) border-2 px-4 py-2 text-sm font-semibold",
              tab === id
                ? "border-sage bg-sage text-white"
                : "border-sage/40 bg-white text-ink hover:border-sage hover:bg-sage/10",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {msg ? (
        <p
          role="status"
          className={cn(
            "mt-6 rounded-(--radius-btn) px-4 py-3 text-sm font-medium",
            msg.kind === "ok" ? "bg-sage/15 text-sage-dark" : "bg-terracotta/15 text-terracotta-dark",
          )}
        >
          {msg.text}
        </p>
      ) : null}

      {tab === "agenda" ? (
        <div className="mt-6 space-y-6">
          {byDate.size === 0 ? (
            <Card className="p-6">
              <h2 className="text-xl">Sin citas próximas</h2>
              <p className="mt-2 text-ink-soft">
                Cuando alguien agende desde <a href="/agendar" className="font-semibold text-sage-dark underline">/agendar</a>, su cita
                aparecerá aquí al instante.
              </p>
            </Card>
          ) : (
            [...byDate.entries()].map(([dateIso, list]) => (
              <Card key={dateIso} className="p-6">
                <h2 className="text-lg">{formatDateLongMX(dateIso)}</h2>
                <ul className="mt-4 space-y-4">
                  {list.map((a) => (
                    <li key={a.token} className="rounded-(--radius-btn) border border-ink/10 bg-sand/60 p-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex min-h-11 items-center gap-2 font-mono text-sm font-semibold text-sage-dark">
                          <Icon name="clock" className="h-4 w-4" />
                          {timeLabel(a.hour)}
                        </span>
                        <span className="font-semibold">{a.serviceName}</span>
                        <span className="text-sm text-ink-soft">con {a.proName}</span>
                        <span className="text-sm text-ink-soft">
                          · {a.modality === "enlinea" ? "En línea" : "Presencial"} · {a.duration} min
                        </span>
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="font-semibold">{a.patientName}</span>
                        {a.patientPhone ? ` · ${a.patientPhone}` : ""}
                        {a.patientEmail ? ` · ${a.patientEmail}` : ""}
                      </p>
                      {a.note ? <p className="mt-1 text-sm text-ink-soft">Nota: {a.note}</p> : null}
                      <p className="mt-1 font-mono text-xs text-ink-soft">{a.token}</p>
                      <div className="mt-3">
                        {armed === a.token ? (
                          <Button variant="primary" onClick={() => cancelAppt(a.token)} disabled={busy}>
                            Sí, cancelar esta cita
                          </Button>
                        ) : (
                          <Button variant="ghost" onClick={() => cancelAppt(a.token)} disabled={busy}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          )}

          {history.length > 0 ? (
            <details className="rounded-(--radius-card) border border-ink/10 bg-white p-4">
              <summary className="min-h-11 cursor-pointer text-sm font-semibold">
                Historial reciente ({history.length})
              </summary>
              <ul className="mt-3 space-y-2 text-sm">
                {history.map((a) => (
                  <li key={a.token} className="flex flex-wrap items-center gap-2 text-ink-soft">
                    <span className="font-mono text-xs">{formatDateLongMX(a.dateIso)} {timeLabel(a.hour)}</span>
                    <span>{a.serviceName} · {a.patientName}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        a.status === "cancelada" ? "bg-terracotta/15 text-terracotta-dark" : "bg-mist",
                      )}
                    >
                      {a.status === "cancelada" ? "cancelada" : "pasada"}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <p className="text-sm text-ink-soft">
            <TodoChip>TODO (9.02): cifrado del motivo/nota en reposo · datos de pacientes en la BD local</TodoChip>
          </p>
        </div>
      ) : null}

      {tab === "horarios" ? (
        <div className="mt-6 space-y-6">
          <p className="text-sm text-ink-soft">
            Una franja por día y profesional. Desactiva un día para cerrar las reservas ese día
            de la semana. Los bloqueos por fecha concreta (vacaciones/festivos, 5.02) se gestionan
            en la pestaña <strong>Calendario anual</strong>.
          </p>
          <div className="flex flex-col gap-2 rounded-(--radius-card) bg-white p-4 shadow-[0_1px_2px_rgba(31,42,39,0.06)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Profesional:</span>
              <select
                aria-label="Profesional del horario semanal"
                value={shownPro?.id ?? ""}
                onChange={(e) => setRulesPro(e.target.value)}
                className="h-11 w-full rounded-(--radius-btn) border border-ink/15 bg-white px-2 sm:w-auto"
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-ink-soft sm:ml-auto">
              Se muestra un profesional a la vez para no alargar la página.
            </p>
          </div>
          {[shownPro].filter((p): p is Professional => Boolean(p)).map((p) => {
            const own = rules.filter((r) => r.proId === p.id).sort((a, b) => a.dow - b.dow);
            const used = new Set(own.map((r) => r.dow));
            const freeDays = DAYS.map((_, i) => i).filter((i) => !used.has(i));
            const add = adds[p.id] ?? { dow: "", open: "9", close: "17" };
            return (
              <Card key={p.id} className="p-6">
                <h2 className="text-lg">
                  {p.name}
                  <span className="ml-2 text-sm font-normal text-ink-soft">{p.role}</span>
                </h2>
                <ul className="mt-4 space-y-3">
                  {own.length === 0 ? (
                    <li className="text-sm text-ink-soft">Sin días definidos: este profesional no aparece como disponible.</li>
                  ) : null}
                  {own.map((r) => {
                    const d = drafts[r.id] ?? { open: String(r.open), close: String(r.close), active: r.active };
                    const dirty = d.open !== String(r.open) || d.close !== String(r.close) || d.active !== r.active;
                    return (
                      <li key={r.id} className="flex flex-wrap items-center gap-3">
                        <span className="w-24 font-semibold">{DAYS[r.dow]}</span>
                        <label className="flex items-center gap-1 text-sm">
                          <span className="sr-only">Hora de apertura {DAYS[r.dow]} de {p.name}</span>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            value={d.open}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: { ...d, open: e.target.value } }))}
                            className="h-11 w-20 rounded-(--radius-btn) border border-ink/15 bg-white px-2 text-center"
                          />
                          :00
                        </label>
                        <span aria-hidden="true">—</span>
                        <label className="flex items-center gap-1 text-sm">
                          <span className="sr-only">Hora de cierre {DAYS[r.dow]} de {p.name}</span>
                          <input
                            type="number"
                            min={1}
                            max={24}
                            value={d.close}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: { ...d, close: e.target.value } }))}
                            className="h-11 w-20 rounded-(--radius-btn) border border-ink/15 bg-white px-2 text-center"
                          />
                          :00
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={d.active}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: { ...d, active: e.target.checked } }))}
                            className="h-5 w-5 accent-sage"
                          />
                          Atiende
                        </label>
                        {dirty ? (
                          <Button onClick={() => saveRow(r)} disabled={busy}>
                            Guardar
                          </Button>
                        ) : (
                          <span className="text-xs text-ink-soft">sin cambios</span>
                        )}
                        <Button variant="ghost" onClick={() => removeRow(r)} disabled={busy}>
                          Quitar día
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                {freeDays.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
                    <span className="text-sm font-semibold">Añadir día:</span>
                    <label className="flex items-center gap-1 text-sm">
                      <span className="sr-only">Día para {p.name}</span>
                      <select
                        value={add.dow}
                        onChange={(e) => setAdds((prev) => ({ ...prev, [p.id]: { ...add, dow: e.target.value } }))}
                        className="h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-2"
                      >
                        <option value="">Elige…</option>
                        {freeDays.map((i) => (
                          <option key={i} value={i}>
                            {DAYS[i]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      aria-label={`Hora de apertura del día nuevo de ${p.name}`}
                      value={add.open}
                      onChange={(e) => setAdds((prev) => ({ ...prev, [p.id]: { ...add, open: e.target.value } }))}
                      className="h-11 w-20 rounded-(--radius-btn) border border-ink/15 bg-white px-2 text-center"
                    />
                    <input
                      type="number"
                      min={1}
                      max={24}
                      aria-label={`Hora de cierre del día nuevo de ${p.name}`}
                      value={add.close}
                      onChange={(e) => setAdds((prev) => ({ ...prev, [p.id]: { ...add, close: e.target.value } }))}
                      className="h-11 w-20 rounded-(--radius-btn) border border-ink/15 bg-white px-2 text-center"
                    />
                    <Button onClick={() => addDay(p.id)} disabled={busy || add.dow === ""}>
                      Añadir
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* ---- R4-B-3 (PB-2/PB-3): vista anual + bloqueos por fecha ---- */}
      {tab === "calendario" ? (
        <div className="mt-6 space-y-6">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <h2 className="text-lg font-semibold">Calendario por mes</h2>
              <label className="flex w-full flex-col gap-1 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                <span className="text-ink-soft">Profesional:</span>
                <select
                  aria-label="Profesional del calendario anual"
                  value={proId}
                  onChange={(e) => {
                    router.push(`/admin/horarios?tab=calendario&year=${year}&month=${calMonth}&pro=${e.target.value}`);
                  }}
                  className="h-11 w-full rounded-(--radius-btn) border border-ink/15 bg-white px-2 sm:w-auto"
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex w-full flex-col gap-1 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                <span className="text-ink-soft">Mes:</span>
                <select
                  aria-label="Mes del calendario"
                  value={calMonth}
                  onChange={(e) => setCalMonth(Number(e.target.value))}
                  className="h-11 w-full rounded-(--radius-btn) border border-ink/15 bg-white px-2 capitalize sm:w-auto"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <span className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <Link
                  href={`/admin/horarios?tab=calendario&year=${year - 1}&month=${calMonth}${proId ? `&pro=${proId}` : ""}`}
                  className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) border-2 border-sage/40 bg-white px-3 font-semibold hover:border-sage hover:bg-sage/10"
                  aria-label={`Ver el año ${year - 1}`}
                >
                  ←
                </Link>
                <span className="min-w-16 text-center text-lg font-semibold">{year}</span>
                <Link
                  href={`/admin/horarios?tab=calendario&year=${year + 1}&month=${calMonth}${proId ? `&pro=${proId}` : ""}`}
                  className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) border-2 border-sage/40 bg-white px-3 font-semibold hover:border-sage hover:bg-sage/10"
                  aria-label={`Ver el año ${year + 1}`}
                >
                  →
                </Link>
              </span>
            </div>

            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft" aria-label="Leyenda del calendario">
              <li><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-sage/60" aria-hidden="true" /> horarios libres (el número los indica)</li>
              <li><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-sage/20" aria-hidden="true" /> día con pocos libres</li>
              <li><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-sand" aria-hidden="true" /> sin cupo</li>
              <li><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-mist ring-1 ring-ink/10" aria-hidden="true" /> no atiende</li>
              <li><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-terracotta/50" aria-hidden="true" /> bloqueado (vacaciones/festivo)</li>
            </ul>

            <div className="mx-auto mt-4 w-full rounded-(--radius-card) border border-ink/10 bg-white p-2 sm:max-w-md sm:p-3">
              <h3 className="text-center text-sm font-semibold capitalize">
                {MONTHS[calMonth - 1]} {year}
              </h3>
              <div className="mt-2 grid grid-cols-7 gap-1" role="grid" aria-label={`${MONTHS[calMonth - 1]} ${year}`}>
                      {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                        <span key={d} className="text-center text-[10px] font-semibold text-ink-soft" aria-hidden="true">
                          {d}
                        </span>
                      ))}
                      {Array.from({ length: calFirstDow }).map((_, k) => (
                        <span key={`pad-${k}`} aria-hidden="true" />
                      ))}
                      {calDays.map((d) => {
                        // PB-1: cada día es un botón — clic = bloquear/liberar ese día exacto.
                        const ov = override[d.dateIso];
                        const blocked = ov ? ov === "cerrado" : d.reason === "cerrado";
                        const state = blocked
                          ? "cerrado"
                          : ov === "abierto"
                            ? null
                            : d.reason;
                        const style =
                          state === "cerrado"
                            ? "bg-terracotta/50 text-white"
                            : state === "no_atiende"
                              ? "bg-mist text-ink-soft/60 ring-1 ring-ink/10"
                              : state === "sin_cupo"
                                ? "bg-sand text-ink-soft"
                                : d.free <= 2
                                  ? "bg-sage/20 text-sage-dark"
                                  : "bg-sage/60 text-white";
                        const title = blocked
                          ? `Bloqueado — clic para liberarlo`
                          : state === "no_atiende"
                            ? "No atiende — clic para bloquear igualmente"
                            : state === "sin_cupo"
                              ? "Sin cupo — clic para bloquear"
                              : `${d.free} libres · ${d.taken} cita(s) — clic para bloquear`;
                        const isToday = d.dateIso === todayIso;
                        return (
                          <button
                            key={d.dateIso}
                            type="button"
                            onClick={() => openDayPanel(d.dateIso)}
                            aria-label={`${formatDateLongMX(d.dateIso)} · ${proName(proId)} · ${title}`}
                            aria-pressed={blocked}
                            title={`${d.dateIso} · ${title}`}
                            className={cn(
                              "flex aspect-square items-center justify-center rounded-sm text-[11px] font-semibold transition-colors hover:ring-2 hover:ring-ink/30 focus-visible:ring-2 focus-visible:ring-sage-dark",
                              style,
                              isToday && "outline outline-2 outline-offset-1 outline-ink/50",
                            )}
                          >
                            {Number(d.dateIso.slice(8, 10))}
                          </button>
                        );
                      })}
              </div>
            </div>
          </Card>

          {/* PB-3/PB-4: confirmación con "Deshacer" y previsualización del lado del paciente */}
          {banner ? (
            <div
              role="status"
              className={cn(
                "mt-4 flex flex-wrap items-center gap-3 rounded-(--radius-card) border px-4 py-3 text-sm font-medium",
                banner.kind === "ok"
                  ? "border-sage/40 bg-sage/15 text-sage-dark"
                  : "border-terracotta/40 bg-terracotta/15 text-terracotta-dark",
              )}
            >
              <span>{banner.text}</span>
              {undoStack.length > 0 ? (
                <Button variant="ghost" onClick={doUndo} disabled={panelBusy}>
                  Deshacer ({undoStack.length})
                </Button>
              ) : null}
              {banner.kind === "ok" && banner.preview ? (
                <a
                  href={banner.preview}
                  target="_blank"
                  rel="noopener"
                  className="font-semibold underline underline-offset-2"
                >
                  Ver cómo lo ve el paciente ↗
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => setBanner(null)}
                aria-label="Cerrar el aviso"
                className="ml-auto min-h-11 min-w-11 text-ink-soft hover:text-ink"
              >
                ×
              </button>
            </div>
          ) : null}

          {/* PB-1/PB-2: panel del día, anclado junto a la casilla clicada */}
          {dayPanel ? (
            <>
              <div
                className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px]"
                aria-hidden="true"
                onClick={closeDayPanel}
              />
              <div
                role="dialog"
                aria-label={`Día ${formatDateLongMX(dayPanel.iso)}`}
                tabIndex={-1}
                onKeyDown={(ev) => {
                  if (ev.key === "Escape") closeDayPanel();
                }}
                ref={(el) => {
                  if (el) el.focus({ preventScroll: true });
                }}
                aria-modal="true"
                className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-(--radius-card) border border-ink/15 bg-white p-4 shadow-[0_12px_32px_rgba(31,42,39,0.18)]"
              >
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-sm font-semibold capitalize">{formatDateLongMX(dayPanel.iso)}</p>
                    <p className="text-xs text-ink-soft">{proName(proId)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDayPanel}
                    aria-label="Cerrar sin bloquear"
                    className="ml-auto min-h-11 min-w-11 text-ink-soft hover:text-ink"
                  >
                    ×
                  </button>
                </div>

                {dayBlocks === null ? (
                  <p className="mt-3 text-sm text-ink-soft">Consultando el día…</p>
                ) : dayBlocks.filter((e) => e.active).length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {dayBlocks
                      .filter((e) => e.active)
                      .map((e) => (
                        <div key={e.id} className="rounded-(--radius-btn) border border-terracotta/40 bg-terracotta/10 p-3 text-sm">
                          <p className="font-semibold text-terracotta-dark">
                            {KIND_LABEL[e.kind] ?? e.kind} · {proName(e.proId)}
                            {e.startHour !== null && e.endHour !== null
                              ? ` · ${String(e.startHour).padStart(2, "0")}:00–${String(e.endHour).padStart(2, "0")}:00`
                              : " · todo el día"}
                          </p>
                          {e.dateFrom !== e.dateTo ? (
                            <p className="mt-0.5 text-xs text-ink-soft">
                              rango {e.dateFrom} → {e.dateTo}
                            </p>
                          ) : null}
                          {e.note ? <p className="mt-0.5 text-xs">“{e.note}”</p> : null}
                          <div className="mt-2">
                            {e.proId !== "*" ? (
                              <Button variant="primary" onClick={() => doFreeDay(e.proId)} disabled={panelBusy}>
                                Liberar este día
                              </Button>
                            ) : (
                              <p className="text-xs text-ink-soft">
                                Es un bloqueo de toda la clínica: desactívalo o elimínalo en la lista
                                de abajo.
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    {dayBlocks.some((e) => !e.active) ? (
                      <p className="text-xs text-ink-soft">
                        Hay {dayBlocks.filter((e) => !e.active).length} bloqueo(s) inactivo(s) que
                        también cubren este día.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-ink-soft">Este día no está bloqueado.</p>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Profesionales
                      </p>
                      <div className="mt-1.5 grid gap-1">
                        {professionals.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={dayAllClinic || dayPros.includes(p.id)}
                              disabled={dayAllClinic}
                              onChange={(ev) =>
                                setDayPros((prev) =>
                                  ev.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id),
                                )
                              }
                              className="h-4 w-4 accent-sage"
                            />
                            {p.name}
                          </label>
                        ))}
                        <label className="mt-1 flex items-center gap-2 text-sm font-semibold">
                          <input
                            type="checkbox"
                            checked={dayAllClinic}
                            onChange={(ev) => setDayAllClinic(ev.target.checked)}
                            className="h-4 w-4 accent-sage"
                          />
                          Toda la clínica
                        </label>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        Horario a bloquear
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="day-hours"
                            checked={dayAllDay}
                            onChange={() => setDayAllDay(true)}
                            className="accent-sage"
                          />
                          Todo el día
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="day-hours"
                            checked={!dayAllDay}
                            onChange={() => setDayAllDay(false)}
                            className="accent-sage"
                          />
                          Solo una franja
                        </label>
                      </div>
                      {!dayAllDay ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          <select
                            aria-label="Hora de inicio del bloqueo"
                            value={dayStart}
                            onChange={(ev) => setDayStart(ev.target.value)}
                            className="h-10 rounded-(--radius-btn) border border-ink/15 bg-white px-2"
                          >
                            {Array.from({ length: 24 }, (_, h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, "0")}:00
                              </option>
                            ))}
                          </select>
                          <span>a</span>
                          <select
                            aria-label="Hora de fin del bloqueo"
                            value={dayEnd}
                            onChange={(ev) => setDayEnd(ev.target.value)}
                            className="h-10 rounded-(--radius-btn) border border-ink/15 bg-white px-2"
                          >
                            {Array.from({ length: 24 }, (_, h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, "0")}:00
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-ink-soft">(ambas incluidas)</span>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Motivo</p>
                      <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Motivo del bloqueo">
                        {(["festivo", "vacaciones", "bloqueo"] as const).map((k) => (
                          <button
                            key={k}
                            type="button"
                            role="radio"
                            aria-checked={dayKind === k}
                            onClick={() => setDayKind(k)}
                            className={cn(
                              "min-h-11 rounded-(--radius-btn) border-2 px-3 text-sm font-semibold",
                              dayKind === k
                                ? "border-terracotta bg-terracotta/15 text-terracotta-dark"
                                : "border-ink/15 bg-white text-ink hover:border-terracotta/50",
                            )}
                          >
                            {KIND_LABEL[k]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="block text-sm">
                      <span className="font-semibold">Nota (opcional)</span>
                      <input
                        type="text"
                        maxLength={200}
                        value={dayNote}
                        placeholder="p. ej. Día de Muertos"
                        onChange={(ev) => setDayNote(ev.target.value)}
                        className="mt-1 h-11 w-full rounded-(--radius-input) border border-ink/15 bg-white px-3"
                      />
                    </label>
                    <Button onClick={doBlockDay} disabled={panelBusy}>
                      {panelBusy ? "Bloqueando…" : "Bloquear el día"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}

          <Card className="p-6">
            <h2 className="text-xl">Bloqueos por fecha (vacaciones y festivos)</h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Lo normal es bloquear <strong>haciendo clic en el día</strong> aquí arriba (y se puede
              deshacer con un botón). Aquí abajo quedan todos los bloqueos registrados, para
              desactivarlos o eliminarlos; y más abajo, el formulario para <strong>rangos largos</strong>
              (vacaciones de varios días).
            </p>

            {exceptions.length === 0 ? (
              <p className="mt-4 rounded-(--radius-btn) bg-mist px-4 py-3 text-sm text-ink-soft">
                Todavía no hay bloqueos registrados.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {exceptions.map((e) => (
                  <li
                    key={e.id}
                    className={cn(
                      "flex flex-wrap items-center gap-3 rounded-(--radius-btn) border p-4",
                      e.active ? "border-terracotta/40 bg-terracotta/10" : "border-ink/10 bg-mist/60 text-ink-soft",
                    )}
                  >
                    <span className="font-semibold">
                      {KIND_LABEL[e.kind] ?? e.kind} · {proName(e.proId)}
                    </span>
                    <span className="font-mono text-sm">
                      {e.dateFrom} → {e.dateTo}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {e.startHour !== null && e.endHour !== null
                        ? `${String(e.startHour).padStart(2, "0")}:00–${String(e.endHour).padStart(2, "0")}:00`
                        : "todo el día"}
                    </span>
                    {e.note ? <span className="text-sm">“{e.note}”</span> : null}
                    {!e.active ? <span className="text-xs font-semibold uppercase">inactivo</span> : null}
                    <span className="flex w-full flex-wrap justify-end gap-2 sm:ml-auto sm:w-auto">
                      <Button variant="ghost" onClick={() => toggleException(e)} disabled={busy}>
                        {e.active ? "Desactivar" : "Activar"}
                      </Button>
                      <Button variant={armed === `ex-${e.id}` ? "primary" : "ghost"} onClick={() => removeException(e.id)} disabled={busy}>
                        {armed === `ex-${e.id}` ? "Sí, eliminar" : "Eliminar"}
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* PB-5: el rango largo deja de ser el camino principal, sigue disponible */}
            <details className="mt-6 border-t border-ink/10 pt-5">
              <summary className="min-h-11 cursor-pointer text-sm font-semibold">
                Añadir bloqueo por rango (vacaciones de varios días)
              </summary>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Profesional</span>
                <select
                  value={exDraft.proId}
                  onChange={(ev) => setExDraft((d) => ({ ...d, proId: ev.target.value }))}
                  className="h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-2"
                >
                  <option value="*">Todos (clínica entera)</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Desde</span>
                <input
                  type="date"
                  value={exDraft.dateFrom}
                  onChange={(ev) => setExDraft((d) => ({ ...d, dateFrom: ev.target.value }))}
                  className="h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Hasta</span>
                <input
                  type="date"
                  value={exDraft.dateTo}
                  onChange={(ev) => setExDraft((d) => ({ ...d, dateTo: ev.target.value }))}
                  className="h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Motivo</span>
                <select
                  value={exDraft.kind}
                  onChange={(ev) => setExDraft((d) => ({ ...d, kind: ev.target.value }))}
                  className="h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-2"
                >
                  <option value="vacaciones">Vacaciones</option>
                  <option value="festivo">Festivo</option>
                  <option value="bloqueo">Bloqueo</option>
                </select>
              </label>
              <label className="flex w-full flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium">Nota (opcional)</span>
                <input
                  type="text"
                  maxLength={200}
                  value={exDraft.note}
                  placeholder="p. ej. puente del 20 de noviembre"
                  onChange={(ev) => setExDraft((d) => ({ ...d, note: ev.target.value }))}
                  className="h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-3"
                />
              </label>
              <Button onClick={addException} disabled={busy} className="w-full justify-center sm:col-span-2 sm:w-auto">
                Bloquear el rango
              </Button>
            </div>
            </details>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
