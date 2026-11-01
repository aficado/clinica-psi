import type { Metadata } from "next";
import { ServicesCatalog } from "@/components/ServicesCatalog";
import { getServices } from "@/lib/content";
import { asString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Terapia psicológica, masajes terapéuticos, acupuntura y nutrición. Evaluación inicial y plan acordado contigo.",
};

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { cat } = await searchParams;
  return <ServicesCatalog initialCat={asString(cat)} items={getServices()} />;
}
