"use client";

import { useState } from "react";
import type { Course } from "@/lib/data";
import { clinic } from "@/lib/data";
import { waLink } from "@/lib/utils";
import { Button, TodoChip } from "./ui";

interface Enrollment {
  token: string;
  courseSlug: string;
  courseTitle: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
}

const LS_KEY = "rv_enrollments";

function loadEnrollments(): Enrollment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as Enrollment[];
  } catch {
    return [];
  }
}

/**
 * Solicitud de cupo para cursos (Fase 1–2, demo).
 * Guarda la solicitud en el navegador; la confirmación por email y el
 * pago en línea llegan en la Fase 5 (Resend + Mercado Pago).
 */
export function EnrollmentForm({ course }: { course: Course }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Enrollment | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError("Escribe tu nombre completo (al menos 3 letras).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Escribe un correo electrónico válido.");
      return;
    }
    const token = `rv-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const enrollment: Enrollment = {
      token,
      courseSlug: course.slug,
      courseTitle: course.title,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    const all = loadEnrollments();
    all.push(enrollment);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(all));
    } catch {
      setError("No pudimos guardar la solicitud en este navegador.");
      return;
    }
    setError(null);
    setDone(enrollment);
  }

  if (done) {
    const waText = `Hola, acabo de solicitar cupo para el curso "${done.courseTitle}". Mi nombre es ${done.name} (${done.email}${done.phone ? `, ${done.phone}` : ""}). Referencia: ${done.token}.`;
    return (
      <div className="space-y-4" role="status">
        <p className="flex items-center gap-2 text-xl font-semibold text-sage-dark">
          <span aria-hidden="true">✓</span>
          Tu solicitud quedó registrada
        </p>
        <p className="text-ink-soft">
          Te contactaremos para confirmar el cupo y el pago. Por ahora la confirmación se hace
          por WhatsApp.
        </p>
        <p className="rounded-(--radius-btn) bg-mist px-4 py-3 text-sm text-ink-soft">
          <TodoChip>TODO: confirmación por email (Resend) y pago en línea (Mercado Pago) en la Fase 5</TodoChip>
        </p>
        <p className="text-sm text-ink-soft">
          Referencia de tu solicitud:{" "}
          <span className="rounded bg-sand px-2 py-0.5 font-mono">{done.token}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={waLink(clinic.whatsappNumber, waText)}
            target="_blank"
            rel="noopener"
            className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-terracotta px-5 py-2.5 font-semibold text-ink no-underline hover:bg-terracotta-dark"
          >
            Confirmar por WhatsApp
          </a>
          <Button variant="ghost" onClick={() => setDone(null)}>
            Hacer otra solicitud
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error ? (
        <p
          role="alert"
          className="rounded-(--radius-btn) bg-terracotta/15 px-4 py-3 text-sm font-medium text-terracotta-dark"
        >
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="en-nombre" className="mb-1 block text-sm font-semibold">
          Nombre completo
        </label>
        <input
          id="en-nombre"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
        />
      </div>

      <div>
        <label htmlFor="en-correo" className="mb-1 block text-sm font-semibold">
          Correo electrónico
        </label>
        <input
          id="en-correo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
        />
      </div>

      <div>
        <label htmlFor="en-telefono" className="mb-1 block text-sm font-semibold">
          Teléfono <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <input
          id="en-telefono"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="55 1234 5678"
          className="w-full min-h-11 rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
        />
      </div>

      <div>
        <label htmlFor="en-notas" className="mb-1 block text-sm font-semibold">
          Notas <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <textarea
          id="en-notas"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="¿Algo que debamos saber antes del curso?"
          className="w-full rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2.5"
        />
      </div>

      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        Solicitar cupo
      </Button>
      <p className="text-xs text-ink-soft">
        Al enviar aceptas nuestro aviso de privacidad. La solicitud se guarda en este
        navegador (demo) y la confirmación llega por WhatsApp.
      </p>
    </form>
  );
}
