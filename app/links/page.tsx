import type { Metadata } from "next";
import { clinic } from "@/lib/data";
import { getLinkItems } from "@/lib/content";
import { LinksClient } from "@/components/LinksClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enlaces",
  description: `Un solo enlace para compartir ${clinic.name}: agenda, contenido, servicios y más.`,
};

/**
 * Página "link in bio" (7.03): los botones se leen de `link_items`
 * y se editan desde el panel (/admin/enlaces). El QR y la URL del
 * enlace único son material del admin: ya no se muestran aquí.
 */
export default function LinksPage() {
  return <LinksClient items={getLinkItems()} />;
}