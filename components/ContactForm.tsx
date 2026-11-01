"use client";

import { useState } from "react";
import { clinic } from "@/lib/data";
import { waLink } from "@/lib/utils";
import { Button } from "./ui";

/**
 * Formulario de contacto (Fase 1–2, demo).
 * Envía el mensaje por WhatsApp porque aún no hay backend.
 * TODO (Fase 4): guardar en el almacenamiento real y responder por email (Resend).
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Escribe tu nombre (al menos 2 caracteres).");
      return;
    }
    if (message.trim().length < 10) {
      setError("Cuéntanos un poco más: escribe al menos 10 caracteres.");
      return;
    }
    const text = `Hola, soy ${name.trim()}. ${message.trim()}${phone.trim() ? ` Mi teléfono es ${phone.trim()}.` : ""}`;
    window.location.href = waLink(clinic.whatsappNumber, text);
    setSent(true);
    setError(null);
  }

  if (sent) {
    return (
      <div className="rounded-(--radius-card) bg-mist p-6" role="status">
        <p className="flex items-center gap-2 font-semibold text-sage-dark">
          <span aria-hidden="true">✓</span>
          Tu mensaje fue enviado por WhatsApp
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Te responderemos lo antes posible. Si no recibes respuesta, vuelve a intentarlo o escríbenos directamente.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error ? (
        <p role="alert" className="rounded-(--radius-btn) bg-terracotta/15 px-4 py-3 text-sm font-medium text-terracotta-dark">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="cf-nombre" className="mb-1 block text-sm font-semibold">
          Nombre
        </label>
        <input
          id="cf-nombre"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="cf-telefono" className="mb-1 block text-sm font-semibold">
          Teléfono <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <input
          id="cf-telefono"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
          autoComplete="tel"
          placeholder="55 1234 5678"
        />
      </div>

      <div>
        <label htmlFor="cf-mensaje" className="mb-1 block text-sm font-semibold">
          Mensaje
        </label>
        <textarea
          id="cf-mensaje"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
          placeholder="¿Qué te gustaría resolver o saber?"
        />
      </div>

      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        Enviar por WhatsApp
      </Button>
      <p className="text-xs text-ink-soft">
        Al enviar aceptas nuestro aviso de privacidad. La respuesta suele llegar en horario de oficina.
      </p>
    </form>
  );
}
