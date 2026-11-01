"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Aparición al hacer scroll (PROMPT §6.2 "Movimiento").
 * La entrada es una animación CSS (.reveal-in): aunque IntersectionObserver
 * añada la clase antes del primer paint, la animación se ejecuta igualmente
 * desde su inicio (una transición no lo haría). El respeto a
 * prefers-reduced-motion lo aplica el CSS (globals.css). Además, una red de
 * seguridad al hacer scroll (requestAnimationFrame) muestra el elemento si el
 * IntersectionObserver lo llegó a saltar por un swipe rápido, y un chequeo
 * único a los 1.2 s cubre el caso de un callback inicial que no llegó.
 *
 * Variantes:
 * - "up" (default): fade + desplazamiento de 48 px hacia arriba (secciones,
 *   textos, bloques).
 * - "card": fade + desplazamiento de 48 px + leve escala 0.96→1 (tarjetas),
 *   para que la aparición de cada tarjeta sea claramente visible.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className,
}: {
  children: ReactNode;
  delay?: number;
  variant?: "up" | "card";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    let ticking = false;
    // Red de seguridad: el IntersectionObserver puede perder elementos que
    // entran y salen del viewport entre dos callbacks (swipe rápido). En
    // cada scroll comprobamos directamente si el elemento ya alcanzó el
    // viewport y lo mostramos para que nunca se quede "saltado".
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (el.getBoundingClientRect().top < window.innerHeight) {
          setShown(true);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Chequeo único: si el callback inicial del IntersectionObserver no
    // llega para un elemento ya visible, lo mostramos de todos modos.
    const t = window.setTimeout(() => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        setShown(true);
      }
    }, 1200);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
      io.disconnect();
    };
  }, [shown]);

  return (
    <div
      ref={ref}
      className={cn("reveal", variant === "card" && "reveal-card", shown && "reveal-in", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
