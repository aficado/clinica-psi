"use client";

import { useState } from "react";
import { courseThemes } from "@/lib/data";
import type { CourseView } from "@/lib/content";
import { FilterChips } from "./Filters";
import { CourseCard } from "./cards";
import { Reveal } from "./Reveal";
import { Container, SectionTitle } from "./ui";

const modalityOptions = [
  { key: "presencial", label: "Presencial" },
  { key: "enlinea", label: "En línea" },
];

export function CoursesCatalog({ initialTheme, items }: { initialTheme?: string; items: CourseView[] }) {
  const [theme, setTheme] = useState(initialTheme ?? "todos");
  const [mod, setMod] = useState("todos");

  const filtered = items.filter(
    (c) => (theme === "todos" || c.theme === theme) && (mod === "todos" || c.modality === mod),
  );

  return (
    <>
      <section className="bg-mist" aria-labelledby="cursos-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Cursos y talleres"
              title="Aprende herramientas que se quedan contigo"
              description="Grupos pequeños, práctica guiada y seguimiento. Cada grupo tiene cupo limitado."
            />
          </Reveal>
        </div>
      </section>

      <Container className="py-10">
        <Reveal delay={80}>
          <div className="space-y-5">
            <FilterChips options={courseThemes} value={theme} onChange={setTheme} label="Filtrar por tema" />
            <FilterChips options={modalityOptions} value={mod} onChange={setMod} label="Filtrar por modalidad" />
          </div>
        </Reveal>

        <p className="mt-8 text-sm text-ink-soft" role="status">
          {filtered.length === 1 ? "1 curso" : `${filtered.length} cursos`}
        </p>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-(--radius-card) bg-white p-8 text-center">
            <p className="text-lg font-semibold">No hay cursos con esa combinación de filtros</p>
            <p className="mt-2 text-ink-soft">
              Prueba con otro tema o modalidad, o escríbenos: es probable que se abra pronto.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filtered.map((c, i) => (
              <Reveal key={c.slug} variant="card" delay={Math.min(i, 4) * 70}>
                <CourseCard c={c} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
