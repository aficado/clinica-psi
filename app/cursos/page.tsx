import type { Metadata } from "next";
import { CoursesCatalog } from "@/components/CoursesCatalog";
import { getCourses } from "@/lib/content";
import { asString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cursos y talleres",
  description:
    "Cursos de yoga para el estrés, fundamentos de masaje, nutrición emocional y qigong. Grupos pequeños con seguimiento.",
};

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { theme, mod } = await searchParams;
  return <CoursesCatalog initialTheme={asString(theme)} items={getCourses()} />;
}
