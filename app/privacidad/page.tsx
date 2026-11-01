import type { Metadata } from "next";
import { clinic } from "@/lib/data";
import { SectionTitle, TodoChip } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Aviso de privacidad de la clínica: datos que recopilamos, cómo los usamos y tus derechos (LFPDPPP).",
};

const sections = [
  {
    h: "1. Responsable del tratamiento",
    ps: [
      "El responsable del tratamiento de tus datos personales es la clínica (TODO: razón social, RFC y domicilio legal reales).",
      "Puedes contactarnos en: " + clinic.address + " · " + clinic.email + " (TODO: confirmar datos legales).",
    ],
  },
  {
    h: "2. Datos que recopilamos",
    ps: [
      "Datos de contacto: nombre, teléfono y correo electrónico, que nos compartes al agendar una cita o al escribirnos.",
      "Datos de salud: la información que compartes durante las sesiones y evaluaciones (historia clínica, síntomas, hábitos). Estos datos son sensibles y reciben protección reforzada.",
      "Datos de pago: únicamente los que genera el procesador de pagos (Mercado Pago) al realizar una compra; nosotros no almacenamos números de tarjeta.",
    ],
  },
  {
    h: "3. Finalidades del tratamiento",
    ps: [
      "Gestionar tu cita: confirmar, recordar y reprogramar tus sesiones.",
      "Brindarte el servicio contratado: acompañamiento terapéutico, manual, de medicina china o nutricional.",
      "Cumplir obligaciones legales y de seguridad (por ejemplo, protección de menores o prevención de riesgos).",
      "Mejorar nuestro servicio: análisis anónimo de uso del sitio (sin identificar a las personas).",
    ],
  },
  {
    h: "4. Base legal",
    ps: [
      "Tu consentimiento expreso al agendar o al aceptar este aviso, y el cumplimiento de obligaciones contractuales y legales.",
      "En el caso de datos de salud, el consentimiento es específico y puedes revocarlo en cualquier momento, con los límites que marca la ley.",
    ],
  },
  {
    h: "5. Tus derechos (ARCO y más)",
    ps: [
      "Acceso: conocer qué datos guardamos sobre ti.",
      "Rectificación: corregir datos que estén mal.",
      "Cancelación: que dejemos de usar tus datos para las finalidades que tú indiques (con las limitaciones legales aplicables, por ejemplo los archivos clínicos).",
      "Oposición: oponerte a usos que no estés de acuerdo con.",
      "Revocación de consentimiento y rectificación, cancelación y oposición (derechos ARCO), además de la revocación del consentimiento en cualquier momento.",
      "También puedes solicitar la portabilidad de tus datos, conforme a la Ley Federal de Protección de Datos Personales en el Tratamiento de Datos Personales (LFPDPPP).",
    ],
  },
  {
    h: "6. Cómo se protegen tus datos",
    ps: [
      "Acceso limitado: solo el profesional que atiende tu caso y el personal de administración pueden ver tu información.",
      "Residencia y seguridad: la información se almacena en almacenamiento experimental con control de acceso por rol (TODO: detalles técnicos).",
      "No vendemos ni compartimos tus datos con terceros con fines comerciales. Solo se comparten con proveedores esenciales (pagos, correo) bajo acuerdos de tratamiento.",
    ],
  },
  {
    h: "7. Compartición de datos",
    ps: [
      "Mercado Pago: procesa tus pagos; solo recibe lo necesario para cobrar y no almacena tu información clínica.",
      "Resend (servicio de correo): envía las confirmaciones y recordatorios de cita; no accede a tu información clínica.",
      "Derivaciones: solo compartimos información clínica con otro profesional si tú lo autorizas por escrito.",
    ],
  },
  {
    h: "8. Vigencia y cambios",
    ps: [
      "Este aviso es de ejemplo y se actualizará cuando cambien los servicios, los proveedores o la normativa (TODO: fecha de publicación real y versión).",
      "Si hay cambios importantes, lo comunicaremos por correo o en el sitio antes de aplicarlos.",
    ],
  },
  {
    h: "9. Contacto para ejercicio de derechos",
    ps: [
      "Escríbenos a " + clinic.email + " o a través del formulario de contacto indicando el derecho que deseas ejercer y una identificación.",
      "El plazo de respuesta es el que marca la LFPDPPP (TODO: confirmar plazos con asesoría legal).",
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <>
      <section className="bg-mist" aria-labelledby="priv-title">
        <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="Legal"
              title="Aviso de privacidad"
              description="Cómo recopilamos, usamos y protegemos tu información."
            />
            <p className="mt-4 rounded-(--radius-btn) border border-dashed border-terracotta/70 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark">
              <TodoChip>TODO</TodoChip>
              <span className="ml-2">
                Este texto es de ejemplo: antes de publicarlo debe revisarse con asesoría legal y completarse
                con los datos legales reales de la clínica.
              </span>
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-8">
          {sections.map((s, i) => (
            <Reveal key={s.h} delay={Math.min(i, 4) * 70}>
              <section aria-labelledby={`priv-${i}`}>
                <h2 id={`priv-${i}`} className="text-2xl">
                  {s.h}
                </h2>
                {s.ps.map((p, j) => (
                  <p key={j} className="mt-3 text-ink-soft">
                    {p}
                  </p>
                ))}
              </section>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
