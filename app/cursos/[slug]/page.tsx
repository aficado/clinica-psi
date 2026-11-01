import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { courseThemes } from "@/lib/data";
import { getCourse } from "@/lib/content";
import { getSessionProfile } from "@/lib/admin/session";
import { canEditContent } from "@/lib/rbac";
import { Button, Card, Chip, Icon, TodoChip } from "@/components/ui";
import { EnrollmentForm } from "@/components/EnrollmentForm";
import { ShareButtons } from "@/components/ShareButtons";
import { Reveal } from "@/components/Reveal";
import { asString } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

/** ¿Puede ver cursos ocultos con ?preview=1? (admin + terapeuta). */
async function canPreview(): Promise<boolean> {
  const token = (await cookies()).get("rv_admin_session")?.value ?? null;
  const profile = getSessionProfile(token);
  return profile ? canEditContent(profile.role) : false;
}

function modLabel(m: string): string {
  if (m === "enlinea") return "En línea";
  if (m === "grabado") return "Grabado";
  return "Presencial";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCourse(slug);
  if (!c) return { title: "Curso no encontrado" };
  return { title: `${c.title} · Cursos`, description: c.description };
}

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const c = getCourse(slug);
  if (!c) notFound();

  // Curso oculto: solo visible con ?preview=1 y permisos de edición.
  let preview = false;
  if (!c.visible) {
    if (!(asString(sp.preview) === "1" && (await canPreview()))) notFound();
    preview = true;
  }

  const themeLabel = courseThemes.find((t) => t.key === c.theme)?.label ?? c.theme;

  return (
    <>
      <Reveal>
        <section className="bg-mist" aria-labelledby="course-title">
          <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
            <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-ink-soft">
              <Link href="/" className="no-underline hover:text-sage">
                Inicio
              </Link>
              <span aria-hidden="true"> / </span>
              <Link href="/cursos" className="no-underline hover:text-sage">
                Cursos
              </Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{c.title}</span>
            </nav>
            {preview ? (
              <div
                role="status"
                className="mb-6 rounded-(--radius-card) border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-ink"
              >
                <strong>Vista previa.</strong> Este curso está oculto al público por el
                momento. Solo lo ves así porque tienes permisos de edición.
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Chip>{themeLabel}</Chip>
              <Chip>{c.weeks} semanas</Chip>
              <Chip>{modLabel(c.modality)}</Chip>
              <Chip>
                <span className="inline-flex items-center gap-1">
                  <Icon name="user" className="h-3.5 w-3.5" />
                  {c.seats}
                </span>
              </Chip>
            </div>
            <h1 id="course-title" className="mt-4 text-3xl leading-tight sm:text-4xl">
              {c.title}
            </h1>
            <p className="mt-4 text-ink-soft">{c.description}</p>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article>
          <Reveal delay={80}>
            <section aria-labelledby="forwho-h" className="mb-8">
              <h2 id="forwho-h" className="text-2xl">
                ¿Para quién es?
              </h2>
              <p className="mt-3 text-ink-soft">{c.forWho}</p>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section aria-labelledby="info-h" className="mb-8">
              <h2 id="info-h" className="text-2xl">
                Información del curso
              </h2>
              <Card className="mt-4 p-5">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-widest text-sage">
                      Docente
                    </dt>
                    <dd className="mt-1 text-ink-soft">
                      {c.instructor}
                      <span className="ml-2">
                        <TodoChip>TODO: docente real y biografía</TodoChip>
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-widest text-sage">
                      Horario
                    </dt>
                    <dd className="mt-1 text-ink-soft">{c.schedule}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-widest text-sage">
                      Duración
                    </dt>
                    <dd className="mt-1 text-ink-soft">{c.weeks} semanas</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-widest text-sage">
                      Modalidad
                    </dt>
                    <dd className="mt-1 text-ink-soft">{modLabel(c.modality)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-widest text-sage">
                      Precio
                    </dt>
                    <dd className="mt-1 text-ink-soft">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <TodoChip>TODO: confirmar precio</TodoChip>
                        <span>{c.price}</span>
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-widest text-sage">
                      Cupo
                    </dt>
                    <dd className="mt-1 text-ink-soft">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <TodoChip>TODO: confirmar cupo</TodoChip>
                        <span>{c.seats}</span>
                      </span>
                    </dd>
                  </div>
                </dl>
              </Card>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section aria-labelledby="syllabus-h" className="mb-8">
              <h2 id="syllabus-h" className="text-2xl">
                Temario
              </h2>
              <ol className="mt-4 space-y-3">
                {c.syllabus.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-ink-soft">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sm font-semibold text-sage-dark"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section aria-labelledby="req-h" className="mb-8">
              <h2 id="req-h" className="text-2xl">
                Requisitos
              </h2>
              <ul className="mt-4 space-y-3">
                {c.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-ink-soft">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section id="inscripcion" aria-labelledby="insc-h" className="mb-8">
              <h2 id="insc-h" className="text-2xl">
                Solicita tu cupo
              </h2>
              <Card className="mt-4 p-5 sm:p-6">
                <p className="mb-4 text-ink-soft">
                  Al enviar tu solicitud la guardamos y te contactamos por WhatsApp para confirmar el
                  cupo y el pago. No se cobra ningún costo por solicitar.
                </p>
                <EnrollmentForm course={c} />
              </Card>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <ShareButtons title={c.title} path={`/cursos/${c.slug}`} />
          </Reveal>
        </article>

        <Reveal delay={80}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/cursos" variant="ghost">
              Ver todos los cursos
            </Button>
            <Button href="/agendar" variant="primary">
              Agendar una sesión individual
            </Button>
          </div>
        </Reveal>
      </div>
    </>
  );
}
