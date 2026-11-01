import type { MetadataRoute } from "next";

// TODO: reemplazar con el dominio real de la clínica
const BASE = "https://www.raizviva.mx";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/mi-cita"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
