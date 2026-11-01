"use client";

import { useState } from "react";
import { resourceCategories } from "@/lib/data";
import type { ResourceView } from "@/lib/content";
import { FilterChips } from "./Filters";
import { ResourceCard } from "./cards";
import { Reveal } from "./Reveal";
import { Container, SectionTitle } from "./ui";

const levelOptions = [
  { key: "principiante", label: "Principiante" },
  { key: "intermedio", label: "Intermedio" },
  { key: "avanzado", label: "Avanzado" },
];

const durationOptions = [
  { key: "corto", label: "Corto (≤ 8 min)" },
  { key: "medio", label: "Medio (9–12 min)" },
  { key: "largo", label: "Largo (13+ min)" },
];

export function FreeCatalog({ initialCat, items }: { initialCat?: string; items: ResourceView[] }) {
  const [cat, setCat] = useState(initialCat ?? "todos");
  const [level, setLevel] = useState("todos");
  const [dur, setDur] = useState("todos");

  const filtered = items.filter((r) => {
    if (cat !== "todos" && r.category !== cat) return false;
    if (level !== "todos" && r.level !== level) return false;
    if (dur === "corto" && r.minutes > 8) return false;
    if (dur === "medio" && (r.minutes < 9 || r.minutes > 12)) return false;
    if (dur === "largo" && r.minutes <= 12) return false;
    return true;
  });

  return (
    <>
      <section className="bg-mist" aria-labelledby="gratis-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Biblioteca gratis"
              title="Contenido para cuidar tu día a día"
              description="Videos y ejercicios guiados que puedes practicar en casa, sin registro y sin costo."
            />
          </Reveal>
        </div>
      </section>

      <Container className="py-10">
        <Reveal delay={80}>
          <div className="space-y-5">
            <FilterChips options={resourceCategories} value={cat} onChange={setCat} label="Filtrar por categoría" />
            <FilterChips options={levelOptions} value={level} onChange={setLevel} label="Filtrar por nivel" />
            <FilterChips options={durationOptions} value={dur} onChange={setDur} label="Filtrar por duración" />
          </div>
        </Reveal>

        <p className="mt-8 text-sm text-ink-soft" role="status">
          {filtered.length === 1 ? "1 recurso" : `${filtered.length} recursos`}
        </p>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-(--radius-card) bg-white p-8 text-center">
            <p className="text-lg font-semibold">No hay recursos con esa combinación de filtros</p>
            <p className="mt-2 text-ink-soft">
              Prueba con otra categoría, nivel o duración, o quita algún filtro.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r, i) => (
              <Reveal key={r.slug} variant="card" delay={Math.min(i, 4) * 70}>
                <ResourceCard r={r} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
