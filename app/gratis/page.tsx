import type { Metadata } from "next";
import { FreeCatalog } from "@/components/FreeCatalog";
import { getFreeResources } from "@/lib/content";
import { asString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contenido gratis",
  description:
    "Videos y ejercicios guiados de yoga, meditación, respiración, estiramientos y movimiento. Gratis, sin registro.",
};

export default async function GratisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { cat } = await searchParams;
  return <FreeCatalog initialCat={asString(cat)} items={getFreeResources()} />;
}
