"use client";

import { useState } from "react";
import { resourceCategories } from "@/lib/data";
import type { ArticleStatus, ResourceInput, ResourceView } from "@/lib/content";
import { saveResource } from "@/lib/content/actions";
import { slugify } from "@/lib/utils";
import { SaveBar, Sel, T, localToMs, msToLocal, ytId } from "./ui";

const statusOptions: { key: string; label: string }[] = [
  { key: "borrador", label: "Borrador (no público)" },
  { key: "programado", label: "Programado (se publica solo)" },
  { key: "publicado", label: "Publicado" },
];

const levelOptions = [
  { key: "principiante", label: "Principiante" },
  { key: "intermedio", label: "Intermedio" },
  { key: "avanzado", label: "Avanzado" },
];

/**
 * Formulario de recurso gratuito (8.07): videos y ejercicios guiados.
 * Beneficios e indicaciones: una idea por línea.
 */
export function ResourceForm({
  initial,
  serviceOptions,
  onSaved,
  onCancel,
}: {
  initial: ResourceView | null;
  serviceOptions: { key: string; label: string }[];
  onSaved: (slug: string) => void;
  onCancel: () => void;
}) {
  const editing = initial !== null;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [f, setF] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    category: initial?.category ?? resourceCategories[0].key,
    minutes: String(initial?.minutes ?? 5),
    level: (initial?.level ?? "principiante") as ResourceInput["level"],
    description: initial?.description ?? "",
    benefits: (initial?.benefits ?? []).join("\n"),
    cautions: (initial?.cautions ?? []).join("\n"),
    video: initial?.video?.id ?? "",
    poster: initial?.poster ?? "",
    relatedService: initial?.relatedService ?? "",
    status: (initial?.status ?? "borrador") as ArticleStatus,
    scheduled: initial?.scheduledAt ? msToLocal(initial.scheduledAt) : "",
  });
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function onSave() {
    setBusy(true);
    setMsg(null);
    const input: ResourceInput = {
      slug: editing ? f.slug : slugify(f.title || f.slug),
      title: f.title,
      category: f.category,
      status: f.status,
      scheduledAt: f.status === "programado" ? localToMs(f.scheduled) : null,
      minutes: Number(f.minutes) || 0,
      level: f.level,
      description: f.description,
      benefits: f.benefits.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      cautions: f.cautions.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      video: f.video ? { type: "youtube", id: ytId(f.video) } : null,
      poster: f.poster.trim() || null,
      relatedService: f.relatedService || null,
    };
    const res = await saveResource(input);
    setBusy(false);
    if (!res.ok) {
      setMsg({ kind: "err", text: res.error });
      return;
    }
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
        {initial ? `Editar: ${initial.title}` : "Nuevo recurso gratuito"}
      </h3>
      <T label="Título" value={f.title} onChange={(v) => set("title", v)} />
      <T
        label="Slug"
        value={f.slug}
        onChange={(v) => set("slug", v)}
        disabled={editing}
        hint={editing ? "El slug no se puede cambiar después de crear el recurso." : "Se genera del título; puedes ajustarlo."}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Sel label="Categoría" value={f.category} onChange={(v) => set("category", v)} options={resourceCategories} />
        <T label="Minutos" type="number" value={f.minutes} onChange={(v) => set("minutes", v)} />
        <Sel label="Nivel" value={f.level} onChange={(v) => set("level", v)} options={levelOptions} />
      </div>
      <T label="Descripción" area rows={2} value={f.description} onChange={(v) => set("description", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <T
          label="Beneficios"
          area
          rows={5}
          value={f.benefits}
          onChange={(v) => set("benefits", v)}
          hint="Uno por línea."
        />
        <T
          label="Indicaciones / precauciones"
          area
          rows={5}
          value={f.cautions}
          onChange={(v) => set("cautions", v)}
          hint="Una por línea."
        />
      </div>
      <T
        label="Video de YouTube (opcional)"
        value={f.video}
        onChange={(v) => set("video", v)}
        hint="URL o ID del video."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <T
          label="Imagen de portada (opcional)"
          value={f.poster}
          onChange={(v) => set("poster", v)}
          hint="Ruta /uploads/... o URL; si va vacía se usa la ilustración de la categoría."
        />
        <Sel
          label="Servicio relacionado (CTA)"
          value={f.relatedService}
          onChange={(v) => set("relatedService", v)}
          options={[{ key: "", label: "— Ninguno —" }, ...serviceOptions]}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Sel label="Estado" value={f.status} onChange={(v) => set("status", v)} options={statusOptions} />
        {f.status === "programado" ? (
          <T
            label="Fecha y hora de publicación"
            type="datetime-local"
            value={f.scheduled}
            onChange={(v) => set("scheduled", v)}
          />
        ) : null}
      </div>
      <SaveBar busy={busy} msg={msg} onSave={() => void onSave()} onCancel={onCancel} />
    </form>
  );
}
