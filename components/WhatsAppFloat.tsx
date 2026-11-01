import { clinic } from "@/lib/data";
import { waLink } from "@/lib/utils";
import { Icon } from "./ui";

/**
 * Botón flotante de WhatsApp (PROMPT §4.1).
 * Fase 1: enlace wa.me con mensaje precargado.
 * Fase 2: WhatsApp Business API.
 */
export function WhatsAppFloat() {
  return (
    <a
      href={waLink(clinic.whatsappNumber, `Hola, me gustaría saber más sobre ${clinic.name}.`)}
      target="_blank"
      rel="noopener"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-4 right-4 z-30 flex min-h-14 min-w-14 items-center justify-center rounded-full bg-sage p-3.5 text-white shadow-lg transition-transform duration-200 hover:scale-105"
    >
      <Icon name="whatsapp" className="h-7 w-7" />
    </a>
  );
}
