import { clinic } from "@/lib/data";
import type { SiteSettings } from "@/lib/content";
import { Icon } from "./ui";

/**
 * Mapa del sitio (R3-E, 8.15): se renderiza desde `site_settings`, así el
 * panel puede cambiar su tipo y su URL sin tocar código (la dirección y
 * el dominio reales aún no están definidos — D1–D8).
 *
 *  - "" → placeholder: embed de Google con la consulta del seed
 *         (comportamiento histórico, con su nota de datos pendientes).
 *  - "embed" → embed de Google con la consulta que defina el admin.
 *  - "iframe" → URL de embed de cualquier proveedor (validada http/s).
 *  - "link" → solo botón «Cómo llegar» a la URL (sin iframe).
 */
export function MapBlock({
  settings,
  className = "w-full",
}: {
  settings: SiteSettings;
  className?: string;
}) {
  if (settings.mapType === "link" && settings.mapUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-(--radius-card) border border-ink/10 bg-mist p-8 ${className}`}
      >
        <Icon name="pin" className="h-8 w-8 text-sage" />
        <p className="text-center text-sm text-ink-soft">{clinic.address}</p>
        <a
          href={settings.mapUrl}
          target="_blank"
          rel="noopener"
          className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-sage px-5 py-2.5 font-semibold text-white no-underline hover:bg-sage-dark"
        >
          <Icon name="pin" className="h-4 w-4" />
          Cómo llegar
        </a>
      </div>
    );
  }

  const src =
    settings.mapType === "iframe" && settings.mapUrl
      ? settings.mapUrl
      : `https://www.google.com/maps?q=${encodeURIComponent(
          settings.mapType === "embed" && settings.mapQuery
            ? settings.mapQuery
            : clinic.mapQuery,
        )}&output=embed`;

  return (
    <iframe
      title="Mapa con la ubicación de la clínica"
      src={src}
      className={`rounded-(--radius-card) border border-ink/10 bg-mist ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
