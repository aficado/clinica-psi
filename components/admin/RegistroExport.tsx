"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";

/**
 * Panel oculto de descarga de auditoría (R4-B-AUDIT-2).
 * Permite elegir rango de días y horas; el archivo (.md o .txt) lo genera
 * `/api/audit/export` (solo administrador). No está en el menú del panel.
 */
export function RegistroExport({ timeZone }: { timeZone: string }) {
  const hoy = () => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(new Date())
        .map((x) => [x.type, x.value]),
    ) as Record<string, string>;
    return `${p.year}-${p.month}-${p.day}`;
  };

  const [from, setFrom] = useState(hoy);
  const [to, setTo] = useState(hoy);
  const [fromHour, setFromHour] = useState("0");
  const [toHour, setToHour] = useState("23");
  const [format, setFormat] = useState<"md" | "txt">("md");

  const invalid = from > to;
  const href = `/api/audit/export?from=${from}&to=${to}&fromHour=${fromHour}&toHour=${toHour}&format=${format}`;

  const inputCls = "w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-3 py-2";
  const labelCls = "mb-1 block text-sm font-semibold";

  return (
    <div className="space-y-4 rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Desde el día</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Hasta el día</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Desde la hora</label>
          <select value={fromHour} onChange={(e) => setFromHour(e.target.value)} className={inputCls}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Hasta la hora</label>
          <select value={toHour} onChange={(e) => setToHour(e.target.value)} className={inputCls}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:59
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Formato</label>
        <div className="flex gap-2">
          {(["md", "txt"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={format === f}
              onClick={() => setFormat(f)}
              className={
                format === f
                  ? "min-h-11 rounded-(--radius-btn) border-2 border-sage bg-sage px-4 py-2 text-sm font-semibold text-white"
                  : "min-h-11 rounded-(--radius-btn) border-2 border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-sage"
              }
            >
              {f === "md" ? "Markdown (.md)" : "Texto (.txt)"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        Zona horaria del sitio: <strong>{timeZone}</strong>. Las horas del rango son inclusivas
        (p. ej. 08:00–17:59).
      </p>

      {invalid ? (
        <p role="alert" className="rounded-(--radius-btn) bg-terracotta/15 px-4 py-3 text-sm font-medium text-terracotta-dark">
          La fecha «desde» no puede ser posterior a la «hasta».
        </p>
      ) : null}

      {invalid ? (
        <Button variant="primary" disabled>
          <Icon name="download" className="h-4 w-4" />
          Descargar
        </Button>
      ) : (
        <a
          href={href}
          className="btn inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-btn) bg-sage px-5 py-2.5 font-semibold text-white transition-colors hover:bg-sage-dark"
        >
          <Icon name="download" className="h-4 w-4" />
          Descargar {format === "md" ? "Markdown" : "texto"}
        </a>
      )}
    </div>
  );
}