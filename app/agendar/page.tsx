import type { Metadata } from "next";
import { BookingFlow } from "@/components/BookingFlow";
import { Reveal } from "@/components/Reveal";
import { getProfessionals } from "@/lib/professionals";
import { getServices } from "@/lib/content";
import { asString } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Agendar una cita",
  description:
    "Elige el servicio, la modalidad y el horario, y agenda tu cita sin registro previo. Te confirmamos por WhatsApp.",
};

export const dynamic = "force-dynamic";

export default async function AgendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const service = asString(params.service);
  const mode = asString(params.mode);
  const pro = asString(params.pro);
  const dia = asString(params.dia);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Reveal>
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-sage">
          Agendar
        </p>
        <h1 className="text-3xl leading-tight sm:text-4xl">Agenda tu cita en cuatro pasos</h1>
        <p className="mt-3 text-ink-soft">
          Sin registro previo. Eliges servicio, modalidad, profesional y horario, y al final
          confirmas por WhatsApp o con tu correo.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          <span className="font-medium">Nota:</span> tu cita queda registrada de verdad en la
          agenda de la clínica y puedes administrarla desde el enlace que te damos. Los horarios
          de atención son de muestra mientras llegan los datos reales, y la confirmación por
          correo está pendiente de activarse: por ahora la señal llega por WhatsApp.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <div className="mt-8">
          <BookingFlow
            initial={{
              service: service && service !== "" ? service : undefined,
              mode: mode && mode !== "" ? mode : undefined,
              pro: pro && pro !== "" ? pro : undefined,
              dia: /^\d{4}-\d{2}-\d{2}$/.test(dia ?? "") ? dia : undefined,
            }}
            services={getServices()}
            professionals={getProfessionals()}
          />
        </div>
      </Reveal>
    </div>
  );
}
