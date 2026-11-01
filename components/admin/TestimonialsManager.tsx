"use client";

// ============================================================
// TESTIMONIOS — R3-D (8.10)
//
// Cola de aprobación: ningún testimonio se publica sin consentimiento
// registrado. `approveTestimonial` lo exige también en el servidor.
// Solo administrador. Borrar es blando con "Deshacer" (8.13).
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TestimonialView } from "@/lib/content";
import {
  approveTestimonial,
  deleteTestimonial,
  restoreTestimonial,
  saveTestimonial,
} from "@/lib/content/actions";
import { Icon } from "@/components/ui";
import { Chk, SaveBar, T } from "./content/ui";

type Draft = { id?: string; name: string; context: string; text: string; consent: boolean };

const emptyDraft: Draft = { name: "", context: "", text: "", consent: false };

export function TestimonialsManager({ items }: { items: TestimonialView[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<{ id: string; name: string } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const pendientes = items.filter((t) => t.status === "pendiente");
  const aprobados = items.filter((t) => t.status === "aprobado");

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "No se pudo completar la acción.");
      else router.refresh();
      return res.ok;
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "inline-flex min-h-11 items-center rounded-(--radius-btn) border border-ink/15 bg-white px-3 text-sm font-semibold text-ink-soft hover:border-sage hover:text-sage disabled:opacity-40";

  function card(t: TestimonialView) {
    return (
      <li
        key={t.id}
        className="flex flex-col gap-3 rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-ink">
            {t.name}
            <span className="ml-2 text-sm font-normal text-ink-soft">{t.context}</span>
          </p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              t.status === "aprobado" ? "bg-sage/15 text-sage-dark" : "bg-terracotta/15 text-terracotta-dark"
            }`}
          >
            {t.status}
          </span>
        </div>
        <p className="text-sm italic text-ink-soft">“{t.text}”</p>
        <p className="text-xs text-ink-soft">
          <Icon name="check" className={`mr-1 inline h-4 w-4 ${t.consent ? "text-sage" : "text-terracotta-dark"}`} />
          {t.consent ? "Consentimiento por escrito registrado" : "Sin consentimiento registrado"}
        </p>
        <div className="flex flex-wrap gap-2">
          {t.status === "pendiente" ? (
            <button
              type="button"
              className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) bg-sage px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-sage-dark disabled:opacity-40"
              disabled={busy || !t.consent}
              title={t.consent ? undefined : "Registra primero el consentimiento (Editar)."}
              onClick={() => void run(() => approveTestimonial(t.id))}
            >
              Aprobar y publicar
            </button>
          ) : null}
          <button
            type="button"
            className={btn}
            disabled={busy}
            onClick={() =>
              setDraft({ id: t.id, name: t.name, context: t.context, text: t.text, consent: t.consent })
            }
          >
            Editar
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-(--radius-btn) border border-terracotta/40 bg-white px-3 text-sm font-semibold text-terracotta-dark hover:bg-terracotta/10 disabled:opacity-40"
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`¿Eliminar el testimonio de "${t.name}"? Podrás deshacerlo.`)) return;
              void run(async () => {
                const res = await deleteTestimonial(t.id);
                if (res.ok) setDeleted({ id: t.id, name: t.name });
                return res;
              });
            }}
          >
            Eliminar
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p role="alert" className="rounded-(--radius-input) bg-terracotta/10 px-4 py-3 text-sm font-semibold text-terracotta-dark">
          {error}
        </p>
      ) : null}

      {deleted ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-(--radius-card) border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-ink"
        >
          <p>
            Se eliminó el testimonio de <strong>{deleted.name}</strong>. Puedes restaurarlo.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void run(async () => {
                const res = await restoreTestimonial(deleted.id);
                if (res.ok) setDeleted(null);
                return res;
              });
            }}
            className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-sage px-4 py-2 font-semibold text-white no-underline hover:bg-sage-dark disabled:opacity-60"
          >
            <Icon name="arrow" className="h-4 w-4 rotate-180" />
            Deshacer
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Los testimonios solo se publican con consentimiento por escrito.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => setDraft({ ...emptyDraft })}
          className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) bg-terracotta px-4 py-2 text-sm font-semibold text-ink no-underline hover:bg-terracotta-dark disabled:opacity-60"
        >
          + Registrar testimonio
        </button>
      </div>

      {draft ? (
        <div className="rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
          <h3 className="mb-4 text-lg font-semibold text-ink">
            {draft.id ? "Editar testimonio" : "Nuevo testimonio (queda pendiente)"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <T label="Nombre" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <T
              label="Contexto"
              value={draft.context}
              onChange={(v) => setDraft({ ...draft, context: v })}
              placeholder="p. ej. «Paciente de terapia, 2025»"
            />
          </div>
          <T
            label="Testimonio"
            area
            rows={4}
            value={draft.text}
            onChange={(v) => setDraft({ ...draft, text: v })}
            className="mt-4"
          />
          <div className="mt-4">
            <Chk
              label="Consentimiento por escrito registrado"
              checked={draft.consent}
              onChange={(v) => setDraft({ ...draft, consent: v })}
              hint="Sin este permiso no se puede aprobar ni publicar."
            />
          </div>
          <SaveBar
            busy={busy}
            msg={null}
            saveLabel={draft.id ? "Guardar cambios" : "Registrar"}
            onSave={() => {
              void run(async () => {
                const res = await saveTestimonial({
                  id: draft.id,
                  name: draft.name,
                  context: draft.context,
                  text: draft.text,
                  consent: draft.consent,
                });
                if (res.ok) setDraft(null);
                return res;
              });
            }}
            onCancel={() => setDraft(null)}
          />
        </div>
      ) : null}

      <section aria-labelledby="pendientes-h">
        <h2 id="pendientes-h" className="mb-3 text-xl font-semibold text-ink">
          Por aprobar {pendientes.length > 0 ? `(${pendientes.length})` : ""}
        </h2>
        {pendientes.length === 0 ? (
          <p className="rounded-(--radius-card) border border-dashed border-ink/15 bg-white px-4 py-6 text-center text-sm text-ink-soft">
            No hay testimonios pendientes.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">{pendientes.map(card)}</ul>
        )}
      </section>

      <section aria-labelledby="publicados-h">
        <h2 id="publicados-h" className="mb-3 text-xl font-semibold text-ink">
          Publicados {aprobados.length > 0 ? `(${aprobados.length})` : ""}
        </h2>
        {aprobados.length === 0 ? (
          <p className="rounded-(--radius-card) border border-dashed border-ink/15 bg-white px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no hay testimonios aprobados en el sitio.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">{aprobados.map(card)}</ul>
        )}
      </section>
    </div>
  );
}
