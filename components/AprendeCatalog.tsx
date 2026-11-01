"use client";

import { useState } from "react";
import { articleCategories } from "@/lib/data";
import type { ArticleView } from "@/lib/content";
import { categoryLabel } from "./cards";
import { FilterChips, SearchBox } from "./Filters";
import { ArticleCard } from "./cards";
import { Reveal } from "./Reveal";
import { Container, SectionTitle } from "./ui";

export function AprendeCatalog({ initialCat, items }: { initialCat?: string; items: ArticleView[] }) {
  const [cat, setCat] = useState(initialCat ?? "todos");
  const [q, setQ] = useState("");

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filtered = items.filter((a) => {
    if (cat !== "todos" && a.category !== cat) return false;
    if (q.trim()) {
      const needle = norm(q);
      const haystack = norm(
        [a.title, a.excerpt, categoryLabel(articleCategories, a.category), ...a.tags].join(" "),
      );
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return (
    <>
      <section className="bg-mist" aria-labelledby="aprende-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Aprende"
              title="Artículos de bienestar, claros y sin humo"
              description="Información práctica y basada en evidencia, escrita por el equipo de la clínica."
            />
          </Reveal>
        </div>
      </section>

      <Container className="py-10">
        <Reveal delay={80}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <SearchBox value={q} onChange={setQ} placeholder="Buscar en artículos…" />
            <FilterChips options={articleCategories} value={cat} onChange={setCat} label="Filtrar por categoría" />
          </div>
        </Reveal>

        <p className="mt-8 text-sm text-ink-soft" role="status">
          {filtered.length === 1 ? "1 artículo" : `${filtered.length} artículos`}
        </p>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-(--radius-card) bg-white p-8 text-center">
            <p className="text-lg font-semibold">No encontramos artículos para esa búsqueda</p>
            <p className="mt-2 text-ink-soft">
              Intenta con otra palabra o quita los filtros. Publicamos artículos con regularidad.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => (
              <Reveal key={a.slug} variant="card" delay={Math.min(i, 4) * 70}>
                <ArticleCard a={a} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
