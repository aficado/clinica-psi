import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { resourceCategories } from "@/lib/data";
import { getFreeResource, getFreeResources, getService, isLiveStatus } from "@/lib/content";
import { getSessionProfile } from "@/lib/admin/session";
import { canEditContent } from "@/lib/rbac";
import { categoryLabel, posterSrc } from "@/components/cards";
import { Button, Card, Chip, Icon, TodoChip } from "@/components/ui";
import { ShareButtons } from "@/components/ShareButtons";
import { VideoEmbed } from "@/components/VideoEmbed";
import { Reveal } from "@/components/Reveal";
import { asString, formatDateMX } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

/** Convierte un timestamp (ms) a fecha ISO local yyyy-mm-dd. */
function isoFromMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** ¿Puede ver borradores y programados con ?preview=1? (admin + terapeuta). */
async function canPreview(): Promise<boolean> {
  const token = (await cookies()).get("rv_admin_session")?.value ?? null;
  const profile = getSessionProfile(token);
  return profile ? canEditContent(profile.role) : false;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = getFreeResource(slug, true);
  if (!r) return { title: "Recurso no encontrado" };
  return { title: `${r.title} · Gratis`, description: r.description };
}

export default async function ResourceDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  let r = getFreeResource(slug);
  let preview = false;
  if (!r && asString(sp.preview) === "1" && (await canPreview())) {
    const any = getFreeResource(slug, true);
    if (any && !isLiveStatus(any.status, any.scheduledAt)) {
      r = any;
      preview = true;
    }
  }
  if (!r) notFound();

  const svc = r.relatedService ? getService(r.relatedService) : null;
  const relatedService = svc && svc.visible ? svc : undefined;
  const others = getFreeResources()
    .filter((x) => x.category === r.category && x.slug !== r.slug)
    .slice(0, 3);

  return (
    <>
      <Reveal>
        <section className="bg-mist" aria-labelledby="resource-title">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-ink-soft">
              <Link href="/" className="no-underline hover:text-sage">
                Inicio
              </Link>
              <span aria-hidden="true"> / </span>
              <Link href="/gratis" className="no-underline hover:text-sage">
                Gratis
              </Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{r.title}</span>
            </nav>
            {preview ? (
              <div
                role="status"
                className="mb-6 rounded-(--radius-card) border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-ink"
              >
                <strong>Vista previa.</strong>
                {r.status === "borrador"
                  ? " Este recurso aún está en borrador."
                  : r.scheduledAt
                    ? ` Está programado para el ${formatDateMX(isoFromMs(r.scheduledAt))}.`
                    : ""}{" "}
                Solo lo ves así porque tienes permisos de edición.
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Chip>{categoryLabel(resourceCategories, r.category)}</Chip>
              <Chip>{r.minutes} minutos</Chip>
              <Chip className="capitalize">{r.level}</Chip>
            </div>
            <h1 id="resource-title" className="mt-4 text-3xl leading-tight sm:text-4xl">
              {r.title}
            </h1>
            <p className="mt-4 max-w-2xl text-ink-soft">{r.description}</p>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article>
          <Reveal delay={80}>
            {r.video ? (
              <VideoEmbed id={r.video.id} title={r.title} />
            ) : (
              <div className="relative overflow-hidden rounded-(--radius-card)">
                <img
                  src={r.poster ?? posterSrc(r.category)}
                  alt=""
                  width={640}
                  height={360}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/55"
                  role="status"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                    <Icon name="video" className="h-7 w-7 text-sage" />
                  </span>
                  <p className="text-lg font-semibold text-white">Video en preparación</p>
                  <p className="max-w-sm text-center text-sm text-white/85">
                    Publicaremos aquí el video propio de este recurso. Mientras tanto, sigue la
                    guía escrita y las precauciones de abajo.
                  </p>
                </div>
                <span className="absolute bottom-3 left-3">
                  <TodoChip>TODO: video propio de la clínica</TodoChip>
                </span>
              </div>
            )}
          </Reveal>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <Reveal delay={80}>
              <section aria-labelledby="benefits-h">
                <h2 id="benefits-h" className="text-xl">
                  Qué puedes esperar
                </h2>
                <ul className="mt-4 space-y-3">
                  {r.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-ink-soft">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                      {b}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
            <Reveal delay={80}>
              <section aria-labelledby="cautions-h">
                <h2 id="cautions-h" className="text-xl">
                  Precauciones
                </h2>
                <ul className="mt-4 space-y-3">
                  {r.cautions.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-ink-soft">
                      <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-(--radius-btn) bg-mist px-4 py-3 text-sm text-ink-soft">
                  Este contenido es informativo y no sustituye la valoración de un profesional de
                  la salud.
                </p>
              </section>
            </Reveal>
          </div>

          <Reveal delay={80}>
            <div className="mt-10">
              <ShareButtons title={r.title} path={`/gratis/${r.slug}`} />
            </div>
          </Reveal>
        </article>

        <Reveal delay={80}>
          <aside aria-label="Información relacionada" className="space-y-6">
            {relatedService ? (
              <Card className="p-5">
                <h2 className="text-lg">¿Quieres acompañamiento en vivo?</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  Este recurso encaja muy bien con el servicio de{" "}
                  {relatedService.name.toLowerCase()}.
                </p>
                <p className="mt-3 font-semibold">{relatedService.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" className="h-4 w-4" />
                    {relatedService.duration} min
                  </span>
                  {relatedService.modalities.map((m) => (
                    <Chip key={m}>{m === "enlinea" ? "En línea" : "Presencial"}</Chip>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button href={`/agendar?service=${relatedService.slug}`} variant="primary" className="flex-1">
                    Agendar
                  </Button>
                  <Button href={`/servicios/${relatedService.slug}`} variant="ghost" className="flex-1">
                    Ver detalle
                  </Button>
                </div>
              </Card>
            ) : null}

            {others.length > 0 ? (
              <Card className="p-5">
                <h2 className="text-lg">Sigue practicando</h2>
                <ul className="mt-3 space-y-3">
                  {others.map((o) => (
                    <li key={o.slug}>
                      <Link
                        href={`/gratis/${o.slug}`}
                        className="no-underline font-medium hover:text-sage"
                      >
                        {o.title}
                        <span className="ml-2 text-sm text-ink-soft">({o.minutes} min)</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/gratis?cat=${r.category}`}
                  className="mt-4 inline-flex items-center gap-1 font-semibold text-sage no-underline hover:text-sage-dark"
                >
                  Ver más de {categoryLabel(resourceCategories, r.category)}
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </Card>
            ) : null}
          </aside>
        </Reveal>
      </div>
    </>
  );
}
