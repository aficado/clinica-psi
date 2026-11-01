"use client";

import { useState } from "react";
import { serviceCategories } from "@/lib/data";
import type { Modality, ServiceInput, ServiceView } from "@/lib/content";
import { saveService } from "@/lib/content/actions";
import { slugify } from "@/lib/utils";
import { Chk, SaveBar, Sel, T, faqToText, parseFaq } from "./ui";

/**
 * Formulario de servicio (8.08). El orden se mueve desde la lista;
 * aquí solo se edita el contenido y si está visible o no.
 * FAQ: una pregunta por línea con formato "Pregunta | Respuesta".
 */
export function ServiceForm({
  initial,
  resourceOptions,
  onSaved,
  onCancel,
}: {
  initial: ServiceView | null;
  resourceOptions: { key: string; label: string }[];
  onSaved: (slug: string) => void;
  onCancel: () => void;
}) {
  const editing = initial !== null;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [f, setF] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    category: initial?.category ?? serviceCategories[0].key,
    duration: String(initial?.duration ?? 50),
    buffer: String(initial?.buffer ?? 10),
    description: initial?.description ?? "",
    presencial: (initial?.modalities ?? ["presencial", "enlinea"]).includes("presencial"),
    enlinea: (initial?.modalities ?? ["presencial", "enlinea"]).includes("enlinea"),
    forWho: initial?.forWho ?? "",
    whatToExpect: initial?.whatToExpect ?? "",
    faq: faqToText(initial?.faq ?? []),
    relatedResource: initial?.relatedResource ?? "",
    visible: initial ? initial.visible : true,
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  async function onSave() {
    setBusy(true);
    setMsg(null);
    const modalities: Modality[] = [];
    if (f.presencial) modalities.push("presencial");
    if (f.enlinea) modalities.push("enlinea");
    const input: ServiceInput = {
      slug: editing ? f.slug : slugify(f.name || f.slug),
      name: f.name,
      category: f.category,
      duration: Number(f.duration),
      buffer: Number(f.buffer),
      description: f.description,
      modalities,
      forWho: f.forWho,
      whatToExpect: f.whatToExpect,
      faq: parseFaq(f.faq),
      relatedResource: f.relatedResource || null,
      visible: f.visible,
    };
    const res = await saveService(input);
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
        {initial ? `Editar: ${initial.name}` : "Nuevo servicio"}
      </h3>
      <T label="Nombre" value={f.name} onChange={(v) => set("name", v)} />
      <T
        label="Slug"
        value={f.slug}
        onChange={(v) => set("slug", v)}
        disabled={editing}
        hint={editing ? "El slug no se puede cambiar después de crear el servicio." : "Se genera del nombre; puedes ajustarlo."}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Sel label="Categoría" value={f.category} onChange={(v) => set("category", v)} options={serviceCategories} />
        <T label="Duración (min)" type="number" value={f.duration} onChange={(v) => set("duration", v)} />
        <T label="Buffer entre citas (min)" type="number" value={f.buffer} onChange={(v) => set("buffer", v)} />
      </div>
      <div className="flex flex-wrap gap-6">
        <Chk label="Presencial" checked={f.presencial} onChange={(v) => set("presencial", v)} />
        <Chk label="En línea" checked={f.enlinea} onChange={(v) => set("enlinea", v)} />
        <Chk
          label="Visible en el sitio"
          checked={f.visible}
          onChange={(v) => set("visible", v)}
          hint="Si se desactiva, la página del servicio deja de verse en público."
        />
      </div>
      <T label="Descripción" area rows={3} value={f.description} onChange={(v) => set("description", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <T label="¿Para quién es?" area rows={4} value={f.forWho} onChange={(v) => set("forWho", v)} />
        <T
          label="¿Qué puedes esperar?"
          area
          rows={4}
          value={f.whatToExpect}
          onChange={(v) => set("whatToExpect", v)}
        />
      </div>
      <T
        label="Preguntas frecuentes"
        area
        rows={5}
        value={f.faq}
        onChange={(v) => set("faq", v)}
        hint="Una por línea: «Pregunta | Respuesta»."
        placeholder={"¿Cuánto dura la sesión? | Unos 50 minutos."}
      />
      <Sel
        label="Recurso gratuito relacionado"
        value={f.relatedResource}
        onChange={(v) => set("relatedResource", v)}
        options={[{ key: "", label: "— Ninguno —" }, ...resourceOptions]}
      />
      <SaveBar busy={busy} msg={msg} onSave={() => void onSave()} onCancel={onCancel} />
    </form>
  );
}
