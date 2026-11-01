"use client";

import { useState } from "react";
import { courseThemes } from "@/lib/data";
import type { CourseInput, CourseView } from "@/lib/content";
import { saveCourse } from "@/lib/content/actions";
import { slugify } from "@/lib/utils";
import { Chk, SaveBar, Sel, T } from "./ui";

const modalityOptions = [
  { key: "presencial", label: "Presencial" },
  { key: "enlinea", label: "En línea" },
  { key: "grabado", label: "Grabado" },
];

/**
 * Formulario de curso o taller (8.08). Requisitos y temario: una
 * idea por línea. El orden se mueve desde la lista.
 */
export function CourseForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: CourseView | null;
  onSaved: (slug: string) => void;
  onCancel: () => void;
}) {
  const editing = initial !== null;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [f, setF] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    theme: initial?.theme ?? courseThemes[0].key,
    modality: (initial?.modality ?? "presencial") as CourseInput["modality"],
    weeks: String(initial?.weeks ?? 4),
    schedule: initial?.schedule ?? "",
    description: initial?.description ?? "",
    instructor: initial?.instructor ?? "",
    price: initial?.price ?? "",
    seats: initial?.seats ?? "",
    requirements: (initial?.requirements ?? []).join("\n"),
    syllabus: (initial?.syllabus ?? []).join("\n"),
    forWho: initial?.forWho ?? "",
    visible: initial ? initial.visible : true,
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  async function onSave() {
    setBusy(true);
    setMsg(null);
    const input: CourseInput = {
      slug: editing ? f.slug : slugify(f.title || f.slug),
      title: f.title,
      theme: f.theme,
      modality: f.modality,
      weeks: Number(f.weeks),
      schedule: f.schedule,
      description: f.description,
      instructor: f.instructor,
      price: f.price,
      seats: f.seats,
      requirements: f.requirements.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      syllabus: f.syllabus.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      forWho: f.forWho,
      visible: f.visible,
    };
    const res = await saveCourse(input);
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
        {initial ? `Editar: ${initial.title}` : "Nuevo curso o taller"}
      </h3>
      <T label="Título" value={f.title} onChange={(v) => set("title", v)} />
      <T
        label="Slug"
        value={f.slug}
        onChange={(v) => set("slug", v)}
        disabled={editing}
        hint={editing ? "El slug no se puede cambiar después de crear el curso." : "Se genera del título; puedes ajustarlo."}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Sel label="Tema" value={f.theme} onChange={(v) => set("theme", v)} options={courseThemes} />
        <Sel label="Modalidad" value={f.modality} onChange={(v) => set("modality", v)} options={modalityOptions} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <T label="Semanas" type="number" value={f.weeks} onChange={(v) => set("weeks", v)} />
        <T label="Horario" value={f.schedule} onChange={(v) => set("schedule", v)} placeholder="Sáb 10:00–11:30" />
        <T label="Cupos" value={f.seats} onChange={(v) => set("seats", v)} placeholder="12 lugares" />
      </div>
      <T label="Descripción" area rows={3} value={f.description} onChange={(v) => set("description", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <T label="Instructor o instructora" value={f.instructor} onChange={(v) => set("instructor", v)} hint="TODO: instructors reales (Fase 4)." />
        <T label="Precio" value={f.price} onChange={(v) => set("price", v)} hint="TODO: precio real." placeholder="$1,600 MXN" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <T
          label="Requisitos"
          area
          rows={4}
          value={f.requirements}
          onChange={(v) => set("requirements", v)}
          hint="Uno por línea."
        />
        <T
          label="Temario (sesión por línea)"
          area
          rows={4}
          value={f.syllabus}
          onChange={(v) => set("syllabus", v)}
          hint="Una sesión por línea."
        />
      </div>
      <T label="¿Para quién es?" area rows={3} value={f.forWho} onChange={(v) => set("forWho", v)} />
      <Chk
        label="Visible en el sitio"
        checked={f.visible}
        onChange={(v) => set("visible", v)}
        hint="Si se desactiva, la página del curso deja de verse en público."
      />
      <SaveBar busy={busy} msg={msg} onSave={() => void onSave()} onCancel={onCancel} />
    </form>
  );
}
