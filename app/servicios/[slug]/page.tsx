import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { clinic, serviceCategories } from "@/lib/data";
import { getProfessionals } from "@/lib/professionals";
import { getFreeResource, getService } from "@/lib/content";
import { getSessionProfile } from "@/lib/admin/session";
import { canEditContent } from "@/lib/rbac";
import { categoryLabel, posterSrc } from "@/components/cards";
import { Button, Card, Chip, Icon, TodoChip } from "@/components/ui";
import { ShareButtons } from "@/components/ShareButtons";
import { Reveal } from "@/components/Reveal";
import { asString, waLink } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

/** ¿Puede ver servicios ocultos con ?preview=1? (admin + terapeuta). */
async function canPreview(): Promise<boolean> {
  const token = (await cookies()).get("rv_admin_session")?.value ?? null;
  const profile = getSessionProfile(token);
  return profile ? canEditContent(profile.role) : false;
}

const modLabel = (m: string) =>
  m === "enlinea" ? "En línea" : m === "grabado" ? "Grabado" : "Presencial";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return { title: "Servicio no encontrado" };
  return { title: `${s.name} · Servicios`, description: s.description };
}

export default async function ServiceDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const s = getService(slug);
  if (!s) notFound();

  // Servicio oculto: solo visible con ?preview=1 y permisos de edición.
  let preview = false;
  if (!s.visible) {
    if (!(asString(sp.preview) === "1" && (await canPreview()))) notFound();
    preview = true;
  }

  const pros = getProfessionals().filter((p) => p.services.includes(s.slug));
  const rel = s.relatedResource ? getFreeResource(s.relatedResource) : undefined;

  return (
    <>
      {/* Dato estructurado (4.06): Service de schema.org para buscadores. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.name,
            description: s.description,
            serviceType: s.name,
            provider: {
              "@type": "Organization",
              name: clinic.name,
              address: clinic.address,
            },
            areaServed: { "@type": "City", name: "Ciudad de México" },
          }),
        }}
      />
      <Reveal>
        <section className="bg-mist" aria-labelledby="service-title">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-ink-soft">
              <Link href="/" className="no-underline hover:text-sage">
                Inicio
              </Link>
              <span aria-hidden="true"> / </span>
              <Link href="/servicios" className="no-underline hover:text-sage">
                Servicios
              </Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{s.name}</span>
            </nav>
            {preview ? (
              <div
                role="status"
                className="mb-6 rounded-(--radius-card) border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-ink"
              >
                <strong>Vista previa.</strong> Este servicio está oculto al público por
                el momento. Solo lo ves así porque tienes permisos de edición.
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Chip>{categoryLabel(serviceCategories, s.category)}</Chip>
              <Chip>{s.duration} minutos</Chip>
              {s.modalities.map((m) => (
                <Chip key={m}>{modLabel(m)}</Chip>
              ))}
            </div>
            <h1 id="service-title" className="mt-4 text-3xl leading-tight sm:text-4xl">
              {s.name}
            </h1>
            <p className="mt-4 max-w-2xl text-ink-soft">{s.description}</p>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article>
          <Reveal delay={80}>
            <section aria-labelledby="forwho-h" className="mb-8">
              <h2 id="forwho-h" className="text-2xl">
                ¿Para quién es?
              </h2>
              <p className="mt-3 text-ink-soft">{s.forWho}</p>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section aria-labelledby="expect-h" className="mb-8">
              <h2 id="expect-h" className="text-2xl">
                ¿Qué puedes esperar?
              </h2>
              <p className="mt-3 text-ink-soft">{s.whatToExpect}</p>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section
              aria-labelledby="price-h"
              className="mb-8 rounded-(--radius-card) border border-dashed border-terracotta/70 bg-terracotta/10 p-5"
            >
              <h2 id="price-h" className="text-xl">
                Costo
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-ink-soft">
                <TodoChip>TODO: confirmar precio real</TodoChip>
                <span>
                  El precio exacto se confirma al agendar. Pregúntanos sin compromiso y te lo
                  indicamos de inmediato.
                </span>
              </p>
              <div className="mt-4">
                <a
                  href={waLink(
                    clinic.whatsappNumber,
                    `Hola, me gustaría saber el precio del servicio de ${s.name}.`,
                  )}
                  target="_blank"
                  rel="noopener"
                  className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-terracotta px-5 py-2.5 font-semibold text-ink no-underline hover:bg-terracotta-dark"
                >
                  <Icon name="whatsapp" className="h-4 w-4" />
                  Consultar precio
                </a>
              </div>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section aria-labelledby="faq-h" className="mb-8">
              <h2 id="faq-h" className="text-2xl">
                Preguntas frecuentes
              </h2>
              <div className="mt-4 space-y-3">
                {s.faq.map((f) => (
                  <details
                    key={f.q}
                    className="faq rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]"
                  >
                    <summary className="flex items-center justify-between gap-3 font-semibold">
                      {f.q}
                      <Icon name="arrow" className="h-4 w-4 text-sage" />
                    </summary>
                    <p className="mt-3 text-ink-soft">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <div>
              <ShareButtons title={s.name} path={`/servicios/${s.slug}`} />
            </div>
          </Reveal>
        </article>

        <Reveal delay={80}>
          <aside aria-label="Resumen para agendar" className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg">Atienden este servicio</h2>
              <ul className="mt-3 space-y-3">
                {pros.map((p) => (
                  <li key={p.id} className="text-sm">
                    <span className="font-semibold">{p.name}</span>
                    <span className="ml-2">
                      <TodoChip>TODO</TodoChip>
                    </span>
                    <p className="mt-1 text-ink-soft">
                      {p.days.length === 6
                        ? "Lunes a sábado"
                        : "Lunes a viernes"}{" "}
                      · {String(p.open).padStart(2, "0")}:00–{String(p.close).padStart(2, "0")}:00
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col gap-2">
                <Button href={`/agendar?service=${s.slug}`} variant="primary" className="w-full">
                  Agendar una sesión
                </Button>
                <a
                  href={waLink(
                    clinic.whatsappNumber,
                    `Hola, quiero más información sobre ${s.name}.`,
                  )}
                  target="_blank"
                  rel="noopener"
                  className="btn inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-btn) border-2 border-sage/40 px-5 py-2.5 font-semibold text-sage no-underline hover:border-sage hover:bg-sage/10 w-full"
                >
                  <Icon name="whatsapp" className="h-4 w-4" />
                  O por WhatsApp
                </a>
              </div>
            </Card>

            {rel ? (
              <Card className="overflow-hidden">
                <Link
                  href={`/gratis/${rel.slug}`}
                  className="block"
                  aria-label={`Ver recurso gratis: ${rel.title}`}
                >
                  <img
                    src={posterSrc(rel.category)}
                    alt=""
                    width={640}
                    height={360}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                </Link>
                <div className="p-5">
                  <p className="text-sm font-semibold uppercase tracking-widest text-sage">
                    Practica en casa
                  </p>
                  <h3 className="mt-2 text-lg">
                    <Link href={`/gratis/${rel.slug}`} className="no-underline hover:text-sage">
                      {rel.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">{rel.minutes} minutos · gratis</p>
                </div>
              </Card>
            ) : null}
          </aside>
        </Reveal>
      </div>
    </>
  );
}
