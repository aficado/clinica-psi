import type { Metadata } from "next";
import { AprendeCatalog } from "@/components/AprendeCatalog";
import { getArticles } from "@/lib/content";
import { asString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aprende",
  description:
    "Artículos de bienestar claros y basados en evidencia: ansiedad, sueño, nutrición, respiración, postura y medicina china.",
};

export default async function AprendePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { cat } = await searchParams;
  return <AprendeCatalog initialCat={asString(cat)} items={getArticles()} />;
}
