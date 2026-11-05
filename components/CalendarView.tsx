/** ============================================================
 *  CALENDARIO DE MES COMPLETO — R4-B (5.03, 5.10)
 *  Reemplaza el grid de días de R4-A. Cada día muestra su estado con
 *  un motivo ("no atiende ese día", "sin cupos", "bloqueado: …" y, desde
 *  R4-B-HOTFIX-1, "fuera de la ventana de reserva"). La ventana ya no es
 *  fija: la manda `site_settings.booking_window_days` (Ajustes) y los días
 *  después del límite salen deshabilitados, no clicables.
 *  Sigue la temática del sitio (sage/terracotta/mist/sand) y pide
 *  el mes completo al servidor con `fetchMonthSchedule`.
 *  El mes SIEMPRE se maneja como `YYYY-MM` (local, no UTC) y se
 *  alinea con el día de semana real (Lun–Dom).
 * ============================================================ */

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, Card } from "./ui";
import type { DaySlotsWithReason } from "@/lib/schedule";
import { fetchMonthSchedule } from "@/lib/schedule/actions";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function CalendarView({
  proId,
  dateIso,
  hour,
  onSelect,
  onNavigate,
}: {
  proId: string;
  /** Día actualmente seleccionado (se subraya). */
  dateIso?: string | null;
  /** Hora actualmente seleccionada. */
  hour?: number | null;
  /** Cuando elige día/hora: (dateIso, hour) */
  onSelect: (dateIso: string, hour: number) => void;
  /** Cuando navega de mes: (mesIso `YYYY-MM`) */
  onNavigate: (monthIso: string) => void;
}) {
  // Mes visible, SIEMPRE `YYYY-MM`: si hay día elegido se parte de su mes; si
  // no, del mes actual — construido con los campos LOCALES (no UTC).
  const [month, setMonth] = useState(() => (dateIso ? dateIso.slice(0, 7) : isoToday().slice(0, 7)));
  const [slots, setSlots] = useState<DaySlotsWithReason[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = daysOfMonth(month);
  // El día 1 NO siempre cae lunes: huecos de alineación al inicio del grid.
  const offset = dowMondayFirst(`${month}-01`);
  const todayIso = isoToday();

  useEffect(() => {
    if (!month || !proId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchMonthSchedule(proId, month);
        if (cancelled) return;
        if (res.ok) setSlots(res.days);
        else setError(res.error);
      } catch {
        if (!cancelled) setError("No pudimos consultar la disponibilidad.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [month, proId]);

  if (error) {
    return <Card className="p-5"><p className="text-sm text-ink-soft">{error}</p></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Navegación de mes: cualquier mes de cualquier año es alcanzable. */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(monthPrev(month))}
          className="min-h-11 min-w-11 rounded-(--radius-btn) border-2 border-sage/40 p-2 text-sage hover:border-sage hover:bg-sage/10"
          aria-label="Mes anterior"
        >
          <Icon name="arrow" className="h-5 w-5 rotate-90" />
        </button>
        <span className="text-lg font-bold text-ink" role="status" aria-live="polite">
          {MESES[Number(month.slice(5, 7)) - 1]} {month.slice(0, 4)}
        </span>
        <button
          type="button"
          onClick={() => navigate(monthNext(month))}
          className="min-h-11 min-w-11 rounded-(--radius-btn) border-2 border-sage/40 p-2 text-sage hover:border-sage hover:bg-sage/10"
          aria-label="Mes siguiente"
        >
          <Icon name="arrow" className="h-5 w-5 -rotate-90" />
        </button>
      </div>

      {/* Encabezado de días */}
      <div className="grid grid-cols-7 gap-1" aria-hidden="true">
        {DIAS.map((d) => (
          <div key={d} className="py-2 text-center text-sm font-semibold text-ink-soft">{d}</div>
        ))}
      </div>

      {/* Grid del mes: alineado por día de semana; días sin datos se rellenan. */}
      {loading ? (
        <p role="status" className="text-sm text-ink-soft">Consultando la agenda…</p>
      ) : (
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Días del mes">
          {Array.from({ length: offset }, (_, i) => (
            <div key={`pad-${i}`} role="presentation" className="min-h-11" />
          ))}
          {days.map((iso) => {
            const info = slots?.find((d) => d.dateIso === iso);
            const selected = dateIso === iso;
            if (!info) {
              // Día sin datos (cuando el mes navega más rápido que la consulta):
              // se rellena como casilla inerte en vez de dejar un hueco vacío.
              return <div key={iso} role="presentation" className="min-h-11 rounded-(--radius-btn) border-2 border-mist/40 bg-mist/20" />;
            }
            const past = iso < todayIso;
            const available = info.freeCount > 0 && !past;
            return (
              <button
                key={iso}
                type="button"
                disabled={!available}
                onClick={() => {
                  const free = info.hours.find((h) => !h.taken);
                  if (!free) return;
                  onSelect(iso, free.hour);
                }}
                aria-pressed={selected}
                aria-label={dayTitle(info, past)}
                title={dayTitle(info, past)}
                className={cn(
                  "min-h-11 rounded-(--radius-btn) border-2 px-1 py-1.5 text-sm font-semibold transition-colors",
                  !available
                    ? info.reason === "cerrado"
                      ? "cursor-not-allowed border-terracotta/50 bg-terracotta/15 text-terracotta-dark"
                      : "cursor-not-allowed border-mist bg-mist/40 text-ink-soft"
                    : selected
                      ? "border-sage bg-sage text-white"
                      : "border-sage/40 bg-white text-ink hover:border-sage hover:bg-sage/10",
                )}
              >
                {iso.slice(8)}
                <span
                  className={cn(
                    "block text-[10px] font-normal",
                    selected ? "text-white/85" : available ? "text-sage-dark" : "text-ink-soft",
                  )}
                >
                  {available ? `(${info.freeCount})` : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* HF-1: la ventana del panel se ve — aviso con el último día agendable. */}
      {(() => {
        const out = slots?.find((s) => s.reason === "fuera_de_ventana");
        if (!out?.windowEndIso) return null;
        return (
          <p className="text-sm text-ink-soft" role="note">
            Puedes agendar hasta el <strong>{formatDateLongMX(out.windowEndIso)}</strong> (ventana de
            reserva de la clínica). Los días posteriores salen en gris.
          </p>
        );
      })()}

      {/* Detalle del día seleccionado: horarios — BOTONES seleccionables (R4-A los tenía en el grid
          de horas; aquí se conservan dentro del calendario para poder cambiar de hora sin salir).
          PB-2 (R4-B-BUG-1): los horarios ya reservados ya NO se muestran (ni tachados ni apagados):
          la persona solo ve lo que realmente puede elegir. */}
      {dateIso && slots ? (
        (() => {
          const day = slots.find((d) => d.dateIso === dateIso);
          if (!day || day.hours.length === 0 || day.reason === "no_atiende") return null;
          const libres = day.hours.filter((s) => !s.taken);
          return (
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-semibold text-ink">{formatDateLongMX(dateIso)}</h3>
              {libres.length === 0 ? (
                <p className="rounded-(--radius-btn) bg-mist px-4 py-3 text-sm text-ink-soft">
                  Ya no quedan horarios libres para este día. Elige otro día del calendario.
                </p>
              ) : (
                <>
                  <p className="text-sm text-ink-soft">Elige la hora disponible:</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Horarios del día">
                    {libres.map((s) => {
                      const selectedHour = hour === s.hour;
                      return (
                        <button
                          key={s.hour}
                          type="button"
                          aria-pressed={selectedHour}
                          aria-label={`Horario ${s.hour}:00`}
                          onClick={() => onSelect(day.dateIso, s.hour)}
                          className={cn(
                            "min-h-11 rounded-(--radius-btn) border-2 px-2 py-2 text-sm font-semibold",
                            selectedHour
                              ? "border-sage bg-sage text-white"
                              : "border-sage/40 bg-white text-ink hover:border-sage hover:bg-sage/10",
                          )}
                        >
                          {s.hour}:00
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()
      ) : null}
    </div>
  );

  /** Cambiar de mes: actualiza el grid local Y avisa al flujo (que puede guardar la cookie). */
  function navigate(monthIso: string) {
    setMonth(monthIso);
    onNavigate(monthIso);
  }
}

/** `Date` → `YYYY-MM-DD` en la zona horaria del navegador. */
function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** `YYYY-MM-DD` → día de semana con lunes = 0 … domingo = 6. */
function dowMondayFirst(iso: string): number {
  return (new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))).getDay() + 6) % 7;
}

/** `YYYY-MM-DD` → "lunes, 3 de noviembre de 2026" (es-MX). */
function formatDateLongMX(iso: string): string {
  return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))).toLocaleDateString(
    "es-MX",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );
}

/** Título de ayuda para un día (accesibilidad: el motivo se lee con el lector de pantalla). */
function dayTitle(info: DaySlotsWithReason, past: boolean): string {
  if (past) return "Este día ya pasó.";
  if (info.reason === "fuera_de_ventana")
    return `Fuera de la ventana de reserva: la agenda abre hasta el ${info.windowEndIso ?? ""}.`;
  if (info.reason === "cerrado")
    return `El profesional no atiende este día (${info.blockedLabel ?? "día bloqueado"}).`;
  if (info.reason === "no_atiende") return "El profesional no atiende este día.";
  if (info.freeCount === 0) return "Sin cupos en este día.";
  return `${info.freeCount} horarios libres el ${info.dateIso}.`;
}

/** Días del mes (`YYYY-MM`) como ISO, empezando por el 1. */
function daysOfMonth(monthIso: string): string[] {
  const year = Number(monthIso.slice(0, 4));
  const month = Number(monthIso.slice(5, 7));
  if (!month) return [];
  const last = new Date(year, month, 0).getDate();
  const out: string[] = [];
  for (let d = 1; d <= last; d++) {
    out.push(`${monthIso}-${String(d).padStart(2, "0")}`);
  }
  return out;
}

/** `YYYY-MM` → mes anterior (cruza el año). */
function monthPrev(monthIso: string): string {
  const year = Number(monthIso.slice(0, 4));
  const month = Number(monthIso.slice(5, 7));
  return month === 1
    ? `${year - 1}-12`
    : `${year}-${String(month - 1).padStart(2, "0")}`;
}

/** `YYYY-MM` → mes siguiente (cruza el año). */
function monthNext(monthIso: string): string {
  const year = Number(monthIso.slice(0, 4));
  const month = Number(monthIso.slice(5, 7));
  return month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, "0")}`;
}
