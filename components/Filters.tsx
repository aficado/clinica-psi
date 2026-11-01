"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./ui";

type Option = { key: string; label: string };

function chipCls(active: boolean): string {
  return cn(
    "min-h-11 rounded-full border px-4 py-2 font-medium transition-colors duration-200",
    active
      ? "border-sage bg-sage text-white"
      : "border-ink/15 bg-white text-ink hover:border-sage/60 hover:bg-mist/60",
  );
}

/** Chips de filtrado (PROMPT §8: filtros por categoría, duración y nivel). */
export function FilterChips({
  options,
  value,
  onChange,
  label,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      <button type="button" className={chipCls(value === "todos")} onClick={() => onChange("todos")}>
        Todos
      </button>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          className={chipCls(value === o.key)}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Buscas simple (client-side, sin dependencias). */
export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <label className="sr-only" htmlFor="buscador">
        Buscar
      </label>
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" />
      <input
        id="buscador"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white py-2.5 pl-10 pr-4 text-ink placeholder:text-ink-soft/70"
      />
    </div>
  );
}
