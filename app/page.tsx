import type { Metadata } from "next";
import Link from "next/link";
import { clinic } from "@/lib/data";
import {
  getArticles,
  getCourses,
  getFreeResources,
  getPublicTestimonials,
  getServices,
  getSiteSettings,
} from "@/lib/content";
import { waLink } from "@/lib/utils";
import { ArticleCard, CourseCard, ResourceCard, ServiceCard } from "@/components/cards";
import { Button, Card, Chip, Icon, SectionTitle, TodoChip } from "@/components/ui";
import { MapBlock } from "@/components/MapBlock";
import { Reveal } from "@/components/Reveal";
import { getThemeTokens } from "@/lib/themes";
import { getMediaAsset } from "@/lib/media";

export const metadata: Metadata = {
  description:
    "Terapia psicológica, masajes terapéuticos, medicina china y nutrición en un solo lugar. Atención presencial y en línea.",
  openGraph: {
    title: `${clinic.fullName} · Cuidado integral para tu cuerpo y tu mente`,
    description:
      "Terapia psicológica, masajes terapéuticos, medicina china y nutrición. Agenda tu cita en línea o explora nuestro contenido gratuito.",
  },
};

export const dynamic = "force-dynamic";

const quickLinks = [
  {
    icon: "heart" as const,
    title: "Terapia psicológica",
    text: "Ansiedad, estrés, duelos y relaciones, con acompañamiento clínico.",
    href: "/servicios?cat=psicologia",
  },
  {
    icon: "user" as const,
    title: "Masajes terapéuticos",
    text: "Técnica manual para liberar tensión y dolor muscular.",
    href: "/servicios?cat=masajes",
  },
  {
    icon: "spark" as const,
    title: "Medicina china",
    text: "Acupuntura y electroacupuntura (TENS) con evaluación previa.",
    href: "/servicios?cat=medicina-china",
  },
  {
    icon: "leaf" as const,
    title: "Nutrición",
    text: "Acompañamiento nutricional para energía y hábitos sostenibles.",
    href: "/servicios?cat=nutricion",
  },
];

const pillars = [
  {
    icon: "leaf" as const,
    title: "Integral",
    text: "Acompañamos mente, cuerpo y hábitos: no tratamos síntomas aislados, sino a la persona completa.",
  },
  {
    icon: "shield" as const,
    title: "Profesional",
    text: "Cada intervención parte de una evaluación y está a cargo de profesionales capacitados.",
  },
  {
    icon: "heart" as const,
    title: "Cercano",
    text: "Trabajamos contigo, no sobre ti: el plan se define en conjunto y se ajusta en el camino.",
  },
];

export default function HomePage() {
  const featuredServices = getServices().slice(0, 3);
  const featuredResources = getFreeResources().slice(0, 3);
  const featuredCourses = getCourses().slice(0, 2);
  const featuredArticles = getArticles().slice(0, 3);
  const publicTestimonials = getPublicTestimonials();

  // Imagen del hero configurada desde el panel admin (R3-B, 8.05);
  // si no hay, se usa la ilustración por defecto.
  const theme = getThemeTokens();
  const heroAsset = theme.hero_image_id ? getMediaAsset(theme.hero_image_id) : null;
  const heroImage = heroAsset && heroAsset.kind === "image" ? heroAsset : null;

  return (
    <>
      {/* ================= Hero (asimétrico, §4.1) — entrada escalonada ================= */}
      <section className="relative overflow-hidden bg-mist" aria-labelledby="hero-title">
        <div
          className="blob float-slow -left-24 -top-24 h-96 w-96 bg-sand/70"
          style={{ borderRadius: "45% 55% 48% 52% / 52% 46% 54% 48%" }}
          aria-hidden="true"
        />
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center">
            <Reveal className="mb-4">
              <Chip className="w-fit">Clínica de bienestar integral</Chip>
            </Reveal>
            <Reveal delay={100}>
              <h1 id="hero-title" className="text-4xl leading-tight sm:text-5xl">
                Cuida tu cuerpo y tu mente con acompañamiento profesional
              </h1>
            </Reveal>
            <Reveal delay={200} className="mt-4">
              <p className="max-w-xl text-lg text-ink-soft">{clinic.tagline}</p>
            </Reveal>
            <Reveal delay={300} className="mt-8">
              <div className="flex flex-wrap gap-3">
                <Button href="/agendar" variant="primary" className="min-w-48">
                  Agendar una cita
                </Button>
                <Button href="/gratis" variant="ghost" className="min-w-48">
                  Explorar contenido gratis
                </Button>
              </div>
            </Reveal>
            <Reveal delay={400} className="mt-8">
              <ul className="flex flex-wrap gap-2" aria-label="Características del servicio">
                {["Presencial y en línea", "Evaluación previa", "Sin juicios"].map((t) => (
                  <li key={t} className="text-sm font-medium text-sage-dark">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="check" className="h-4 w-4" />
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="relative">
            <Reveal delay={150}>
              <img
                src={heroImage ? heroImage.file_url : "/images/hero.svg"}
                alt={heroImage ? heroImage.name : "Ilustración de un paisaje sereno: sol, colinas y un brote de hojas"}
                width={800}
                height={620}
                className="aspect-[800/620] w-full rounded-[2.5rem] object-cover shadow-[0_16px_40px_rgba(31,42,39,0.18)]"
              />
            </Reveal>
            <Reveal variant="card" delay={450} className="absolute bottom-4 left-4 max-w-[260px] sm:bottom-6 sm:left-6">
              <Card className="float-soft p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <Icon name="calendar" className="h-5 w-5 text-terracotta" />
                  Agenda en 4 pasos
                </p>
                <p className="mt-1 text-sm text-ink-soft">Sin registro: elige servicio, hora y confirma.</p>
                <Link href="/agendar" className="mt-2 inline-flex items-center gap-1 font-semibold text-sage no-underline hover:text-sage-dark">
                  Agendar ahora
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= Acceso rápido (bloques C, §4.1) ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="quick-title">
        <Reveal>
          <SectionTitle
            eyebrow="Acceso rápido"
            title="¿Qué necesitas hoy?"
            description="Elige el área que quieras atender y llega directo al detalle o a la agenda."
          />
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((q, i) => (
            <Reveal key={q.title} variant="card" delay={Math.min(i, 4) * 70}>
              <Link
                href={q.href}
                className="flex h-full flex-col gap-3 rounded-(--radius-card) bg-white p-6 no-underline shadow-[0_1px_2px_rgba(31,42,39,0.06),0_8px_24px_rgba(31,42,39,0.07)] transition-transform duration-200 hover:-translate-y-1"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mist text-sage">
                  <Icon name={q.icon} className="h-6 w-6" />
                </span>
                <h2 className="text-lg">{q.title}</h2>
                <p className="text-sm text-ink-soft">{q.text}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-sage">
                  Ver más
                  <Icon name="arrow" className="h-4 w-4" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= Enfoque (bloques E, §4.1) ================= */}
      <section className="bg-mist/60" aria-labelledby="approach-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <SectionTitle
                eyebrow="Nuestro enfoque"
                title="Cuidado integral, profesional y cercano"
              />
              <p className="mt-4 text-ink-soft">
                En {clinic.name} trabajamos la salud como un sistema: lo emocional, lo físico y los
                hábitos se influyen entre sí. Por eso un mismo lugar te ofrece terapia psicológica,
                terapia manual, medicina china y nutrición, con un único punto de coordinación.
              </p>
              <Button href="/nosotros" variant="secondary" className="mt-6">
                Conocer a nuestro equipo
              </Button>
            </Reveal>
            <div className="grid gap-4">
              {pillars.map((p, i) => (
                <Reveal key={p.title} variant="card" delay={Math.min(i, 4) * 70}>
                  <Card className="flex gap-4 p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sand text-sage">
                      <Icon name={p.icon} className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-lg">{p.title}</h3>
                      <p className="mt-1 text-sm text-ink-soft">{p.text}</p>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Psicóloga (bloque F, §4.1) ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="team-title">
        <Reveal variant="card">
          <Card className="grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr]">
            <img
              src="/images/avatar.svg"
              alt="Fotografía de la psicóloga (pendiente de subir la imagen real)"
              width={280}
              height={280}
              className="h-56 w-56 rounded-[2rem] object-cover md:h-64 md:w-64"
            />
            <div>
              <SectionTitle eyebrow="Tu profesional" title="El corazón de la clínica" />
              <p className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xl font-semibold">{clinic.psychologist.name}</span>
                <TodoChip>TODO: nombre y foto reales</TodoChip>
              </p>
              <p className="mt-1 text-sage-dark">{clinic.psychologist.role}</p>
              <p className="mt-4 text-ink-soft">{clinic.psychologist.bio}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {clinic.psychologist.education.map((e) => (
                  <li key={e} className="flex items-center gap-2 text-ink-soft">
                    <Icon name="check" className="h-4 w-4 text-sage" />
                    <span>{e}</span>
                    {e.includes("TODO") ? <TodoChip /> : null}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/agendar?service=terapia-individual" variant="primary">
                  Agendar consulta
                </Button>
                <Button
                  href={waLink(clinic.whatsappNumber, "Hola, me gustaría saber más sobre la terapia psicológica.")}
                  variant="ghost"
                >
                  Escríbela por WhatsApp
                </Button>
              </div>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* ================= Servicios destacados (bloque D) ================= */}
      <section className="bg-mist/60" aria-labelledby="services-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Servicios"
              title="Acompañamiento para cada necesidad"
              description="Cada servicio incluye evaluación inicial y un plan acordado contigo."
            />
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredServices.map((s, i) => (
              <Reveal key={s.slug} variant="card" delay={Math.min(i, 4) * 70}>
                <ServiceCard s={s} />
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div className="mt-8 text-center">
              <Button href="/servicios" variant="ghost">
                Ver todos los servicios
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= Contenido gratis (bloque A) ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="free-title">
        <Reveal>
          <SectionTitle
            eyebrow="Gratis"
            title="Empieza a cuidarte hoy, sin costo"
            description="Videos y ejercicios guiados para practicar en casa. Sin registro, sin compromiso."
          />
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featuredResources.map((r, i) => (
            <Reveal key={r.slug} variant="card" delay={Math.min(i, 4) * 70}>
              <ResourceCard r={r} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div className="mt-8 text-center">
            <Button href="/gratis" variant="ghost">
              Ver toda la biblioteca
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ================= Cursos (bloque B) ================= */}
      <section className="bg-mist/60" aria-labelledby="courses-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Cursos y talleres"
              title="Aprende herramientas para tu bienestar"
              description="Grupos pequeños, con práctica y seguimiento. Inscripciones por grupo."
            />
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {featuredCourses.map((c, i) => (
              <Reveal key={c.slug} variant="card" delay={Math.min(i, 4) * 70}>
                <CourseCard c={c} />
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div className="mt-8 text-center">
              <Button href="/cursos" variant="ghost">
                Ver todos los cursos
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= Artículos (bloque H) ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="blog-title">
        <Reveal>
          <SectionTitle
            eyebrow="Aprende"
            title="Artículos sobre bienestar"
            description="Información clara, basada en evidencia, escrita por el equipo de la clínica."
          />
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featuredArticles.map((a, i) => (
            <Reveal key={a.slug} variant="card" delay={Math.min(i, 4) * 70}>
              <ArticleCard a={a} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div className="mt-8 text-center">
            <Button href="/aprende" variant="ghost">
              Ver todos los artículos
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ================= Testimonios (bloque I, §4.1) ================= */}
      <section className="bg-mist/60" aria-labelledby="testimonials-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Testimonios"
              title="Historias de quienes nos acompañan"
              description="Se publican únicamente con consentimiento por escrito de cada persona."
            />
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {publicTestimonials.length > 0 ? (
              publicTestimonials.map((t, i) => (
                <Reveal key={t.id} variant="card" delay={Math.min(i, 4) * 70}>
                  <Card className="flex h-full flex-col gap-3 p-6">
                    <Icon name="spark" className="h-6 w-6 text-terracotta" />
                    <p className="italic text-ink-soft">{t.text}</p>
                    <p className="mt-auto text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-ink-soft">{t.context}</p>
                  </Card>
                </Reveal>
              ))
            ) : (
              // Sin testimonios aprobados con consentimiento todavía (8.10):
              // 3 tarjetas placeholder con la misma estructura y el chip
              // TODO; nombre y contexto se ocultan hasta que el admin
              // apruebe testimonios reales desde el panel.
              [0, 1, 2].map((i) => (
                <Reveal key={i} variant="card" delay={i * 70}>
                  <Card className="flex h-full flex-col gap-3 p-6">
                    <Icon name="spark" className="h-6 w-6 text-terracotta" />
                    <p className="italic text-ink-soft">
                      <TodoChip>TODO: testimonial con consentimiento</TodoChip>
                    </p>
                  </Card>
                </Reveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ================= Ubicación (bloque G) ================= */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="location-title">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <SectionTitle eyebrow="Ubicación" title="Visítanos" />
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <Icon name="pin" className="mt-1 h-5 w-5 shrink-0 text-sage" />
                <span>{clinic.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="clock" className="mt-1 h-5 w-5 shrink-0 text-sage" />
                <span>{clinic.hours}</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="whatsapp" className="mt-1 h-5 w-5 shrink-0 text-sage" />
                <a
                  href={waLink(clinic.whatsappNumber, "Hola, quiero saber cómo llegar a la clínica.")}
                  target="_blank"
                  rel="noopener"
                  className="no-underline hover:text-sage"
                >
                  {clinic.whatsapp}
                </a>
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/contacto#mapa" variant="secondary">
                Cómo llegar
              </Button>
              <Button
                href={waLink(clinic.whatsappNumber, "Hola, me gustaría saber más sobre la clínica.")}
                variant="ghost"
              >
                Hablar por WhatsApp
              </Button>
            </div>
          </Reveal>
          <Reveal variant="card" delay={80}>
            <MapBlock settings={getSiteSettings()} className="h-full min-h-72 w-full" />
          </Reveal>
        </div>
      </section>

      {/* ================= CTA final ================= */}
      <section className="bg-sage" aria-labelledby="cta-title">
        <Reveal>
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6">
            <h2 id="cta-title" className="text-3xl text-white sm:text-4xl">
              ¿Listo para empezar a cuidarte?
            </h2>
            <p className="max-w-xl text-mist">
              Agenda tu primera sesión en línea o escríbenos por WhatsApp: te ayudamos a elegir el
              acompañamiento que mejor te funcione.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/agendar" variant="primary" className="min-w-48">
                Agendar una cita
              </Button>
              <Button
                href={waLink(clinic.whatsappNumber, "Hola, me gustaría información sobre la clínica.")}
                variant="ghost"
                className="border-white/60 text-white hover:border-white hover:bg-white/10"
              >
                Escríbenos por WhatsApp
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
