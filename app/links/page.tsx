import type { Metadata } from "next";
import { clinic } from "@/lib/data";
import { getLinkItems } from "@/lib/content";
import { siteUrl } from "@/lib/utils";
import { LinksClient } from "@/components/LinksClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enlace único",
  description: `Un solo enlace para compartir ${clinic.name}: agenda, contenido, servicios y más. Descarga el código QR.`,
};

/**
 * Página "link in bio" (7.03): los botones se leen de `link_items`
 * y se editan desde el panel (/admin/enlaces). El QR usa la URL
 * absoluta del sitio (7.01), no la del entorno donde se sirve.
 */
export default function LinksPage() {
  return <LinksClient items={getLinkItems()} qrUrl={`${siteUrl()}/links`} />;
}
