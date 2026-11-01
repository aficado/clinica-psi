import type { Metadata } from "next";
import { clinic } from "@/lib/data";
import { getSiteSettings } from "@/lib/content";
import { waLink } from "@/lib/utils";
import { ContactForm } from "@/components/ContactForm";
import { Button, Card, Icon, SectionTitle } from "@/components/ui";
import { MapBlock } from "@/components/MapBlock";
import { Reveal } from "@/components/Reveal";

/** El mapa se lee de la BD (8.15): la página es dinámica. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Ubicación, horarios y formas de contactar a la clínica: WhatsApp, teléfono y correo. Mapa y rutas.",
};

const faq = [
  { q: "¿Puedo agendar solo por WhatsApp?", a: "Sí. Escríbenos y te confirmamos el horario disponible. Para agendar en línea y elegir la hora exacta, usa la página de agendar." },
  { q: "¿Atienden en línea?", a: "Sí, la terapia psicológica y la nutrición pueden ser en línea. El masaje y la medicina china son presenciales." },
  { q: "¿Qué debo traer a mi primera visita?", a: "Solo tu identificación y, si tienes, estudios o informes previos. El resto lo cubrimos en la evaluación." },
];

export default function ContactoPage() {
  return (
    <>
      <section className="bg-mist" aria-labelledby="contacto-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Contacto"
              title="Estamos a un mensaje de distancia"
              description="Escríbenos, llámanos o visítanos. Respondemos en horario de oficina."
            />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-4">
              <Card className="flex items-start gap-3 p-5">
                <Icon name="pin" className="mt-1 h-6 w-6 shrink-0 text-sage" />
                <div>
                  <h2 className="text-lg">Dirección</h2>
                  <p className="text-ink-soft">{clinic.address} · {clinic.city}</p>
                </div>
              </Card>
              <Card className="flex items-start gap-3 p-5">
                <Icon name="whatsapp" className="mt-1 h-6 w-6 shrink-0 text-sage" />
                <div>
                  <h2 className="text-lg">WhatsApp / Teléfono</h2>
                  <a
                    href={waLink(clinic.whatsappNumber, "Hola, me gustaría información sobre la clínica.")}
                    target="_blank"
                    rel="noopener"
                    className="no-underline hover:text-sage"
                  >
                    {clinic.whatsapp}
                  </a>
                  <p className="text-xs text-ink-soft">Horario de oficina</p>
                </div>
              </Card>
              <Card className="flex items-start gap-3 p-5">
                <Icon name="mail" className="mt-1 h-6 w-6 shrink-0 text-sage" />
                <div>
                  <h2 className="text-lg">Correo</h2>
                  <a href={`mailto:${clinic.email}`} className="no-underline hover:text-sage">
                    {clinic.email}
                  </a>
                </div>
              </Card>
              <Card className="flex items-start gap-3 p-5">
                <Icon name="clock" className="mt-1 h-6 w-6 shrink-0 text-sage" />
                <div>
                  <h2 className="text-lg">Horarios</h2>
                  <p className="text-ink-soft">{clinic.hours}</p>
                  <p className="text-sm text-ink-soft">Sábados solo para masaje y medicina china (10:00–14:00).</p>
                </div>
              </Card>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <Card className="p-6">
              <h2 className="text-2xl">Escríbenos</h2>
              <p className="mt-2 mb-6 text-ink-soft">
                Cuéntanos qué necesitas y te orientamos con el servicio adecuado.
              </p>
              <ContactForm />
            </Card>
          </Reveal>
        </div>
      </section>

      <section id="mapa" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6" aria-labelledby="mapa-title">
        <Reveal>
          <SectionTitle eyebrow="Ubicación" title="Mapa de la clínica" />
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-6">
            <MapBlock settings={getSiteSettings()} className="h-96 w-full" />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6" aria-labelledby="faq-title">
        <Reveal>
          <SectionTitle eyebrow="Preguntas frecuentes" title="Antes de visitarnos" />
        </Reveal>
        <div className="mt-6 space-y-3">
          {faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 80}>
              <details className="faq rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
                <summary className="flex items-center justify-between gap-3 font-semibold">
                  {f.q}
                  <Icon name="arrow" className="h-4 w-4 text-sage" />
                </summary>
                <p className="mt-3 text-ink-soft">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button href="/agendar" variant="primary">
              Agendar una cita
            </Button>
            <Button href="/servicios" variant="ghost">
              Ver servicios
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
