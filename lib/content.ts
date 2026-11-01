// ============================================================
// CONTENIDO — R3-C / R3-D (8.07–8.13)
//
// Capa de datos del contenido editable (artículos, recursos
// gratuitos, servicios, cursos, testimonios, enlaces, menú y
// ajustes de sitio) contra la base de datos local.
//
// - `lib/data.ts` sigue siendo la FUENTE del seed: la primera vez
//   que cada tabla está vacía se siembra desde ahí (idempotente).
//   El borrado es blando (`deleted_at`), así que borrar todo no
//   re-siembra los datos.
// - Los campos escalares viven en columnas (filtros, orden,
//   metadata); el contenido anidado (secciones, FAQ, beneficios,
//   sílabas…) vive en la columna `content` como JSON.
// - Visibilidad pública: artículos/recursos "publicado" o
//   "programado" con fecha vencida; servicios/cursos "visible".
//   Borradores y programados por venir solo se ven con
//   `?preview=1` y sesión de admin/terapeuta (lo aplica la página,
//   no esta capa).
//
// SOLO servidor (usa `lib/db.ts`, que depende de `node:sqlite`).
// No importar desde componentes de cliente.
// ============================================================

import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import {
  articles as seedArticles,
  freeResources as seedFreeResources,
  services as seedServices,
  courses as seedCourses,
  testimonials as seedTestimonials,
  navItems as seedNavItems,
  linkInBio as seedLinkInBio,
  clinic,
  articleCategories,
  resourceCategories,
  serviceCategories,
  courseThemes,
} from "./data";
import type {
  Article,
  ArticleSection,
  Course,
  FreeResource,
  Service,
  Testimonial,
} from "./data";

// ============================================================
// Tipos de fila y de vista
// ============================================================

export type ArticleStatus = "borrador" | "programado" | "publicado";
export type TestimonialStatus = "pendiente" | "aprobado";
export type Modality = "presencial" | "enlinea";

export interface ArticleRow {
  slug: string;
  title: string;
  category: string;
  status: string;
  scheduled_at: number | null;
  author: string;
  date: string;
  excerpt: string;
  content: string; // JSON { tags, video?, sections }
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ArticleView extends Article {
  status: ArticleStatus;
  scheduledAt: number | null;
  updatedAt: number;
}

export interface ResourceRow {
  slug: string;
  title: string;
  category: string;
  minutes: number;
  level: string;
  status: string;
  scheduled_at: number | null;
  description: string;
  content: string; // JSON { benefits, cautions, video?, poster?, relatedService? }
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ResourceView extends FreeResource {
  status: ArticleStatus;
  scheduledAt: number | null;
  updatedAt: number;
}

export interface ServiceRow {
  slug: string;
  name: string;
  category: string;
  duration: number;
  buffer: number;
  position: number;
  visible: number;
  description: string;
  content: string; // JSON { modalities, forWho, whatToExpect, faq, relatedResource? }
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ServiceView extends Service {
  position: number;
  visible: boolean;
  updatedAt: number;
}

export interface CourseRow {
  slug: string;
  title: string;
  theme: string;
  modality: string;
  weeks: number;
  schedule: string;
  position: number;
  visible: number;
  content: string; // JSON { instructor, price, seats, requirements, syllabus, description, forWho }
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface CourseView extends Course {
  position: number;
  visible: boolean;
  updatedAt: number;
}

export interface TestimonialRow {
  id: string;
  name: string;
  context: string;
  text: string;
  status: string;
  consent: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface TestimonialView extends Testimonial {
  id: string;
  status: TestimonialStatus;
  consent: boolean;
  updatedAt: number;
}

export interface LinkItemRow {
  id: string;
  label: string;
  href: string;
  is_primary: number;
  position: number;
  visible: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface LinkItemView {
  id: string;
  label: string;
  href: string;
  isPrimary: boolean;
  position: number;
  visible: boolean;
}

export interface NavItemRow {
  id: string;
  label: string;
  href: string;
  position: number;
  visible: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface NavItemView {
  id: string;
  label: string;
  href: string;
  position: number;
  visible: boolean;
}

export interface ShortLinkRow {
  slug: string;
  target: string;
  label: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ShortLinkView {
  slug: string;
  target: string;
  label: string;
}

export interface SiteSettings {
  instagram: string;
  facebook: string;
  /** Mapa (8.15): "" = placeholder actual (embed con la consulta del
   *  seed), "embed" = Google Maps desde una consulta, "iframe" = URL de
   *  embed de cualquier proveedor, "link" = solo botón "Cómo llegar". */
  mapType: "" | "embed" | "iframe" | "link";
  mapQuery: string;
  mapUrl: string;
}

// ============================================================
// Entradas (validadas en los mutadores)
// ============================================================

export interface ArticleInput {
  slug: string;
  title: string;
  category: string;
  status: ArticleStatus;
  scheduledAt: number | null;
  author: string;
  date: string; // ISO yyyy-mm-dd
  excerpt: string;
  tags: string[];
  video: { type: "youtube"; id: string } | null;
  sections: ArticleSection[];
}

export interface ResourceInput {
  slug: string;
  title: string;
  category: string;
  status: ArticleStatus;
  scheduledAt: number | null;
  minutes: number;
  level: "principiante" | "intermedio" | "avanzado";
  description: string;
  benefits: string[];
  cautions: string[];
  video: { type: "youtube"; id: string } | null;
  poster: string | null;
  relatedService: string | null;
}

export interface ServiceInput {
  slug: string;
  name: string;
  category: string;
  duration: number;
  buffer: number;
  description: string;
  modalities: Modality[];
  forWho: string;
  whatToExpect: string;
  faq: { q: string; a: string }[];
  relatedResource: string | null;
  position?: number;
  visible?: boolean;
}

export interface CourseInput {
  slug: string;
  title: string;
  theme: string;
  modality: "presencial" | "enlinea" | "grabado";
  weeks: number;
  schedule: string;
  description: string;
  instructor: string;
  price: string;
  seats: string;
  requirements: string[];
  syllabus: string[];
  forWho: string;
  position?: number;
  visible?: boolean;
}

export type Ok = { ok: true; slug?: string; id?: string };
export type Err = { ok: false; error: string };
export type SaveResult = Ok | Err;

// ============================================================
// Utilidades
// ============================================================

/** Normaliza un texto a enlace (vive en `lib/utils` para poder usarse
 *  también desde componentes de cliente). */
export { slugify } from "./utils";

/** ¿El artículo/recurso es visible para el público en este momento? */
export function isLiveStatus(status: string, scheduledAt: number | null): boolean {
  if (status === "publicado") return true;
  if (status === "programado") return scheduledAt != null && scheduledAt <= Date.now();
  return false;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,79}$/;
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{6,32}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_SET = ["borrador", "programado", "publicado"];

export function categoryName(
  collection: "articles" | "freeResources" | "services" | "courses",
  key: string,
): string {
  const list =
    collection === "articles"
      ? articleCategories
      : collection === "freeResources"
        ? resourceCategories
        : collection === "services"
          ? serviceCategories
          : courseThemes;
  return list.find((c) => c.key === key)?.label ?? key;
}

function parseContent<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") return { ...fallback, ...parsed } as T;
    return fallback;
  } catch {
    return fallback;
  }
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function validVideo(video: { type: "youtube"; id: string } | null | undefined):
  | { ok: true; video: { type: "youtube"; id: string } | null }
  | { ok: false; error: string } {
  if (!video || !video.id) return { ok: true, video: null };
  if (video.type !== "youtube" || !YOUTUBE_ID_RE.test(video.id)) {
    return { ok: false, error: "El enlace de YouTube no es válido. Usa una URL o ID de YouTube." };
  }
  return { ok: true, video };
}

function validStatus(status: unknown, scheduledAt: number | null):
  | { ok: true; status: ArticleStatus; scheduledAt: number | null }
  | { ok: false; error: string } {
  const s = str(status, "");
  if (!STATUS_SET.includes(s)) {
    return { ok: false, error: "El estado debe ser borrador, programado o publicado." };
  }
  const st = s as ArticleStatus;
  if (st === "programado" && (scheduledAt == null || scheduledAt <= Date.now())) {
    return { ok: false, error: "Una publicación programada necesita una fecha futura." };
  }
  return { ok: true, status: st, scheduledAt: st === "programado" ? scheduledAt : null };
}

function validSlug(slug: unknown): { ok: true; slug: string } | { ok: false; error: string } {
  const s = str(slug, "");
  if (!SLUG_RE.test(s)) {
    return { ok: false, error: "El enlace debe usar letras minúsculas, números y guiones (2 a 80 caracteres)." };
  }
  return { ok: true, slug: s };
}


// ============================================================
// Seed idempotente (solo si la tabla está vacía)
// ============================================================

let seeded = false;

function seedIfEmpty(): void {
  if (seeded) return;
  seeded = true;
  const db = getDb();
  const now = Date.now();

  if (db.prepare("SELECT 1 FROM articles LIMIT 1").get() === undefined) {
    const ins = db.prepare(
      `INSERT INTO articles (slug, title, category, status, scheduled_at, author, date, excerpt, content, created_at, updated_at)
       VALUES (?, ?, ?, 'publicado', NULL, ?, ?, ?, ?, ?, ?)`,
    );
    for (const a of seedArticles) {
      ins.run(
        a.slug,
        a.title,
        a.category,
        a.author,
        a.date,
        a.excerpt,
        JSON.stringify({ tags: a.tags, video: a.video ?? null, sections: a.sections }),
        now,
        now,
      );
    }
  }

  if (db.prepare("SELECT 1 FROM free_resources LIMIT 1").get() === undefined) {
    const ins = db.prepare(
      `INSERT INTO free_resources (slug, title, category, minutes, level, status, scheduled_at, description, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'publicado', NULL, ?, ?, ?, ?)`,
    );
    for (const r of seedFreeResources) {
      ins.run(
        r.slug,
        r.title,
        r.category,
        r.minutes,
        r.level,
        r.description,
        JSON.stringify({
          benefits: r.benefits,
          cautions: r.cautions,
          video: r.video ?? null,
          poster: r.poster ?? null,
          relatedService: r.relatedService ?? null,
        }),
        now,
        now,
      );
    }
  }

  if (db.prepare("SELECT 1 FROM services LIMIT 1").get() === undefined) {
    const ins = db.prepare(
      `INSERT INTO services (slug, name, category, duration, buffer, position, visible, description, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
    );
    seedServices.forEach((s, i) => {
      ins.run(
        s.slug,
        s.name,
        s.category,
        s.duration,
        s.buffer,
        i,
        s.description,
        JSON.stringify({
          modalities: s.modalities,
          forWho: s.forWho,
          whatToExpect: s.whatToExpect,
          faq: s.faq,
          relatedResource: s.relatedResource ?? null,
        }),
        now,
        now,
      );
    });
  }

  if (db.prepare("SELECT 1 FROM courses LIMIT 1").get() === undefined) {
    const ins = db.prepare(
      `INSERT INTO courses (slug, title, theme, modality, weeks, schedule, position, visible, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    );
    seedCourses.forEach((c, i) => {
      ins.run(
        c.slug,
        c.title,
        c.theme,
        c.modality,
        c.weeks,
        c.schedule,
        i,
        JSON.stringify({
          instructor: c.instructor,
          price: c.price,
          seats: c.seats,
          requirements: c.requirements,
          syllabus: c.syllabus,
          description: c.description,
          forWho: c.forWho,
        }),
        now,
        now,
      );
    });
  }

  if (db.prepare("SELECT 1 FROM testimonials LIMIT 1").get() === undefined) {
    const ins = db.prepare(
      `INSERT INTO testimonials (id, name, context, text, status, consent, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pendiente', 0, ?, ?)`,
    );
    for (const t of seedTestimonials) {
      ins.run(randomUUID(), t.name, t.context, t.text, now, now);
    }
  }

  if (db.prepare("SELECT 1 FROM nav_items LIMIT 1").get() === undefined) {
    const ins = db.prepare(
      `INSERT INTO nav_items (id, label, href, position, visible, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
    );
    seedNavItems.forEach((n, i) => {
      ins.run(randomUUID(), n.label, n.href, i, now, now);
    });
  }

  if (db.prepare("SELECT 1 FROM link_items LIMIT 1").get() === undefined) {
    const ins = db.prepare(
      `INSERT INTO link_items (id, label, href, is_primary, position, visible, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    );
    seedLinkInBio.forEach((l, i) => {
      ins.run(randomUUID(), l.label, l.href, l.primary ? 1 : 0, i, now, now);
    });
  }

  if (db.prepare("SELECT 1 FROM short_links LIMIT 1").get() === undefined) {
    const ins = db.prepare(
      `INSERT INTO short_links (slug, target, label, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    );
    const demoLinks: Array<[string, string, string]> = [
      ["raizviva", "/", "Raíz Viva"],
      ["agendar", "/agendar", "Agendar una cita"],
      ["gratis", "/gratis", "Contenido gratis"],
      ["servicios", "/servicios", "Servicios"],
      ["cursos", "/cursos", "Cursos y talleres"],
    ];
    for (const [slug, target, label] of demoLinks) {
      ins.run(slug, target, label, now, now);
    }
  }

  if (db.prepare("SELECT 1 FROM site_settings LIMIT 1").get() === undefined) {
    db.prepare(
      `INSERT INTO site_settings (id, instagram, facebook, updated_at) VALUES ('current', ?, ?, ?)`,
    ).run(clinic.social.instagram, clinic.social.facebook, now);
  }
}


// ============================================================
// Lectores
// ============================================================

function rowToArticle(r: ArticleRow): ArticleView {
  const c = parseContent<{
    tags: unknown;
    video: { type: "youtube"; id: string } | null;
    sections: unknown[];
  }>(r.content, { tags: [], video: null, sections: [] });
  return {
    slug: r.slug,
    title: r.title,
    category: r.category,
    tags: strArr(c.tags),
    author: r.author,
    date: r.date,
    video: c.video && typeof c.video.id === "string" ? { type: "youtube", id: c.video.id } : undefined,
    excerpt: r.excerpt,
    sections: Array.isArray(c.sections)
      ? (c.sections as unknown[]).map((s) => ({
          heading: str((s as { heading?: unknown }).heading),
          paragraphs: strArr((s as { paragraphs?: unknown }).paragraphs),
        }))
      : [],
    status: r.status as ArticleStatus,
    scheduledAt: r.scheduled_at,
    updatedAt: r.updated_at,
  };
}

function rowToResource(r: ResourceRow): ResourceView {
  const c = parseContent<{
    benefits: unknown;
    cautions: unknown;
    video: { type: "youtube"; id: string } | null;
    poster: unknown;
    relatedService: unknown;
  }>(r.content, {
    benefits: [],
    cautions: [],
    video: null,
    poster: null,
    relatedService: null,
  });
  return {
    slug: r.slug,
    title: r.title,
    category: r.category,
    minutes: r.minutes,
    level: r.level as FreeResource["level"],
    description: r.description,
    benefits: strArr(c.benefits),
    cautions: strArr(c.cautions),
    video: c.video && typeof c.video.id === "string" ? { type: "youtube", id: c.video.id } : undefined,
    poster: str(c.poster),
    relatedService: str(c.relatedService),
    status: r.status as ArticleStatus,
    scheduledAt: r.scheduled_at,
    updatedAt: r.updated_at,
  };
}

function rowToService(r: ServiceRow): ServiceView {
  const c = parseContent(r.content, {
    modalities: [],
    forWho: "",
    whatToExpect: "",
    faq: [],
    relatedResource: null,
  });
  return {
    slug: r.slug,
    name: r.name,
    category: r.category,
    duration: r.duration,
    buffer: r.buffer,
    description: r.description,
    modalities: (strArr(c.modalities).filter((m) => m === "presencial" || m === "enlinea") as Modality[]) || [],
    forWho: str(c.forWho),
    whatToExpect: str(c.whatToExpect),
    faq: Array.isArray(c.faq)
      ? (c.faq as unknown[]).map((f) => ({ q: str((f as { q?: unknown }).q), a: str((f as { a?: unknown }).a) }))
      : [],
    relatedResource: str(c.relatedResource),
    position: r.position,
    visible: r.visible === 1,
    updatedAt: r.updated_at,
  };
}

function rowToCourse(r: CourseRow): CourseView {
  const c = parseContent(r.content, {
    instructor: "",
    price: "",
    seats: "",
    requirements: [],
    syllabus: [],
    description: "",
    forWho: "",
  });
  return {
    slug: r.slug,
    title: r.title,
    theme: r.theme,
    modality: r.modality as Course["modality"],
    weeks: r.weeks,
    schedule: r.schedule,
    description: str(c.description),
    forWho: str(c.forWho),
    instructor: str(c.instructor),
    price: str(c.price),
    seats: str(c.seats),
    requirements: strArr(c.requirements),
    syllabus: strArr(c.syllabus),
    position: r.position,
    visible: r.visible === 1,
    updatedAt: r.updated_at,
  };
}

function rowToTestimonial(r: TestimonialRow): TestimonialView {
  return {
    id: r.id,
    name: r.name,
    context: r.context,
    text: r.text,
    status: r.status as TestimonialStatus,
    consent: r.consent === 1,
    updatedAt: r.updated_at,
  };
}

function rowToLinkItem(r: LinkItemRow): LinkItemView {
  return {
    id: r.id,
    label: r.label,
    href: r.href,
    isPrimary: r.is_primary === 1,
    position: r.position,
    visible: r.visible === 1,
  };
}

function rowToNavItem(r: NavItemRow): NavItemView {
  return {
    id: r.id,
    label: r.label,
    href: r.href,
    position: r.position,
    visible: r.visible === 1,
  };
}

function rowToShortLink(r: ShortLinkRow): ShortLinkView {
  return { slug: r.slug, target: r.target, label: r.label };
}

const LIVE_FILTER = `(status = 'publicado' OR (status = 'programado' AND scheduled_at IS NOT NULL AND scheduled_at <= ?))`;

/** Artículos visibles (publicados o programados con fecha vencida). */
export function getArticles(): ArticleView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM articles WHERE deleted_at IS NULL AND ${LIVE_FILTER} ORDER BY date DESC`)
    .all(Date.now()) as unknown as ArticleRow[];
  return rows.map(rowToArticle);
}

/** Artículos de cualquier estado (admin), sin borrados. */
export function getArticlesAll(): ArticleView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM articles WHERE deleted_at IS NULL ORDER BY updated_at DESC`)
    .all() as unknown as ArticleRow[];
  return rows.map(rowToArticle);
}

/** Un artículo visible; con `anyStatus` lo trae en borrador/programado (preview). */
export function getArticle(slug: string, anyStatus = false): ArticleView | null {
  seedIfEmpty();
  const stmt = getDb().prepare(
    anyStatus
      ? `SELECT * FROM articles WHERE slug = ? AND deleted_at IS NULL`
      : `SELECT * FROM articles WHERE slug = ? AND deleted_at IS NULL AND ${LIVE_FILTER}`,
  );
  const rows = (anyStatus ? stmt.all(slug) : stmt.all(slug, Date.now())) as unknown as ArticleRow[];
  return rows[0] ? rowToArticle(rows[0]) : null;
}

/** Recursos gratuitos visibles. */
export function getFreeResources(): ResourceView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM free_resources WHERE deleted_at IS NULL AND ${LIVE_FILTER} ORDER BY rowid`)
    .all(Date.now()) as unknown as ResourceRow[];
  return rows.map(rowToResource);
}

/** Recursos de cualquier estado (admin). */
export function getFreeResourcesAll(): ResourceView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM free_resources WHERE deleted_at IS NULL ORDER BY rowid`)
    .all() as unknown as ResourceRow[];
  return rows.map(rowToResource);
}

export function getFreeResource(slug: string, anyStatus = false): ResourceView | null {
  seedIfEmpty();
  const stmt = getDb().prepare(
    anyStatus
      ? `SELECT * FROM free_resources WHERE slug = ? AND deleted_at IS NULL`
      : `SELECT * FROM free_resources WHERE slug = ? AND deleted_at IS NULL AND ${LIVE_FILTER}`,
  );
  const rows = (anyStatus ? stmt.all(slug) : stmt.all(slug, Date.now())) as unknown as ResourceRow[];
  return rows[0] ? rowToResource(rows[0]) : null;
}

/** Servicios visibles, en el orden definido por el admin (`position`). */
export function getServices(): ServiceView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM services WHERE deleted_at IS NULL AND visible = 1 ORDER BY position ASC, rowid`)
    .all() as unknown as ServiceRow[];
  return rows.map(rowToService);
}

/** Servicios de cualquier estado (admin). */
export function getServicesAll(): ServiceView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM services WHERE deleted_at IS NULL ORDER BY position ASC, rowid`)
    .all() as unknown as ServiceRow[];
  return rows.map(rowToService);
}

export function getService(slug: string): ServiceView | null {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM services WHERE slug = ? AND deleted_at IS NULL`)
    .all(slug) as unknown as ServiceRow[];
  return rows[0] ? rowToService(rows[0]) : null;
}

/** Cursos visibles, en el orden definido por el admin (`position`). */
export function getCourses(): CourseView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM courses WHERE deleted_at IS NULL AND visible = 1 ORDER BY position ASC, rowid`)
    .all() as unknown as CourseRow[];
  return rows.map(rowToCourse);
}

/** Cursos de cualquier estado (admin). */
export function getCoursesAll(): CourseView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM courses WHERE deleted_at IS NULL ORDER BY position ASC, rowid`)
    .all() as unknown as CourseRow[];
  return rows.map(rowToCourse);
}

export function getCourse(slug: string): CourseView | null {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM courses WHERE slug = ? AND deleted_at IS NULL`)
    .all(slug) as unknown as CourseRow[];
  return rows[0] ? rowToCourse(rows[0]) : null;
}

/** Testimonios aprobados con consentimiento: los que se muestran al público (8.10). */
export function getPublicTestimonials(): TestimonialView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM testimonials WHERE deleted_at IS NULL AND status = 'aprobado' AND consent = 1 ORDER BY updated_at DESC`)
    .all() as unknown as TestimonialRow[];
  return rows.map(rowToTestimonial);
}

/** Todos los testimonios (admin). */
export function getTestimonials(): TestimonialView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM testimonials WHERE deleted_at IS NULL ORDER BY updated_at DESC`)
    .all() as unknown as TestimonialRow[];
  return rows.map(rowToTestimonial);
}

/** Enlaces de la página /links (7.02), visibles y en orden. */
export function getLinkItems(includeHidden = false): LinkItemView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(
      includeHidden
        ? `SELECT * FROM link_items WHERE deleted_at IS NULL ORDER BY position ASC, rowid`
        : `SELECT * FROM link_items WHERE deleted_at IS NULL AND visible = 1 ORDER BY position ASC, rowid`,
    )
    .all() as unknown as LinkItemRow[];
  return rows.map(rowToLinkItem);
}

/** Menú de navegación, visible y en orden (8.11). */
export function getNavItems(includeHidden = false): NavItemView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(
      includeHidden
        ? `SELECT * FROM nav_items WHERE deleted_at IS NULL ORDER BY position ASC, rowid`
        : `SELECT * FROM nav_items WHERE deleted_at IS NULL AND visible = 1 ORDER BY position ASC, rowid`,
    )
    .all() as unknown as NavItemRow[];
  return rows.map(rowToNavItem);
}

/** Enlaces cortos: slug -> destino (7.01). */
export function getShortLink(slug: string): ShortLinkView | null {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM short_links WHERE slug = ? AND deleted_at IS NULL`)
    .all(slug) as unknown as ShortLinkRow[];
  return rows[0] ? rowToShortLink(rows[0]) : null;
}

export function getShortLinks(): ShortLinkView[] {
  seedIfEmpty();
  const rows = getDb()
    .prepare(`SELECT * FROM short_links WHERE deleted_at IS NULL ORDER BY rowid`)
    .all() as unknown as ShortLinkRow[];
  return rows.map(rowToShortLink);
}

/** Ajustes de sitio (redes sociales, 8.11). */
export function getSiteSettings(): SiteSettings {
  seedIfEmpty();
  const row = getDb()
    .prepare(`SELECT * FROM site_settings WHERE id = 'current'`)
    .get() as
    | { instagram: string; facebook: string; map_type?: string; map_query?: string; map_url?: string }
    | undefined;
  const mapType = (row?.map_type ?? "") as SiteSettings["mapType"];
  return {
    instagram: row?.instagram ?? "",
    facebook: row?.facebook ?? "",
    mapType: ["", "embed", "iframe", "link"].includes(mapType) ? mapType : "",
    mapQuery: row?.map_query ?? "",
    mapUrl: row?.map_url ?? "",
  };
}


// ============================================================
// Mutadores — escrituras con validación (devuelven SaveResult)
// ============================================================

const SLUG_TABLES = ["articles", "free_resources", "services", "courses", "short_links"] as const;
export type SlugTable = (typeof SLUG_TABLES)[number];

const ID_TABLES = ["testimonials", "link_items", "nav_items"] as const;
export type IdTable = (typeof ID_TABLES)[number];

function categoryKeys(list: { key: string }[]): string[] {
  return list.map((c) => c.key);
}

function nextPosition(table: SlugTable): number {
  const row = getDb()
    .prepare(`SELECT COALESCE(MAX(position), -1) AS m FROM ${table} WHERE deleted_at IS NULL`)
    .get() as { m: number };
  return row.m + 1;
}

function positionOrDefault(table: SlugTable, pos: number | undefined): number {
  if (pos != null && Number.isFinite(pos)) return Math.max(0, Math.floor(pos));
  return nextPosition(table);
}

/**
 * Borrado blando por slug (8.13): la fila conserva `deleted_at`
 * (evita re-sembrar) y puede restaurarse. No toca archivos.
 */
export function softDeleteBySlug(table: SlugTable, slug: string): SaveResult {
  seedIfEmpty();
  const s = validSlug(slug);
  if (!s.ok) return s;
  const res = getDb()
    .prepare(`UPDATE ${table} SET deleted_at = ? WHERE slug = ? AND deleted_at IS NULL`)
    .run(Date.now(), s.slug);
  if (res.changes === 0) {
    return { ok: false, error: "No existe ese registro (o ya está eliminado)." };
  }
  return { ok: true, slug: s.slug };
}

/** Restaura un registro borrado blandamente por slug. */
export function restoreBySlug(table: SlugTable, slug: string): SaveResult {
  seedIfEmpty();
  const s = validSlug(slug);
  if (!s.ok) return s;
  const res = getDb()
    .prepare(`UPDATE ${table} SET deleted_at = NULL, updated_at = ? WHERE slug = ?`)
    .run(Date.now(), s.slug);
  if (res.changes === 0) {
    return { ok: false, error: "No hay ningún registro eliminado con ese enlace." };
  }
  return { ok: true, slug: s.slug };
}

/** Crea o actualiza un artículo (el slug es inmutable tras crear). */
export function saveArticle(input: ArticleInput): SaveResult {
  seedIfEmpty();
  const db = getDb();
  const slug = validSlug(input.slug);
  if (!slug.ok) return slug;
  const s = slug.slug;

  const title = str(input.title).trim();
  if (!title) return { ok: false, error: "El título es obligatorio." };
  const category = str(input.category).trim();
  if (!categoryKeys(articleCategories).includes(category)) {
    return { ok: false, error: "La categoría no es válida." };
  }
  const author = str(input.author).trim();
  if (!author) return { ok: false, error: "El autor es obligatorio." };
  const date = str(input.date).trim();
  if (!DATE_RE.test(date)) {
    return { ok: false, error: "La fecha debe tener formato AAAA-MM-DD." };
  }
  const excerpt = str(input.excerpt).trim();
  if (!excerpt) return { ok: false, error: "El extracto es obligatorio." };
  const videoRes = validVideo(input.video);
  if (!videoRes.ok) return videoRes;
  const statusRes = validStatus(input.status, input.scheduledAt);
  if (!statusRes.ok) return statusRes;

  const sections = (Array.isArray(input.sections) ? input.sections : []).map((sec) => ({
    heading: str(sec.heading),
    paragraphs: strArr(sec.paragraphs),
  }));
  const content = JSON.stringify({ tags: strArr(input.tags), video: videoRes.video, sections });
  const now = Date.now();

  const exists = db.prepare(`SELECT 1 FROM articles WHERE slug = ? AND deleted_at IS NULL`).all(s) as unknown[];
  if (exists.length > 0) {
    db.prepare(
      `UPDATE articles SET title = ?, category = ?, status = ?, scheduled_at = ?, author = ?, date = ?, excerpt = ?, content = ?, updated_at = ? WHERE slug = ? AND deleted_at IS NULL`,
    ).run(title, category, statusRes.status, statusRes.scheduledAt, author, date, excerpt, content, now, s);
    return { ok: true, slug: s };
  }
  db.prepare(
    `INSERT INTO articles (slug, title, category, status, scheduled_at, author, date, excerpt, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(s, title, category, statusRes.status, statusRes.scheduledAt, author, date, excerpt, content, now, now);
  return { ok: true, slug: s };
}

/** Cambia solo el estado (y la fecha programada) de un artículo. */
export function setArticleStatus(slug: string, status: ArticleStatus, scheduledAt: number | null): SaveResult {
  seedIfEmpty();
  const s = validSlug(slug);
  if (!s.ok) return s;
  const st = validStatus(status, scheduledAt);
  if (!st.ok) return st;
  const res = getDb()
    .prepare(`UPDATE articles SET status = ?, scheduled_at = ?, updated_at = ? WHERE slug = ? AND deleted_at IS NULL`)
    .run(st.status, st.scheduledAt, Date.now(), s.slug);
  if (res.changes === 0) {
    return { ok: false, error: "No existe ese artículo (o está eliminado)." };
  }
  return { ok: true, slug: s.slug };
}

/** Crea o actualiza un recurso gratuito (el slug es inmutable tras crear). */
export function saveResource(input: ResourceInput): SaveResult {
  seedIfEmpty();
  const db = getDb();
  const slug = validSlug(input.slug);
  if (!slug.ok) return slug;
  const s = slug.slug;

  const title = str(input.title).trim();
  if (!title) return { ok: false, error: "El título es obligatorio." };
  const category = str(input.category).trim();
  if (!categoryKeys(resourceCategories).includes(category)) {
    return { ok: false, error: "La categoría no es válida." };
  }
  const minutes = Math.floor(Number(input.minutes));
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
    return { ok: false, error: "La duración debe ser entre 1 y 240 minutos." };
  }
  const level = str(input.level);
  if (!["principiante", "intermedio", "avanzado"].includes(level)) {
    return { ok: false, error: "El nivel debe ser principiante, intermedio o avanzado." };
  }
  const description = str(input.description).trim();
  if (!description) return { ok: false, error: "La descripción es obligatoria." };
  const videoRes = validVideo(input.video);
  if (!videoRes.ok) return videoRes;
  const statusRes = validStatus(input.status, input.scheduledAt);
  if (!statusRes.ok) return statusRes;

  const content = JSON.stringify({
    benefits: strArr(input.benefits),
    cautions: strArr(input.cautions),
    video: videoRes.video,
    poster: str(input.poster) || null,
    relatedService: str(input.relatedService) || null,
  });
  const now = Date.now();

  const exists = db.prepare(`SELECT 1 FROM free_resources WHERE slug = ? AND deleted_at IS NULL`).all(s) as unknown[];
  if (exists.length > 0) {
    db.prepare(
      `UPDATE free_resources SET title = ?, category = ?, minutes = ?, level = ?, status = ?, scheduled_at = ?, description = ?, content = ?, updated_at = ? WHERE slug = ? AND deleted_at IS NULL`,
    ).run(title, category, minutes, level, statusRes.status, statusRes.scheduledAt, description, content, now, s);
    return { ok: true, slug: s };
  }
  db.prepare(
    `INSERT INTO free_resources (slug, title, category, minutes, level, status, scheduled_at, description, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(s, title, category, minutes, level, statusRes.status, statusRes.scheduledAt, description, content, now, now);
  return { ok: true, slug: s };
}

/** Cambia solo el estado (y la fecha programada) de un recurso. */
export function setResourceStatus(slug: string, status: ArticleStatus, scheduledAt: number | null): SaveResult {
  seedIfEmpty();
  const s = validSlug(slug);
  if (!s.ok) return s;
  const st = validStatus(status, scheduledAt);
  if (!st.ok) return st;
  const res = getDb()
    .prepare(`UPDATE free_resources SET status = ?, scheduled_at = ?, updated_at = ? WHERE slug = ? AND deleted_at IS NULL`)
    .run(st.status, st.scheduledAt, Date.now(), s.slug);
  if (res.changes === 0) {
    return { ok: false, error: "No existe ese recurso (o está eliminado)." };
  }
  return { ok: true, slug: s.slug };
}

/** Crea o actualiza un servicio (el slug es inmutable tras crear). */
export function saveService(input: ServiceInput): SaveResult {
  seedIfEmpty();
  const db = getDb();
  const slug = validSlug(input.slug);
  if (!slug.ok) return slug;
  const s = slug.slug;

  const name = str(input.name).trim();
  if (!name) return { ok: false, error: "El nombre es obligatorio." };
  const category = str(input.category).trim();
  if (!categoryKeys(serviceCategories).includes(category)) {
    return { ok: false, error: "La categoría no es válida." };
  }
  const duration = Math.floor(Number(input.duration));
  if (!Number.isFinite(duration) || duration < 1 || duration > 480) {
    return { ok: false, error: "La duración debe ser entre 1 y 480 minutos." };
  }
  const buffer = Math.floor(Number(input.buffer));
  if (!Number.isFinite(buffer) || buffer < 0 || buffer > 60) {
    return { ok: false, error: "El buffer debe ser entre 0 y 60 minutos." };
  }
  const description = str(input.description).trim();
  if (!description) return { ok: false, error: "La descripción es obligatoria." };
  const modalities = strArr(input.modalities).filter((m): m is Modality => m === "presencial" || m === "enlinea");
  if (modalities.length === 0) {
    return { ok: false, error: "Debe tener al menos una modalidad (presencial o en línea)." };
  }
  const faq = (Array.isArray(input.faq) ? input.faq : [])
    .map((f) => ({ q: str(f.q), a: str(f.a) }))
    .filter((f) => f.q !== "");
  const relatedResource = str(input.relatedResource) || null;
  const content = JSON.stringify({
    modalities,
    forWho: str(input.forWho),
    whatToExpect: str(input.whatToExpect),
    faq,
    relatedResource,
  });
  const now = Date.now();
  const visible = input.visible === false ? 0 : 1;

  const exists = db.prepare(`SELECT 1 FROM services WHERE slug = ? AND deleted_at IS NULL`).all(s) as unknown[];
  if (exists.length > 0) {
    db.prepare(
      `UPDATE services SET name = ?, category = ?, duration = ?, buffer = ?, visible = ?, description = ?, content = ?, updated_at = ? WHERE slug = ? AND deleted_at IS NULL`,
    ).run(name, category, duration, buffer, visible, description, content, now, s);
    return { ok: true, slug: s };
  }
  const position = positionOrDefault("services", input.position);
  db.prepare(
    `INSERT INTO services (slug, name, category, duration, buffer, position, visible, description, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(s, name, category, duration, buffer, position, visible, description, content, now, now);
  return { ok: true, slug: s };
}

/** Crea o actualiza un curso (el slug es inmutable tras crear). */
export function saveCourse(input: CourseInput): SaveResult {
  seedIfEmpty();
  const db = getDb();
  const slug = validSlug(input.slug);
  if (!slug.ok) return slug;
  const s = slug.slug;

  const title = str(input.title).trim();
  if (!title) return { ok: false, error: "El título es obligatorio." };
  const theme = str(input.theme).trim();
  if (!categoryKeys(courseThemes).includes(theme)) {
    return { ok: false, error: "La temática no es válida." };
  }
  const modality = str(input.modality);
  if (!["presencial", "enlinea", "grabado"].includes(modality)) {
    return { ok: false, error: "La modalidad debe ser presencial, en línea o grabado." };
  }
  const weeks = Math.floor(Number(input.weeks));
  if (!Number.isFinite(weeks) || weeks < 1 || weeks > 52) {
    return { ok: false, error: "La duración debe ser entre 1 y 52 semanas." };
  }
  const schedule = str(input.schedule).trim();
  if (!schedule) return { ok: false, error: "El horario es obligatorio." };
  const description = str(input.description).trim();
  if (!description) return { ok: false, error: "La descripción es obligatoria." };
  const content = JSON.stringify({
    instructor: str(input.instructor),
    price: str(input.price),
    seats: str(input.seats),
    requirements: strArr(input.requirements),
    syllabus: strArr(input.syllabus),
    description,
    forWho: str(input.forWho),
  });
  const now = Date.now();
  const visible = input.visible === false ? 0 : 1;

  const exists = db.prepare(`SELECT 1 FROM courses WHERE slug = ? AND deleted_at IS NULL`).all(s) as unknown[];
  if (exists.length > 0) {
    db.prepare(
      `UPDATE courses SET title = ?, theme = ?, modality = ?, weeks = ?, schedule = ?, visible = ?, content = ?, updated_at = ? WHERE slug = ? AND deleted_at IS NULL`,
    ).run(title, theme, modality, weeks, schedule, visible, content, now, s);
    return { ok: true, slug: s };
  }
  const position = positionOrDefault("courses", input.position);
  db.prepare(
    `INSERT INTO courses (slug, title, theme, modality, weeks, schedule, position, visible, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(s, title, theme, modality, weeks, schedule, position, visible, content, now, now);
  return { ok: true, slug: s };
}

// ------------------------------------------------------------
// Reordenar (8.08): la lista de slugs debe coincidir con los
// existentes; se renumera `position` en transacción.
// ------------------------------------------------------------

function reorder(table: SlugTable, slugs: string[]): SaveResult {
  seedIfEmpty();
  const db = getDb();
  const current = (db
    .prepare(`SELECT slug FROM ${table} WHERE deleted_at IS NULL`)
    .all() as Array<{ slug: string }>).map((r) => r.slug);
  const incoming = slugs.filter((s) => SLUG_RE.test(s));
  if (incoming.length !== current.length || current.some((c) => !incoming.includes(c))) {
    return { ok: false, error: "El orden no coincide con los elementos existentes." };
  }
  try {
    db.exec("BEGIN");
    const upd = db.prepare(`UPDATE ${table} SET position = ?, updated_at = ? WHERE slug = ?`);
    incoming.forEach((slug, i) => upd.run(i, Date.now(), slug));
    db.exec("COMMIT");
    return { ok: true };
  } catch {
    db.exec("ROLLBACK");
    return { ok: false, error: "No se pudo reordenar. Inténtalo de nuevo." };
  }
}

/** Reordena servicios en el orden de la lista de slugs. */
export function reorderServices(slugs: string[]): SaveResult {
  return reorder("services", slugs);
}

/** Reordena cursos en el orden de la lista de slugs. */
export function reorderCourses(slugs: string[]): SaveResult {
  return reorder("courses", slugs);
}

// ------------------------------------------------------------
// Testimonios (8.10): cola de aprobación + consentimiento
// ------------------------------------------------------------

export interface TestimonialInput {
  id?: string;
  name: string;
  context: string;
  text: string;
  consent: boolean;
}

/** Crea (estado "pendiente") o actualiza un testimonio. */
export function saveTestimonial(input: TestimonialInput): SaveResult {
  seedIfEmpty();
  const db = getDb();
  const name = str(input.name).trim();
  if (!name) return { ok: false, error: "El nombre es obligatorio." };
  const context = str(input.context).trim();
  const text = str(input.text).trim();
  if (!text) return { ok: false, error: "El texto del testimonio es obligatorio." };
  const consent = input.consent ? 1 : 0;
  const now = Date.now();

  if (input.id) {
    const res = db
      .prepare(`UPDATE testimonials SET name = ?, context = ?, text = ?, consent = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
      .run(name, context, text, consent, now, input.id);
    if (res.changes === 0) {
      return { ok: false, error: "No existe ese testimonio (o está eliminado)." };
    }
    return { ok: true, id: input.id };
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO testimonials (id, name, context, text, status, consent, created_at, updated_at) VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?)`,
  ).run(id, name, context, text, consent, now, now);
  return { ok: true, id };
}

/** Aprueba un testimonio: exige consentimiento registrado (8.10). */
export function approveTestimonial(id: string): SaveResult {
  seedIfEmpty();
  const row = getDb().prepare(`SELECT * FROM testimonials WHERE id = ? AND deleted_at IS NULL`).get(id) as
    | TestimonialRow
    | undefined;
  if (!row) return { ok: false, error: "No existe ese testimonio (o está eliminado)." };
  if (row.consent !== 1) {
    return { ok: false, error: "No se puede aprobar sin consentimiento registrado." };
  }
  getDb().prepare(`UPDATE testimonials SET status = 'aprobado', updated_at = ? WHERE id = ?`).run(Date.now(), id);
  return { ok: true, id };
}

// ------------------------------------------------------------
// Borrado blando / restauración por id (testimonios, enlaces, menú)
// ------------------------------------------------------------

export function softDeleteById(table: IdTable, id: string): SaveResult {
  seedIfEmpty();
  const res = getDb()
    .prepare(`UPDATE ${table} SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
    .run(Date.now(), Date.now(), id);
  if (res.changes === 0) {
    return { ok: false, error: "No existe ese elemento (o ya está eliminado)." };
  }
  return { ok: true, id };
}

export function restoreById(table: IdTable, id: string): SaveResult {
  seedIfEmpty();
  const res = getDb()
    .prepare(`UPDATE ${table} SET deleted_at = NULL, updated_at = ? WHERE id = ?`)
    .run(Date.now(), id);
  if (res.changes === 0) {
    return { ok: false, error: "No hay ningún elemento eliminado con ese identificador." };
  }
  return { ok: true, id };
}

// ------------------------------------------------------------
// Enlaces de /links y menú (7.02 / 8.11)
// ------------------------------------------------------------

function validHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("http://") || href.startsWith("https://");
}

export interface LinkItemInput {
  id?: string;
  label: string;
  href: string;
  isPrimary: boolean;
  visible: boolean;
  position?: number;
}

export interface NavItemInput {
  id?: string;
  label: string;
  href: string;
  visible: boolean;
  position?: number;
}

function nextPositionId(table: IdTable): number {
  const row = getDb()
    .prepare(`SELECT COALESCE(MAX(position), -1) AS m FROM ${table} WHERE deleted_at IS NULL`)
    .get() as { m: number };
  return row.m + 1;
}

/** Crea o actualiza un enlace de la página /links. */
export function saveLinkItem(input: LinkItemInput): SaveResult {
  seedIfEmpty();
  const db = getDb();
  const label = str(input.label).trim();
  if (!label) return { ok: false, error: "La etiqueta es obligatoria." };
  const href = str(input.href).trim();
  if (!validHref(href)) {
    return { ok: false, error: "El enlace debe ser interno (empieza con /) o una URL http(s)." };
  }
  const isPrimary = input.isPrimary ? 1 : 0;
  const visible = input.visible ? 1 : 0;
  const now = Date.now();

  if (input.id) {
    const res = db
      .prepare(`UPDATE link_items SET label = ?, href = ?, is_primary = ?, visible = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
      .run(label, href, isPrimary, visible, now, input.id);
    if (res.changes === 0) {
      return { ok: false, error: "No existe ese enlace (o está eliminado)." };
    }
    return { ok: true, id: input.id };
  }
  const position = input.position != null && Number.isFinite(input.position)
    ? Math.max(0, Math.floor(input.position))
    : nextPositionId("link_items");
  const id = randomUUID();
  db.prepare(
    `INSERT INTO link_items (id, label, href, is_primary, position, visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, label, href, isPrimary, position, visible, now, now);
  return { ok: true, id };
}

/** Crea o actualiza un elemento del menú. */
export function saveNavItem(input: NavItemInput): SaveResult {
  seedIfEmpty();
  const db = getDb();
  const label = str(input.label).trim();
  if (!label) return { ok: false, error: "La etiqueta es obligatoria." };
  const href = str(input.href).trim();
  if (!validHref(href)) {
    return { ok: false, error: "El enlace debe ser interno (empieza con /) o una URL http(s)." };
  }
  const visible = input.visible ? 1 : 0;
  const now = Date.now();

  if (input.id) {
    const res = db
      .prepare(`UPDATE nav_items SET label = ?, href = ?, visible = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
      .run(label, href, visible, now, input.id);
    if (res.changes === 0) {
      return { ok: false, error: "No existe ese elemento (o está eliminado)." };
    }
    return { ok: true, id: input.id };
  }
  const position = input.position != null && Number.isFinite(input.position)
    ? Math.max(0, Math.floor(input.position))
    : nextPositionId("nav_items");
  const id = randomUUID();
  db.prepare(
    `INSERT INTO nav_items (id, label, href, position, visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, label, href, position, visible, now, now);
  return { ok: true, id };
}

/** Intercambia la posición de un elemento con su vecino (arriba/abajo). */
export function moveItem(table: IdTable, id: string, dir: -1 | 1): SaveResult {
  seedIfEmpty();
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM ${table} WHERE deleted_at IS NULL ORDER BY position ASC, rowid`)
    .all() as unknown as Array<{ id: string; position: number }>;
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return { ok: false, error: "No existe ese elemento (o está eliminado)." };
  const target = idx + dir;
  if (target < 0 || target >= rows.length) {
    return { ok: false, error: "No hay ningún elemento más en esa dirección." };
  }
  try {
    db.exec("BEGIN");
    const upd = db.prepare(`UPDATE ${table} SET position = ?, updated_at = ? WHERE id = ?`);
    upd.run(rows[target].position, Date.now(), rows[idx].id);
    upd.run(rows[idx].position, Date.now(), rows[target].id);
    db.exec("COMMIT");
    return { ok: true, id };
  } catch {
    db.exec("ROLLBACK");
    return { ok: false, error: "No se pudo mover el elemento." };
  }
}

// ------------------------------------------------------------
// Enlaces cortos (7.01): /c/<slug> -> destino
// ------------------------------------------------------------

/** Crea o actualiza un enlace corto. El slug no cambia al editar. */
export function saveShortLink(slug: string, target: string, label: string): SaveResult {
  seedIfEmpty();
  const s = validSlug(slug);
  if (!s.ok) return s;
  const href = str(target).trim();
  if (!validHref(href)) {
    return { ok: false, error: "El destino debe ser interno (empieza con /) o una URL http(s)." };
  }
  const now = Date.now();
  const exists = getDb()
    .prepare(`SELECT 1 FROM short_links WHERE slug = ? AND deleted_at IS NULL`)
    .all(s.slug) as unknown[];
  if (exists.length > 0) {
    getDb()
      .prepare(`UPDATE short_links SET target = ?, label = ?, updated_at = ? WHERE slug = ? AND deleted_at IS NULL`)
      .run(href, str(label), now, s.slug);
    return { ok: true, slug: s.slug };
  }
  getDb()
    .prepare(`INSERT INTO short_links (slug, target, label, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
    .run(s.slug, href, str(label), now, now);
  return { ok: true, slug: s.slug };
}

/** Elimina un enlace corto (blando, 8.13). */
export function deleteShortLink(slug: string): SaveResult {
  return softDeleteBySlug("short_links", slug);
}

/** Restaura un enlace corto eliminado (8.13). */
export function restoreShortLink(slug: string): SaveResult {
  return restoreBySlug("short_links", slug);
}

// ------------------------------------------------------------
// Ajustes de sitio: redes sociales (8.11)
// ------------------------------------------------------------

/** Actualiza el único registro de `site_settings` (id = 'current'). */
export function saveSocials(input: { instagram: string; facebook: string }): SaveResult {
  seedIfEmpty();
  const res = getDb()
    .prepare(`UPDATE site_settings SET instagram = ?, facebook = ?, updated_at = ? WHERE id = 'current'`)
    .run(str(input.instagram).trim(), str(input.facebook).trim(), Date.now());
  if (res.changes === 0) {
    return { ok: false, error: "No se encontraron los ajustes del sitio." };
  }
  return { ok: true };
}

/**
 * Guarda la configuración del mapa (8.15). Validación: tipo conocido;
 * "embed" exige consulta (dirección o nombre del lugar); "iframe" y
 * "link" exigen URL http(s). Tipo "" = volver al placeholder actual.
 */
export function saveMapSettings(input: {
  mapType: string;
  mapQuery: string;
  mapUrl: string;
}): SaveResult {
  seedIfEmpty();
  const mapType = str(input.mapType).trim();
  if (!["", "embed", "iframe", "link"].includes(mapType)) {
    return { ok: false, error: "El tipo de mapa no es válido." };
  }
  const mapQuery = str(input.mapQuery).trim();
  const mapUrl = str(input.mapUrl).trim();
  if (mapType === "embed" && !mapQuery) {
    return { ok: false, error: "Para un mapa de Google escribe la dirección o el nombre del lugar." };
  }
  if ((mapType === "iframe" || mapType === "link") && !/^https?:\/\//i.test(mapUrl)) {
    return { ok: false, error: "Para iframe o enlace la URL debe empezar por http:// o https://." };
  }
  const res = getDb()
    .prepare(
      `UPDATE site_settings SET map_type = ?, map_query = ?, map_url = ?, updated_at = ? WHERE id = 'current'`,
    )
    .run(mapType, mapQuery, mapUrl, Date.now());
  if (res.changes === 0) {
    return { ok: false, error: "No se encontraron los ajustes del sitio." };
  }
  return { ok: true };
}
