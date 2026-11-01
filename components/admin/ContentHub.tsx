"use client";

// ============================================================
// HUB DE CONTENIDO — R3-C (8.07 / 8.08)
//
// Pestañas de Artículos, Recursos, Servicios y Cursos. Listas leídas
// de la base de datos por la página (server); las escrituras van a
// server actions con RBAC validado en el servidor. Borrar es blando
// y ofrece "Deshacer" (8.13). El orden de servicios/cursos se mueve
// aquí con `reorderServices` / `reorderCourses`.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ArticleView,
  CourseInput,
  CourseView,
  ResourceView,
  ServiceInput,
  ServiceView,
} from "@/lib/content";
import {
  deleteArticle,
  deleteCourse,
  deleteResource,
  deleteService,
  reorderCourses,
  reorderServices,
  restoreArticle,
  restoreCourse,
  restoreResource,
  restoreService,
  saveCourse,
  saveService,
  setArticleStatus,
  setResourceStatus,
} from "@/lib/content/actions";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui";
import { ArticleForm } from "./content/ArticleForm";
import { ResourceForm } from "./content/ResourceForm";
import { ServiceForm } from "./content/ServiceForm";
import { CourseForm } from "./content/CourseForm";

type TabKey = "articulos" | "recursos" | "servicios" | "cursos";

const TABS: { key: TabKey; label: string }[] = [
  { key: "articulos", label: "Artículos" },
  { key: "recursos", label: "Recursos gratis" },
  { key: "servicios", label: "Servicios" },
  { key: "cursos", label: "Cursos y talleres" },
];

const statusChip: Record<string, string> = {
  publicado: "bg-sage/15 text-sage-dark",
  programado: "bg-terracotta/15 text-terracotta-dark",
  borrador: "bg-mist text-ink-soft",
};

export function ContentHub({
  articles,
  resources,
  services,
  courses,
  isAdmin,
  initialTab,
  initialEdit,
}: {
  articles: ArticleView[];
  resources: ResourceView[];
  services: ServiceView[];
  courses: CourseView[];
  isAdmin: boolean;
  initialTab?: string;
  initialEdit?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>(
    (TABS.find((t) => t.key === initialTab)?.key as TabKey) ?? "articulos",
  );
  // Edición abierta: null = lista; slug "" = crear nuevo.
  const [editing, setEditing] = useState<{ kind: TabKey; slug: string } | null>(() =>
    initialEdit
      ? {
          kind:
            (TABS.find((t) => t.key === initialTab)?.key as TabKey) ??
            (articles.some((a) => a.slug === initialEdit)
              ? "articulos"
              : resources.some((r) => r.slug === initialEdit)
                ? "recursos"
                : services.some((s) => s.slug === initialEdit)
                  ? "servicios"
                  : "cursos"),
          slug: initialEdit,
        }
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ kind: TabKey; slug: string; name: string } | null>(
    null,
  );

  const serviceOptions = services.map((s) => ({ key: s.slug, label: s.name }));
  const resourceOptions = resources.map((r) => ({ key: r.slug, label: r.title }));

  function refresh() {
    router.refresh();
  }

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "No se pudo completar la acción.");
      else refresh();
    } finally {
      setBusy(false);
    }
  }

  /* ---------- acciones por colección ---------- */

  const setStatus = (slug: string, status: "borrador" | "publicado") =>
    run(() => (tab === "articulos" ? setArticleStatus(slug, status, null) : setResourceStatus(slug, status, null)));

  const remove = (kind: TabKey, slug: string, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}"? Podrás deshacerlo desde el aviso que aparece justo después.`)) return;
    void run(async () => {
      const res =
        kind === "articulos"
          ? await deleteArticle(slug)
          : kind === "recursos"
            ? await deleteResource(slug)
            : kind === "servicios"
              ? await deleteService(slug)
              : await deleteCourse(slug);
      if (res.ok) setLastDeleted({ kind, slug, name });
      return res;
    });
  };

  function undo() {
    if (!lastDeleted) return;
    const { kind, slug } = lastDeleted;
    void run(async () => {
      const res =
        kind === "articulos"
          ? await restoreArticle(slug)
          : kind === "recursos"
            ? await restoreResource(slug)
            : kind === "servicios"
              ? await restoreService(slug)
              : await restoreCourse(slug);
      if (res.ok) setLastDeleted(null);
      return res;
    });
  }

  const toggleVisible = (s: ServiceView) =>
    run(() => saveService(serviceInput(s, { visible: !s.visible })));
  const toggleCourseVisible = (c: CourseView) =>
    run(() => saveCourse(courseInput(c, { visible: !c.visible })));

  function move(list: { slug: string }[], index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= list.length) return;
    const slugs = list.map((x) => x.slug);
    [slugs[index], slugs[to]] = [slugs[to], slugs[index]];
    void run(() => (tab === "servicios" ? reorderServices(slugs) : reorderCourses(slugs)));
  }

  /* ---------- formulario abierto ---------- */

  if (editing && editing.kind === tab) {
    const back = () => setEditing(null);
    const onSaved = () => {
      setEditing(null);
      refresh();
    };
    return (
      <div className="rounded-(--radius-card) bg-white p-6 shadow-[0_4px_16px_rgba(31,42,39,0.06)]">
        {tab === "articulos" ? (
          <ArticleForm
            initial={articles.find((a) => a.slug === editing.slug) ?? null}
            onSaved={onSaved}
            onCancel={back}
          />
        ) : tab === "recursos" ? (
          <ResourceForm
            initial={resources.find((r) => r.slug === editing.slug) ?? null}
            serviceOptions={serviceOptions}
            onSaved={onSaved}
            onCancel={back}
          />
        ) : tab === "servicios" ? (
          <ServiceForm
            initial={services.find((s) => s.slug === editing.slug) ?? null}
            resourceOptions={resourceOptions}
            onSaved={onSaved}
            onCancel={back}
          />
        ) : (
          <CourseForm
            initial={courses.find((c) => c.slug === editing.slug) ?? null}
            onSaved={onSaved}
            onCancel={back}
          />
        )}
      </div>
    );
  }

  /* ---------- lista ---------- */

  return (
    <div className="flex flex-col gap-6">
      {/* Pestañas */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Colecciones de contenido">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              setEditing(null);
            }}
            className={cn(
              "min-h-11 rounded-(--radius-btn) px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-sage text-white" : "bg-white text-ink-soft hover:bg-mist",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="rounded-(--radius-input) bg-terracotta/10 px-4 py-3 text-sm font-semibold text-terracotta-dark">
          {error}
        </p>
      ) : null}

      {lastDeleted ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-(--radius-card) border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-ink"
        >
          <p>
            Se eliminó <strong>{lastDeleted.name}</strong>. Puedes restaurarlo mientras no se
            purguen los borrados.
          </p>
          <button
            type="button"
            onClick={undo}
            disabled={busy}
            className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-sage px-4 py-2 font-semibold text-white no-underline hover:bg-sage-dark disabled:opacity-60"
          >
            <Icon name="arrow" className="h-4 w-4 rotate-180" />
            Deshacer
          </button>
        </div>
      ) : null}

      {/* Botón crear */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {tab === "articulos" && `${articles.length} artículo(s)`}
          {tab === "recursos" && `${resources.length} recurso(s)`}
          {tab === "servicios" && `${services.length} servicio(s) · el orden define la lista pública`}
          {tab === "cursos" && `${courses.length} curso(s) · el orden define la lista pública`}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => setEditing({ kind: tab, slug: "" })}
          className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-terracotta px-4 py-2 text-sm font-semibold text-ink no-underline hover:bg-terracotta-dark disabled:opacity-60"
        >
          + Nuevo
        </button>
      </div>

      {tab === "articulos" ? (
        <ul className="flex flex-col gap-2">
          {articles.map((a) => (
            <Row
              key={a.slug}
              title={a.title}
              meta={`${a.category} · ${a.date}`}
              chip={a.status}
              viewHref={`/aprende/${a.slug}?preview=1`}
              busy={busy}
              isAdmin={isAdmin}
              onEdit={() => setEditing({ kind: "articulos", slug: a.slug })}
              onPublish={
                a.status === "publicado"
                  ? () => setStatus(a.slug, "borrador")
                  : () => setStatus(a.slug, "publicado")
              }
              publishLabel={a.status === "publicado" ? "Poner en borrador" : "Publicar"}
              onDelete={() => remove("articulos", a.slug, a.title)}
            />
          ))}
        </ul>
      ) : null}

      {tab === "recursos" ? (
        <ul className="flex flex-col gap-2">
          {resources.map((r) => (
            <Row
              key={r.slug}
              title={r.title}
              meta={`${r.category} · ${r.minutes} min`}
              chip={r.status}
              viewHref={`/gratis/${r.slug}?preview=1`}
              busy={busy}
              isAdmin={isAdmin}
              onEdit={() => setEditing({ kind: "recursos", slug: r.slug })}
              onPublish={
                r.status === "publicado"
                  ? () => setStatus(r.slug, "borrador")
                  : () => setStatus(r.slug, "publicado")
              }
              publishLabel={r.status === "publicado" ? "Poner en borrador" : "Publicar"}
              onDelete={() => remove("recursos", r.slug, r.title)}
            />
          ))}
        </ul>
      ) : null}

      {tab === "servicios" ? (
        <ul className="flex flex-col gap-2">
          {services.map((s, i) => (
            <Row
              key={s.slug}
              title={s.name}
              meta={`${s.category} · ${s.duration} min`}
              chip={s.visible ? "visible" : "oculto"}
              viewHref={`/servicios/${s.slug}?preview=1`}
              busy={busy}
              isAdmin={isAdmin}
              onEdit={() => setEditing({ kind: "servicios", slug: s.slug })}
              onPublish={() => toggleVisible(s)}
              publishLabel={s.visible ? "Ocultar" : "Mostrar"}
              onDelete={() => remove("servicios", s.slug, s.name)}
              order={{ index: i, total: services.length, up: () => move(services, i, -1), down: () => move(services, i, 1) }}
            />
          ))}
        </ul>
      ) : null}

      {tab === "cursos" ? (
        <ul className="flex flex-col gap-2">
          {courses.map((c, i) => (
            <Row
              key={c.slug}
              title={c.title}
              meta={`${c.theme} · ${c.weeks} semanas`}
              chip={c.visible ? "visible" : "oculto"}
              viewHref={`/cursos/${c.slug}?preview=1`}
              busy={busy}
              isAdmin={isAdmin}
              onEdit={() => setEditing({ kind: "cursos", slug: c.slug })}
              onPublish={() => toggleCourseVisible(c)}
              publishLabel={c.visible ? "Ocultar" : "Mostrar"}
              onDelete={() => remove("cursos", c.slug, c.title)}
              order={{ index: i, total: courses.length, up: () => move(courses, i, -1), down: () => move(courses, i, 1) }}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Fila de la lista con acciones. */
function Row({
  title,
  meta,
  chip,
  viewHref,
  busy,
  isAdmin,
  onEdit,
  onPublish,
  publishLabel,
  onDelete,
  order,
}: {
  title: string;
  meta: string;
  chip: string;
  viewHref: string;
  busy: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onPublish: () => void;
  publishLabel: string;
  onDelete: () => void;
  order?: { index: number; total: number; up: () => void; down: () => void };
}) {
  const btn =
    "inline-flex min-h-11 items-center rounded-(--radius-btn) border border-ink/15 bg-white px-3 text-sm font-semibold text-ink-soft hover:border-sage hover:text-sage disabled:opacity-40";
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-(--radius-card) bg-white px-4 py-3 shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{title}</p>
        <p className="text-xs text-ink-soft">{meta}</p>
      </div>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
          chip === "visible"
            ? "bg-sage/15 text-sage-dark"
            : chip === "oculto"
              ? "bg-mist text-ink-soft"
              : statusChip[chip] ?? "bg-mist text-ink-soft",
        )}
      >
        {chip}
      </span>
      {order ? (
        <span className="flex gap-1">
          <button type="button" className={btn} disabled={busy || order.index === 0} onClick={order.up} aria-label={`Subir ${title}`}>
            ↑
          </button>
          <button
            type="button"
            className={btn}
            disabled={busy || order.index >= order.total - 1}
            onClick={order.down}
            aria-label={`Bajar ${title}`}
          >
            ↓
          </button>
        </span>
      ) : null}
      <a href={viewHref} target="_blank" rel="noopener" className={cn(btn, "no-underline")}>
        Ver
      </a>
      <button type="button" className={btn} disabled={busy} onClick={onPublish}>
        {publishLabel}
      </button>
      <button type="button" className={btn} disabled={busy} onClick={onEdit}>
        Editar
      </button>
      {isAdmin ? (
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-(--radius-btn) border border-terracotta/40 bg-white px-3 text-sm font-semibold text-terracotta-dark hover:bg-terracotta/10 disabled:opacity-40"
          disabled={busy}
          onClick={onDelete}
        >
          Eliminar
        </button>
      ) : null}
    </li>
  );
}

/* Reconstruyen el input completo a partir de la vista para acciones
   rápidas (mostrar/ocultar) sin abrir el formulario. */

function serviceInput(s: ServiceView, patch: Partial<ServiceInput> = {}): ServiceInput {
  return {
    slug: s.slug,
    name: s.name,
    category: s.category,
    duration: s.duration,
    buffer: s.buffer,
    description: s.description,
    modalities: s.modalities,
    forWho: s.forWho,
    whatToExpect: s.whatToExpect,
    faq: s.faq,
    relatedResource: s.relatedResource ?? null,
    visible: s.visible,
    ...patch,
  };
}

function courseInput(c: CourseView, patch: Partial<CourseInput> = {}): CourseInput {
  return {
    slug: c.slug,
    title: c.title,
    theme: c.theme,
    modality: c.modality,
    weeks: c.weeks,
    schedule: c.schedule,
    description: c.description,
    instructor: c.instructor,
    price: c.price,
    seats: c.seats,
    requirements: c.requirements,
    syllabus: c.syllabus,
    forWho: c.forWho,
    visible: c.visible,
    ...patch,
  };
}
