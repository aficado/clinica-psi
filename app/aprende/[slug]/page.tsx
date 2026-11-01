import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { articleCategories } from "@/lib/data";
import { getArticle, getArticles, isLiveStatus } from "@/lib/content";
import { getSessionProfile } from "@/lib/admin/session";
import { canEditContent } from "@/lib/rbac";
import { ArticleCard, categoryLabel } from "@/components/cards";
import { Button, Card, Chip, TodoChip } from "@/components/ui";
import { ShareButtons } from "@/components/ShareButtons";
import { Reveal } from "@/components/Reveal";
import { asString, formatDateMX, readingTime } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

/** Convierte un timestamp (ms) a fecha ISO local yyyy-mm-dd. */
function isoFromMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Mapa de categoría de artículo → categoría de servicio (para el CTA). */
const serviceByCategory: Record<string, string> = {
  psicologia: "psicologia",
  "medicina-china": "medicina-china",
  masajes: "masajes",
  nutricion: "nutricion",
  "salud-fisica": "masajes",
  "salud-emocional": "psicologia",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug, true);
  if (!a) return { title: "Artículo no encontrado" };
  return { title: `${a.title} · Aprende`, description: a.excerpt };
}

/** ¿Puede ver borradores y programados con ?preview=1? (admin + terapeuta). */
async function canPreview(): Promise<boolean> {
  const token = (await cookies()).get("rv_admin_session")?.value ?? null;
  const profile = getSessionProfile(token);
  return profile ? canEditContent(profile.role) : false;
}

export default async function ArticleDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  // Artículo "publicado" (publicado o programado vencido); si no existe
  // y traen ?preview=1 con permisos, se muestra el borrador/programado.
  let a = getArticle(slug);
  let preview = false;
  if (!a && asString(sp.preview) === "1" && (await canPreview())) {
    const any = getArticle(slug, true);
    if (any && !isLiveStatus(any.status, any.scheduledAt)) {
      a = any;
      preview = true;
    }
  }
  if (!a) notFound();

  const words = a.sections.map((s) => s.paragraphs.join(" ")).join(" ");
  const minutes = readingTime(words);
  const toc = a.sections
    .filter((s) => s.heading)
    .map((s) => ({ id: sectionId(s.heading as string), label: s.heading as string }));
  const related = getArticles()
    .filter((x) => x.slug !== a.slug && x.category === a.category)
    .slice(0, 3);

  return (
    <>
      <Reveal>
        <section className="bg-mist" aria-labelledby="article-title">
          <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
            <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-ink-soft">
              <Link href="/" className="no-underline hover:text-sage">
                Inicio
              </Link>
              <span aria-hidden="true"> / </span>
              <Link href="/aprende" className="no-underline hover:text-sage">
                Aprende
              </Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{a.title}</span>
            </nav>
            {preview ? (
              <div
                role="status"
                className="mb-6 rounded-(--radius-card) border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-ink"
              >
                <strong>Vista previa.</strong>
                {a.status === "borrador"
                  ? " Este artículo aún está en borrador."
                  : a.scheduledAt
                    ? ` Está programado para el ${formatDateMX(isoFromMs(a.scheduledAt))}.`
                    : ""}{" "}
                Solo lo ves así porque tienes permisos de edición.
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Chip>{categoryLabel(articleCategories, a.category)}</Chip>
              <span className="text-sm text-ink-soft">{formatDateMX(a.date)}</span>
              <span className="text-sm text-ink-soft">· {minutes} min de lectura</span>
            </div>
            <h1 id="article-title" className="mt-4 text-3xl leading-tight sm:text-4xl">
              {a.title}
            </h1>
            <p className="mt-4 text-lg text-ink-soft">{a.excerpt}</p>
            <p className="mt-4 text-sm text-ink-soft">
              Por <span className="font-semibold">{a.author}</span>
              <span className="ml-2">
                <TodoChip>TODO: autor real</TodoChip>
              </span>
            </p>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article>
          {toc.length >= 2 ? (
            <Reveal delay={80}>
              <nav aria-label="Índice del artículo" className="mb-8">
                <Card className="p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-sage">
                    Contenido
                  </h2>
                  <ol className="mt-3 list-decimal space-y-2 pl-5">
                    {toc.map((t) => (
                      <li key={t.id}>
                        <a href={`#${t.id}`} className="no-underline hover:text-sage">
                          {t.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </Card>
              </nav>
            </Reveal>
          ) : null}

          <div className="space-y-8">
            {a.sections.map((s, i) => (
              <Reveal key={i} delay={80}>
                <section aria-labelledby={s.heading ? sectionId(s.heading) : undefined}>
                  {s.heading ? (
                    <h2 id={sectionId(s.heading)} className="text-2xl">
                      {s.heading}
                    </h2>
                  ) : null}
                  <div className="mt-3 space-y-4">
                    {s.paragraphs.map((p, j) => (
                      <p key={j} className="text-ink-soft">
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal delay={80}>
            <p className="mt-10 rounded-(--radius-btn) bg-mist px-4 py-3 text-sm text-ink-soft">
              Este artículo es informativo y no sustituye la consulta con un profesional de la
              salud.
              Si tu situación te genera malestar sostenido, agenda una valoración.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ShareButtons title={a.title} path={`/aprende/${a.slug}`} />
              <Button
                href={`/servicios?cat=${serviceByCategory[a.category] ?? "psicologia"}`}
                variant="primary"
              >
                Agendar una consulta
              </Button>
            </div>
          </Reveal>
        </article>

        {related.length > 0 ? (
          <section className="mt-12" aria-labelledby="related-h">
            <Reveal delay={80}>
              <h2 id="related-h" className="text-2xl">
                Artículos relacionados
              </h2>
            </Reveal>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((r, i) => (
                <Reveal key={r.slug} variant="card" delay={80 + Math.min(i, 3) * 70}>
                  <ArticleCard a={r} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
