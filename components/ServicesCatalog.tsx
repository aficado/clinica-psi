"use client";

import { useState } from "react";
import { serviceCategories } from "@/lib/data";
import type { ServiceView } from "@/lib/content";
import { FilterChips } from "./Filters";
import { ServiceCard } from "./cards";
import { Reveal } from "./Reveal";
import { Container, SectionTitle } from "./ui";

export function ServicesCatalog({ initialCat, items }: { initialCat?: string; items: ServiceView[] }) {
  const [cat, setCat] = useState(initialCat ?? "todos");

  const filtered = items.filter((s) => cat === "todos" || s.category === cat);

  return (
    <>
      <section className="bg-mist" aria-labelledby="servicios-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Servicios"
              title="Acompañamiento profesional, integral y cercano"
              description="Cada servicio incluye evaluación inicial y un plan acordado contigo. Agenda en línea o por WhatsApp."
            />
          </Reveal>
        </div>
      </section>

      <Container className="py-10">
        <Reveal delay={80}>
          <FilterChips options={serviceCategories} value={cat} onChange={setCat} label="Filtrar por categoría" />
        </Reveal>
        <p className="mt-8 text-sm text-ink-soft" role="status">
          {filtered.length === 1 ? "1 servicio" : `${filtered.length} servicios`}
        </p>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-(--radius-card) bg-white p-8 text-center">
            <p className="text-lg font-semibold">No hay servicios en esa categoría</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filtered.map((s, i) => (
              <Reveal key={s.slug} variant="card" delay={Math.min(i, 4) * 70}>
                <ServiceCard s={s} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
