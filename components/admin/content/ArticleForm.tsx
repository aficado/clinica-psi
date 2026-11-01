"use client";

import { useState } from "react";
import { articleCategories } from "@/lib/data";
import type { ArticleInput, ArticleStatus, ArticleView } from "@/lib/content";
import { saveArticle } from "@/lib/content/actions";
import { slugify } from "@/lib/utils";
import { SaveBar, Sel, T, localToMs, msToLocal, parseSections, sectionsToText, ytId } from "./ui";

const statusOptions: { key: string; label: string }[] = [
  { key: "borrador", label: "Borrador (no público)" },
  { key: "programado", label: "Programado (se publica solo)" },
  { key: "publicado", label: "Publicado" },
];

/**
 * Formulario de artículo (8.07). Crea o edita por slug; el slug no se
 * puede cambiar tras la creación. El cuerpo usa el convenio del área:
 * "# Título" abre sección y las líneas en blanco separan párrafos.
 */
export function ArticleForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: ArticleView | null;
  onSaved: (slug: string) => void;
  onCancel: () => void;
}) {
  const editing = initial !== null;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [f, setF] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    category: initial?.category ?? articleCategories[0].key,
    author: initial?.author ?? "",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    excerpt: initial?.excerpt ?? "",
    tags: (initial?.tags ?? []).join(", "),
    video: initial?.video?.id ?? "",
    status: (initial?.status ?? "borrador") as ArticleStatus,
    scheduled: initial?.scheduledAt ? msToLocal(initial.scheduledAt) : "",
    body: sectionsToText(initial?.sections ?? []),
  });
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function onSave() {
    setBusy(true);
    setMsg(null);
    const input: ArticleInput = {
      slug: editing ? f.slug : slugify(f.title || f.slug),
      title: f.title,
      category: f.category,
      status: f.status,
      scheduledAt: f.status === "programado" ? localToMs(f.scheduled) : null,
      author: f.author,
      date: f.date,
      excerpt: f.excerpt,
      tags: f.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      video: f.video ? { type: "youtube", id: ytId(f.video) } : null,
      sections: parseSections(f.body),
    };
    const res = await saveArticle(input);
    setBusy(false);
    if (!res.ok) {
      setMsg({ kind: "err", text: res.error });
      return;
    }
    setMsg({ kind: "ok", text: "Artículo guardado." });
    onSaved(input.slug);
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave();
      }}
    >
      <h3 className="text-xl font-semibold text-ink">
        {initial ? `Editar: ${initial.title}` : "Nuevo artículo"}
      </h3>
      <T label="Título" value={f.title} onChange={(v) => set("title", v)} />
      <T
        label="Slug (parte final del enlace)"
        value={f.slug}
        onChange={(v) => set("slug", v)}
        hint={editing ? "El slug no se puede cambiar después de crear el artículo." : "Se genera del título; puedes ajustarlo."}
        disabled={editing}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Sel label="Categoría" value={f.category} onChange={(v) => set("category", v)} options={articleCategories} />
        <T label="Autora o autor" value={f.author} onChange={(v) => set("author", v)} hint="TODO: autores reales (Fase 4)." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <T label="Fecha" type="date" value={f.date} onChange={(v) => set("date", v)} />
        <T
          label="Etiquetas"
          value={f.tags}
          onChange={(v) => set("tags", v)}
          hint="Separadas por comas."
        />
      </div>
      <T label="Resumen" area value={f.excerpt} onChange={(v) => set("excerpt", v)} rows={2} />
      <T
        label="Video de YouTube (opcional)"
        value={f.video}
        onChange={(v) => set("video", v)}
        hint="Pega la URL del video o su ID."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Sel
          label="Estado"
          value={f.status}
          onChange={(v) => set("status", v)}
          options={statusOptions}
        />
        {f.status === "programado" ? (
          <T
            label="Fecha y hora de publicación"
            type="datetime-local"
            value={f.scheduled}
            onChange={(v) => set("scheduled", v)}
          />
        ) : null}
      </div>
      <T
        label="Cuerpo del artículo"
        area
        rows={14}
        value={f.body}
        onChange={(v) => set("body", v)}
        hint="Una línea que empieza con «# » abre una sección; una línea en blanco separa párrafos."
        placeholder={"# Primera sección\n\nPrimer párrafo.\n\nSegundo párrafo."}
      />
      <SaveBar busy={busy} msg={msg} onSave={() => void onSave()} onCancel={onCancel} />
    </form>
  );
}
