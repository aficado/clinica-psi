import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   Componentes UI base (PROMPT.md §6: "Calma cálida y profesional")
   Todos consumen design tokens; ninguno hardcodea colores.
   ============================================================ */

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

/** Título de sección: eyebrow + título + descripción opcional. */
export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-sage">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl leading-tight sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-ink-soft">{description}</p> : null}
    </div>
  );
}

/* ---------- Botones (objetivos táctiles ≥ 44 px) ---------- */

const btnBase =
  "btn inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-btn) px-5 py-2.5 font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";

export function Button({
  children,
  href,
  onClick,
  type,
  variant = "primary",
  className,
  ariaLabel,
  disabled,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-terracotta text-ink hover:bg-terracotta-dark",
    secondary: "bg-sage text-white hover:bg-sage-dark",
    ghost: "border-2 border-sage/40 text-sage hover:border-sage hover:bg-sage/10",
  }[variant];
  const cls = cn(btnBase, styles, disabled && "opacity-50 pointer-events-none", className);
  if (href) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} onClick={onClick} className={cls} aria-label={ariaLabel} disabled={disabled}>
      {children}
    </button>
  );
}

/* ---------- Tarjetas y chips ---------- */

export function Card({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "article" }) {
  return (
    <Tag
      className={cn(
        "rounded-(--radius-card) bg-white shadow-[0_1px_2px_rgba(31,42,39,0.06),0_8px_24px_rgba(31,42,39,0.07)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(31,42,39,0.08),0_18px_36px_rgba(31,42,39,0.13)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1 text-sm font-medium text-sage-dark",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Chip visible para marcar datos de ejemplo (regla 12.6 del PROMPT). */
export function TodoChip({ children = "TODO" }: { children?: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-dashed border-terracotta/70 bg-terracotta/10 px-2 py-0.5 text-xs font-semibold text-terracotta-dark"
      title="Dato de ejemplo: reemplazar con la información real"
    >
      {children}
    </span>
  );
}

/* ---------- Iconos (trazo consistente, 24px) ---------- */

const icons = {
  leaf: "M12 21c-5 0-8-4-8-8 0-5 4-8 8-8 4 0 7 3 7 7 0 4-3 7-7 7zm0 0c0-6 2-9 6-11",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 3.1 4.2 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.7c.1 1 .5 2 1 2.9a2 2 0 0 1 0 1.9l-1 1a12.5 12.5 0 0 0 6 6l1-1a2 2 0 0 1 1.9 0c.9.5 1.9.9 2.9 1a2 2 0 0 1 1.7 2z",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2l8 6 8-6",
  pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  clock: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zm0-14v5l3 3",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  check: "M20 6 9 17l-5-5",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M18 6 6 18M6 6l12 12",
  whatsapp:
    "M12 2a10 10 0 0 0-8.6 15L3 21l4.1-1.2A10 10 0 1 0 12 2zm8 10a8 8 0 0 1-11.3-2.4l1.8 2a1.2 1.2 0 0 1 .6 1.2c.4 1.5 1.5 2.6 3 3a1.2 1.2 0 0 1 1.2-.6l2-1.8A8 8 0 0 1 20 12z",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 15V3m0 0-4 4m4-4 4 4",
  play: "M8 5v14l11-7z",
  calendar: "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 7h4v4H8zM14 11h4v4h-4z",
  user: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 10a8 8 0 0 1 16 0",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8",
  copy: "M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2zm-3 4h2v8H8a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z",
  heart: "M12 21C7 16.5 3 13 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4-4 7.5-9 12z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zm16-2v4",
  qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 14h3v3h-3zM14 18h3v3h-3zM18 18h3v3h-3z",
  shield: "M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10zm-3-10l2 2 4-4",
  search: "M21 21l-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z",
  video: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm6 5 5 3-5 3z",
  download: "M12 3v12m0 0 4-4m-4 4-4-4M4 21h16",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5",
};

export function Icon({ name, className }: { name: keyof typeof icons; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d={icons[name]} />
    </svg>
  );
}
