import { getArticles, getCourses, getFreeResources, getServices } from "@/lib/content";

// TODO: reemplazar con el dominio real de la clínica
const BASE = "https://www.raizviva.mx";

/** Fecha ISO (yyyy-mm-dd) a partir de un timestamp en ms. */
function day(ms: number): string {
  return new Date(ms).toISOString().split("T")[0];
}

const lastmod = day(Date.now());

export const dynamic = "force-dynamic";

/**
 * Sitemap generado desde la base de datos local (R3-C): solo contenido
 * publicado/visible; los borradores y elementos ocultos no aparecen.
 */
export default function sitemap() {
  const staticPages = [
    { url: "", priority: 1 },
    { url: "/gratis", priority: 0.8 },
    { url: "/aprende", priority: 0.7 },
    { url: "/servicios", priority: 0.8 },
    { url: "/cursos", priority: 0.7 },
    { url: "/nosotros", priority: 0.6 },
    { url: "/contacto", priority: 0.6 },
    { url: "/agendar", priority: 0.8 },
    { url: "/links", priority: 0.5 },
    { url: "/privacidad", priority: 0.3 },
  ];

  const services = getServices();
  const freeResources = getFreeResources();
  const articles = getArticles();
  const courses = getCourses();

  return [
    ...staticPages.map((p) => ({
      url: `${BASE}${p.url}`,
      lastmod,
      changeFrequency: "weekly" as const,
      priority: p.priority,
    })),
    ...services.map((s) => ({
      url: `${BASE}/servicios/${s.slug}`,
      lastmod: day(s.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...freeResources.map((r) => ({
      url: `${BASE}/gratis/${r.slug}`,
      lastmod: day(r.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...articles.map((a) => ({
      url: `${BASE}/aprende/${a.slug}`,
      lastmod: day(a.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...courses.map((c) => ({
      url: `${BASE}/cursos/${c.slug}`,
      lastmod: day(c.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
