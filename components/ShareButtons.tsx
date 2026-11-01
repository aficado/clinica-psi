"use client";

import { useEffect, useState } from "react";
import { clinic } from "@/lib/data";
import { waLink } from "@/lib/utils";
import { Icon } from "./ui";

/**
 * Compartir recurso/artículo (epico E3): WhatsApp + copiar enlace.
 * La URL se resuelve en el cliente para que sea la real.
 */
export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* sin permisos de clipboard */
    }
  }

  const waText = `${title} — ${clinic.name}. ${url}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-ink-soft">Compartir:</span>
      {url ? (
        <a
          href={waLink(clinic.whatsappNumber, waText)}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-sage px-4 py-2 font-semibold text-white no-underline transition-colors hover:bg-sage-dark"
        >
          <Icon name="whatsapp" className="h-4 w-4" />
          WhatsApp
        </a>
      ) : null}
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) border border-ink/15 bg-white px-4 py-2 font-semibold text-ink transition-colors hover:bg-mist"
      >
        <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
        {copied ? "Enlace copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}
