"use client";

// ============================================================
// Helpers compartidos por los formularios del hub de contenido
// (R3-C, 8.07/8.08). Solo tipos y funciones puras: nada que
// dependa de la base de datos (ver nota en `lib/content.ts`).
// ============================================================

import type { ReactNode } from "react";
import type { ArticleSection } from "@/lib/data";

export const inputCls =
  "w-full rounded-(--radius-input) border border-ink/15 bg-white px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30";

/** Label + control + hint. */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}

/** Input o textarea controlado. */
export function T({
  label,
  value,
  onChange,
  hint,
  type = "text",
  area = false,
  rows = 3,
  placeholder,
  disabled = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  area?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      {area ? (
        <textarea
          className={inputCls}
          rows={rows}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={inputCls}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

/** Select controlado a partir de opciones {key,label}. */
export function Sel({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Checkbox simple. */
export function Chk({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[#3f5e52]"
      />
      <span>
        <span className="font-semibold text-ink">{label}</span>
        {hint ? <span className="block text-xs text-ink-soft">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Barra de guardar/cancelar con mensaje de resultado. */
export function SaveBar({
  busy,
  msg,
  onSave,
  onCancel,
  saveLabel = "Guardar",
}: {
  busy: boolean;
  msg: { kind: "ok" | "err"; text: string } | null;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-sage px-5 py-2.5 font-semibold text-white no-underline hover:bg-sage-dark disabled:opacity-60"
      >
        {busy ? "Guardando…" : saveLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) border-2 border-sage/40 px-5 py-2.5 font-semibold text-sage no-underline hover:border-sage hover:bg-sage/10"
      >
        Volver a la lista
      </button>
      {msg ? (
        <p
          role="status"
          className={`text-sm font-semibold ${msg.kind === "ok" ? "text-sage-dark" : "text-terracotta-dark"}`}
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}

/** Extrae el ID de una URL de YouTube; si ya es un ID, lo devuelve. */
export function ytId(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  const m = v.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
  return m ? m[1] : v;
}

/**
 * Texto del área → secciones: una línea "# Título" abre sección;
 * las líneas en blanco separan párrafos (decisión 8.07).
 */
export function parseSections(text: string): ArticleSection[] {
  const sections: ArticleSection[] = [];
  let cur: ArticleSection | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (buf.length > 0 && cur) cur.paragraphs.push(buf.join(" "));
    buf = [];
  };
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) {
      flush();
      continue;
    }
    if (/^#{1,6}\s+/.test(t)) {
      flush();
      cur = { heading: t.replace(/^#{1,6}\s+/, "").trim(), paragraphs: [] };
      sections.push(cur);
    } else {
      if (!cur) {
        cur = { paragraphs: [] };
        sections.push(cur);
      }
      buf.push(t);
    }
  }
  flush();
  return sections.filter((s) => s.heading || s.paragraphs.length > 0);
}

/** Secciones → texto del área (inverso de `parseSections`). */
export function sectionsToText(sections: ArticleSection[]): string {
  return sections
    .map((s) => [s.heading ? `# ${s.heading}` : "", ...s.paragraphs].filter(Boolean).join("\n\n"))
    .join("\n\n");
}

/** Una lista por línea (beneficios, indicaciones, requisitos, temario). */
export function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function listToText(items: string[]): string {
  return items.join("\n");
}

/** FAQ: una línea por pregunta con formato "Pregunta | Respuesta". */
export function parseFaq(text: string): { q: string; a: string }[] {
  return lines(text)
    .map((l) => {
      const i = l.indexOf("|");
      if (i < 0) return { q: l, a: "" };
      return { q: l.slice(0, i).trim(), a: l.slice(i + 1).trim() };
    })
    .filter((f) => f.q && f.a);
}

export function faqToText(faq: { q: string; a: string }[]): string {
  return faq.map((f) => `${f.q} | ${f.a}`).join("\n");
}

/** epoch ms → valor de <input datetime-local> en hora local. */
export function msToLocal(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** valor de <input datetime-local> → epoch ms (o null). */
export function localToMs(v: string): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
}
