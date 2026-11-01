import type { Metadata } from "next";
import Link from "next/link";
import { clinic, professionals } from "@/lib/data";
import { waLink } from "@/lib/utils";
import { Button, Card, Chip, Icon, SectionTitle, TodoChip } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "El equipo y la filosofía de la clínica: un enfoque integral que combina salud emocional, cuerpo y hábitos.",
};

const values = [
  { icon: "shield" as const, title: "Confidencialidad", text: "Tu información es privada y se maneja bajo el código de ética profesional y la ley de protección de datos." },
  { icon: "book" as const, title: "Evidencia", text: "Las intervenciones se apoyan en la evidencia disponible y en la evaluación de cada persona, no en modas." },
  { icon: "heart" as const, title: "Respeto", text: "Sin juicios ni promesas mágicas: acompañamiento honesto, con expectativas claras desde el primer contacto." },
  { icon: "calendar" as const, title: "Continuidad", text: "Un mismo equipo te acompaña en todo el proceso: evaluación, plan, seguimiento y ajustes." },
];

const steps = [
  { title: "Evaluación", text: "Primera conversación o consulta: entendemos tu historia, qué te trae y qué quieres lograr." },
  { title: "Plan", text: "Definimos juntos el enfoque, la frecuencia y las herramientas. Tú siempre decides." },
  { title: "Acompañamiento", text: "Sesiones regulares con retroalimentación clara de avances y ajustes." },
  { title: "Seguimiento", text: "Revisamos qué funciona, qué ajustar y cuándo es buen momento para cerrar o reducir la frecuencia." },
];

export default function NosotrosPage() {
  return (
    <>
      <section className="bg-mist" aria-labelledby="nosotros-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Nosotros"
              title="Un lugar donde la salud se atiende completa"
              description={`${clinic.name} nace de una convicción: lo que pasa en la mente, en el cuerpo y en los hábitos no se puede separar. Por eso un mismo equipo integra psicología, terapia manual, medicina china y nutrición. (TODO: historia real de la clínica.)`}
            />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="equipo-title">
        <SectionTitle eyebrow="Equipo" title="Las personas detrás del cuidado" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Reveal variant="card">
            <Card className="flex h-full flex-col gap-4 p-6">
              <img
                src="/images/avatar.svg"
                alt="Fotografía de la psicóloga (pendiente de subir la imagen real)"
                width={240}
                height={240}
                className="h-48 w-48 rounded-(--radius-card) object-cover"
              />
              <div>
                <h3 className="flex flex-wrap items-center gap-2 text-2xl">
                  {clinic.psychologist.name}
                  <TodoChip>TODO</TodoChip>
                </h3>
                <p className="mt-1 text-sage-dark">{clinic.psychologist.role}</p>
                <p className="mt-3 text-ink-soft">{clinic.psychologist.bio}</p>
                <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                  {clinic.psychologist.education.map((e) => (
                    <li key={e} className="flex items-center gap-2">
                      <Icon name="check" className="h-4 w-4 text-sage" />
                      {e}
                      {e.includes("TODO") ? <TodoChip /> : null}
                    </li>
                  ))}
                </ul>
              </div>
              <Button href="/agendar?service=terapia-individual" variant="primary" className="mt-auto">
                Agendar con {clinic.psychologist.name.split(" ").slice(-1)[0]}
              </Button>
            </Card>
          </Reveal>
          <Reveal variant="card" delay={80}>
            <Card className="flex h-full flex-col gap-4 p-6">
              <div className="flex h-48 items-center justify-center rounded-(--radius-card) bg-sand">
                <Icon name="spark" className="h-20 w-20 text-sage/70" />
              </div>
              <div>
                <h3 className="flex flex-wrap items-center gap-2 text-2xl">
                  {professionals[1]?.name ?? "Profesionales"}
                  <TodoChip>TODO: nombre y foto</TodoChip>
                </h3>
                <p className="mt-1 text-sage-dark">{professionals[1]?.role ?? "Terapia manual y medicina china"}</p>
                <p className="mt-3 text-ink-soft">
                  (TODO: biografía, formación y experiencia real del especialista en masajes y medicina china.)
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button href="/agendar?service=masaje-terapeutico" variant="primary">
                  Agendar masaje
                </Button>
                <Button href="/agendar?service=medicina-china" variant="ghost">
                  Agendar acupuntura
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="bg-mist/60" aria-labelledby="valores-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle eyebrow="Valores" title="Lo que siempre nos va a caracterizar" />
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} variant="card" delay={Math.min(i, 4) * 70}>
                <Card className="flex h-full flex-col gap-3 p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand text-sage">
                    <Icon name={v.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="text-lg">{v.title}</h3>
                  <p className="text-sm text-ink-soft">{v.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="proceso-title">
        <Reveal>
          <SectionTitle
            eyebrow="Cómo trabajamos"
            title="Un proceso claro, de principio a fin"
            description="Sabrás en todo momento en qué etapa estás y qué sigue."
          />
        </Reveal>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.title} variant="card" delay={Math.min(i, 4) * 70}>
              <Card className="flex h-full flex-col gap-3 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta font-display text-lg font-semibold text-ink">
                  {i + 1}
                </span>
                <h3 className="text-lg">{s.title}</h3>
                <p className="text-sm text-ink-soft">{s.text}</p>
              </Card>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={120}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button href="/agendar" variant="primary">
              Agendar una cita
            </Button>
            <Button href={waLink(clinic.whatsappNumber, "Hola, me gustaría platicar sobre los servicios de la clínica.")} variant="ghost">
              Platicar por WhatsApp
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
