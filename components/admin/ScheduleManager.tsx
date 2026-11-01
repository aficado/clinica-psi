"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Professional } from "@/lib/data";
import type { AppointmentView, RuleView } from "@/lib/schedule";
import {
  adminCancelAppointment,
  deleteAvailabilityRule,
  saveAvailabilityRule,
} from "@/lib/schedule/actions";
import { cn, formatDateLongMX, timeLabel } from "@/lib/utils";
import { Button, Card, Icon, TodoChip } from "@/components/ui";

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

type Msg = { kind: "ok" | "err"; text: string } | null;

interface Draft {
  open: string;
  close: string;
  active: boolean;
}

/**
 * Módulo Agenda del panel (R4-A, 5.10 parcial + 5.02): lista de citas
 * reales con cancelación administrativa y edición de horarios por día
 * de cada profesional. Las escrituras validan RBAC en el servidor.
 * TODO (R4-B): bloqueos por fecha concreta (vacaciones/festivos) y
 * vista de calendario; 5.09 pagos si el dueño lo aprueba (D3).
 */
export function ScheduleManager({
  rules,
  appointments,
  professionals,
}: {
  rules: RuleView[];
  appointments: AppointmentView[];
  professionals: Professional[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"agenda" | "horarios">("agenda");
  const [msg, setMsg] = useState<Msg>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [adds, setAdds] = useState<Record<string, { dow: string; open: string; close: string }>>({});

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

  return (
    <div>
      <div role="tablist" aria-label="Secciones de la agenda" className="flex flex-wrap gap-2">
        {(
          [
            ["agenda", `Citas (${upcoming.length} próximas)`],
            ["horarios", "Horarios por día"],
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
            de la semana.
            <span className="mt-1 block">
              <TodoChip>TODO (R4-B): bloqueos por fecha concreta (vacaciones/festivos, 5.02)</TodoChip>
            </span>
          </p>
          {professionals.map((p) => {
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
    </div>
  );
}
