"use server";

// ============================================================
// SERVER ACTIONS DE CONTENIDO — R3-C / R3-D (8.07–8.13)
//
// Cada acción valida la sesión (cookie `rv_admin_session`),
// el RBAC y luego escribe a través de `lib/content.ts`,
// registrando la operación en el log de auditoría (8.12).
//
// Permisos:
// - Contenido (artículos, recursos, servicios, cursos):
//   crear/editar/estados/reordenar = admin + terapeuta;
//   borrar/restaurar = solo admin.
// - Testimonios, enlaces de /links, menú, enlaces cortos y
//   redes = solo admin.
// - Asistente: solo lectura (no tiene escrituras).
// ============================================================

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/admin/session";
import type { Profile } from "@/lib/admin/store";
import { logAudit } from "@/lib/audit";
import { canAdmin, canEditContent } from "@/lib/rbac";
import {
  approveTestimonial as approveTestimonialRow,
  deleteShortLink as deleteShortLinkRow,
  getArticle,
  getFreeResource,
  getServices,
  getCourses,
  moveItem,
  reorderCourses as reorderCoursesRow,
  reorderServices as reorderServicesRow,
  restoreById,
  restoreBySlug,
  restoreShortLink as restoreShortLinkRow,
  saveArticle as saveArticleRow,
  saveCourse as saveCourseRow,
  saveLinkItem as saveLinkItemRow,
  saveMapSettings as saveMapSettingsRow,
  saveNavItem as saveNavItemRow,
  saveResource as saveResourceRow,
  saveService as saveServiceRow,
  saveShortLink as saveShortLinkRow,
  saveSocials as saveSocialsRow,
  saveTestimonial as saveTestimonialRow,
  setArticleStatus as setArticleStatusRow,
  setResourceStatus as setResourceStatusRow,
  softDeleteById,
  softDeleteBySlug,
  type ArticleInput,
  type CourseInput,
  type LinkItemInput,
  type NavItemInput,
  type ResourceInput,
  type SaveResult,
  type ServiceInput,
  type TestimonialInput,
} from "@/lib/content";

const SESSION_COOKIE = "rv_admin_session";

/** Devuelve el perfil de la sesión activa o redirige al login. */
async function currentProfile(): Promise<Profile> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile) redirect("/admin/login");
  return profile;
}

const NOT_ALLOWED: SaveResult = {
  ok: false,
  error: "No tienes permiso para realizar esta acción.",
};

/** Invalida la caché de las rutas afectadas (las páginas son dinámicas, es redundante pero seguro). */
function invalidate(...paths: string[]): void {
  for (const p of paths) revalidatePath(p);
}

// ============================================================
// Artículos (8.07)
// ============================================================

export async function saveArticle(input: ArticleInput): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canEditContent(p.role)) return NOT_ALLOWED;
  const existed = getArticle(input.slug, true) !== null;
  const res = saveArticleRow(input);
  if (!res.ok) return res;
  logAudit(p, existed ? "articulo.actualizar" : "articulo.crear", "articulo", input.slug);
  invalidate("/", "/aprende", `/aprende/${input.slug}`, "/sitemap.xml");
  return res;
}

export async function setArticleStatus(
  slug: string,
  status: string,
  scheduledAt: number | null,
): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canEditContent(p.role)) return NOT_ALLOWED;
  const res = setArticleStatusRow(slug, status as ArticleInput["status"], scheduledAt);
  if (!res.ok) return res;
  logAudit(p, "articulo.estado", "articulo", slug, `estado=${status}`);
  invalidate("/", "/aprende", `/aprende/${slug}`, "/sitemap.xml");
  return res;
}

export async function deleteArticle(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = softDeleteBySlug("articles", slug);
  if (!res.ok) return res;
  logAudit(p, "articulo.eliminar", "articulo", slug);
  invalidate("/", "/aprende", "/sitemap.xml");
  return res;
}

export async function restoreArticle(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = restoreBySlug("articles", slug);
  if (!res.ok) return res;
  logAudit(p, "articulo.restaurar", "articulo", slug);
  invalidate("/", "/aprende", `/aprende/${slug}`, "/sitemap.xml");
  return res;
}

// ============================================================
// Recursos gratuitos (8.07)
// ============================================================

export async function saveResource(input: ResourceInput): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canEditContent(p.role)) return NOT_ALLOWED;
  const existed = getFreeResource(input.slug, true) !== null;
  const res = saveResourceRow(input);
  if (!res.ok) return res;
  logAudit(p, existed ? "recurso.actualizar" : "recurso.crear", "recurso", input.slug);
  invalidate("/", "/gratis", `/gratis/${input.slug}`, "/sitemap.xml");
  return res;
}

export async function setResourceStatus(
  slug: string,
  status: string,
  scheduledAt: number | null,
): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canEditContent(p.role)) return NOT_ALLOWED;
  const res = setResourceStatusRow(slug, status as ResourceInput["status"], scheduledAt);
  if (!res.ok) return res;
  logAudit(p, "recurso.estado", "recurso", slug, `estado=${status}`);
  invalidate("/", "/gratis", `/gratis/${slug}`, "/sitemap.xml");
  return res;
}

export async function deleteResource(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = softDeleteBySlug("free_resources", slug);
  if (!res.ok) return res;
  logAudit(p, "recurso.eliminar", "recurso", slug);
  invalidate("/", "/gratis", "/sitemap.xml");
  return res;
}

export async function restoreResource(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = restoreBySlug("free_resources", slug);
  if (!res.ok) return res;
  logAudit(p, "recurso.restaurar", "recurso", slug);
  invalidate("/", "/gratis", `/gratis/${slug}`, "/sitemap.xml");
  return res;
}

// ============================================================
// Servicios (8.08)
// ============================================================

export async function saveService(input: ServiceInput): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canEditContent(p.role)) return NOT_ALLOWED;
  const existed = getServices().some((s) => s.slug === input.slug);
  const res = saveServiceRow(input);
  if (!res.ok) return res;
  logAudit(p, existed ? "servicio.actualizar" : "servicio.crear", "servicio", input.slug);
  invalidate("/", "/servicios", `/servicios/${input.slug}`, "/agendar", "/sitemap.xml");
  return res;
}

export async function deleteService(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = softDeleteBySlug("services", slug);
  if (!res.ok) return res;
  logAudit(p, "servicio.eliminar", "servicio", slug);
  invalidate("/", "/servicios", "/agendar", "/sitemap.xml");
  return res;
}

export async function restoreService(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = restoreBySlug("services", slug);
  if (!res.ok) return res;
  logAudit(p, "servicio.restaurar", "servicio", slug);
  invalidate("/", "/servicios", `/servicios/${slug}`, "/agendar", "/sitemap.xml");
  return res;
}

/** Reordena los servicios visibles según el orden de slugs recibido. */
export async function reorderServices(slugs: string[]): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canEditContent(p.role)) return NOT_ALLOWED;
  const res = reorderServicesRow(slugs);
  if (!res.ok) return res;
  logAudit(p, "servicio.reordenar", "servicio", null, `orden=${slugs.join(",")}`);
  invalidate("/", "/servicios", "/sitemap.xml");
  return res;
}

// ============================================================
// Cursos (8.08)
// ============================================================

export async function saveCourse(input: CourseInput): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canEditContent(p.role)) return NOT_ALLOWED;
  const existed = getCourses().some((c) => c.slug === input.slug);
  const res = saveCourseRow(input);
  if (!res.ok) return res;
  logAudit(p, existed ? "curso.actualizar" : "curso.crear", "curso", input.slug);
  invalidate("/", "/cursos", `/cursos/${input.slug}`, "/sitemap.xml");
  return res;
}

export async function deleteCourse(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = softDeleteBySlug("courses", slug);
  if (!res.ok) return res;
  logAudit(p, "curso.eliminar", "curso", slug);
  invalidate("/", "/cursos", "/sitemap.xml");
  return res;
}

export async function restoreCourse(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = restoreBySlug("courses", slug);
  if (!res.ok) return res;
  logAudit(p, "curso.restaurar", "curso", slug);
  invalidate("/", "/cursos", `/cursos/${slug}`, "/sitemap.xml");
  return res;
}

/** Reordena los cursos según el orden de slugs recibido. */
export async function reorderCourses(slugs: string[]): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canEditContent(p.role)) return NOT_ALLOWED;
  const res = reorderCoursesRow(slugs);
  if (!res.ok) return res;
  logAudit(p, "curso.reordenar", "curso", null, `orden=${slugs.join(",")}`);
  invalidate("/", "/cursos", "/sitemap.xml");
  return res;
}

// ============================================================
// Testimonios (8.10) — solo admin
// ============================================================

export async function saveTestimonial(input: TestimonialInput): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = saveTestimonialRow(input);
  if (!res.ok) return res;
  const action = input.id ? "testimonial.actualizar" : "testimonial.crear";
  logAudit(p, action, "testimonial", input.id ?? null, `consent=${input.consent ? 1 : 0}`);
  invalidate("/", "/sitemap.xml");
  return res;
}

/** Aprueba un testimonio (requiere consentimiento registrado). */
export async function approveTestimonial(id: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = approveTestimonialRow(id);
  if (!res.ok) return res;
  logAudit(p, "testimonial.aprobar", "testimonial", id);
  invalidate("/", "/sitemap.xml");
  return res;
}

export async function deleteTestimonial(id: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = softDeleteById("testimonials", id);
  if (!res.ok) return res;
  logAudit(p, "testimonial.eliminar", "testimonial", id);
  invalidate("/", "/sitemap.xml");
  return res;
}

export async function restoreTestimonial(id: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = restoreById("testimonials", id);
  if (!res.ok) return res;
  logAudit(p, "testimonial.restaurar", "testimonial", id);
  invalidate("/", "/sitemap.xml");
  return res;
}

// ============================================================
// Enlaces de /links (7.02) — solo admin
// ============================================================

export async function saveLinkItem(input: LinkItemInput): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = saveLinkItemRow(input);
  if (!res.ok) return res;
  logAudit(p, input.id ? "enlace.actualizar" : "enlace.crear", "enlace", input.id ?? null, input.label);
  invalidate("/links");
  return res;
}

export async function deleteLinkItem(id: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = softDeleteById("link_items", id);
  if (!res.ok) return res;
  logAudit(p, "enlace.eliminar", "enlace", id);
  invalidate("/links");
  return res;
}

export async function restoreLinkItem(id: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = restoreById("link_items", id);
  if (!res.ok) return res;
  logAudit(p, "enlace.restaurar", "enlace", id);
  invalidate("/links");
  return res;
}

/** Mueve un enlace arriba (-1) o abajo (1). */
export async function moveLinkItem(id: string, dir: number): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = moveItem("link_items", id, dir === 1 ? 1 : -1);
  if (!res.ok) return res;
  logAudit(p, "enlace.mover", "enlace", id, dir === 1 ? "abajo" : "arriba");
  invalidate("/links");
  return res;
}

// ============================================================
// Menú y redes (8.11) — solo admin
// ============================================================

export async function saveNavItem(input: NavItemInput): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = saveNavItemRow(input);
  if (!res.ok) return res;
  logAudit(p, input.id ? "menu.actualizar" : "menu.crear", "menu", input.id ?? null, input.label);
  invalidate("/");
  return res;
}

export async function deleteNavItem(id: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = softDeleteById("nav_items", id);
  if (!res.ok) return res;
  logAudit(p, "menu.eliminar", "menu", id);
  invalidate("/");
  return res;
}

export async function restoreNavItem(id: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = restoreById("nav_items", id);
  if (!res.ok) return res;
  logAudit(p, "menu.restaurar", "menu", id);
  invalidate("/");
  return res;
}

/** Mueve un elemento del menú arriba (-1) o abajo (1). */
export async function moveNavItem(id: string, dir: number): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = moveItem("nav_items", id, dir === 1 ? 1 : -1);
  if (!res.ok) return res;
  logAudit(p, "menu.mover", "menu", id, dir === 1 ? "abajo" : "arriba");
  invalidate("/");
  return res;
}

// ============================================================
// Enlaces cortos (7.01) — solo admin
// ============================================================

export async function saveShortLink(slug: string, target: string, label: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = saveShortLinkRow(slug, target, label);
  if (!res.ok) return res;
  logAudit(p, "enlace-corto.guardar", "enlace-corto", slug, target);
  invalidate("/links");
  return res;
}

export async function deleteShortLink(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = deleteShortLinkRow(slug);
  if (!res.ok) return res;
  logAudit(p, "enlace-corto.eliminar", "enlace-corto", slug);
  invalidate("/links");
  return res;
}

export async function restoreShortLink(slug: string): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = restoreShortLinkRow(slug);
  if (!res.ok) return res;
  logAudit(p, "enlace-corto.restaurar", "enlace-corto", slug);
  invalidate("/links");
  return res;
}

// ============================================================
// Redes sociales (8.11) — solo admin
// ============================================================

export async function saveSocials(input: { instagram: string; facebook: string }): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = saveSocialsRow(input);
  if (!res.ok) return res;
  logAudit(p, "sitio.redes", "sitio", "current");
  invalidate("/");
  return res;
}

/** Guarda el mapa del sitio (8.15): tipo + consulta/URL. Solo admin. */
export async function saveMap(input: {
  mapType: string;
  mapQuery: string;
  mapUrl: string;
}): Promise<SaveResult> {
  const p = await currentProfile();
  if (!canAdmin(p.role)) return NOT_ALLOWED;
  const res = saveMapSettingsRow(input);
  if (!res.ok) return res;
  logAudit(p, "sitio.mapa", "sitio", "current", `tipo=${input.mapType || "placeholder"}`);
  invalidate("/", "/contacto");
  return res;
}
