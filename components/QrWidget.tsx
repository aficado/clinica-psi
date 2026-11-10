"use client";

import { useEffect, useState } from "react";
import { Button, Icon } from "./ui";

/**
 * Genera el QR del enlace único (bloque I / epico E7) en el navegador.
 * TODO (Fase 3): los códigos personalizados (nombre, color) se gestionan en el admin.
 */
export function QrWidget({ url, label }: { url: string; label: string }) {
  const [png, setPng] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const QRCode = (await import("qrcode")).default;
        if (!alive) return;
        const pngData = await QRCode.toDataURL(url, {
          width: 480,
          margin: 2,
          color: { dark: "#1f2a27", light: "#ffffff" },
        });
        const svgData = await QRCode.toString(url, { type: "svg", margin: 2, color: { dark: "#1f2a27", light: "#ffffff" } });
        if (alive) {
          setPng(pngData);
          setSvg(svgData);
        }
      } catch {
        if (alive) setError(true);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(true);
    }
  }

  function download(name: string, data: string) {
    const a = document.createElement("a");
    a.href = data;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        {png ? (
          <img
            src={png}
            alt={`Código QR que apunta a ${label}`}
            width={240}
            height={240}
            className="h-60 w-60 rounded-(--radius-card) border border-ink/15 bg-white p-3"
          />
        ) : error ? (
          <p className="text-sm text-terracotta-dark">No se pudo generar el código QR en este navegador.</p>
        ) : (
          <p className="text-sm text-ink-soft">Generando QR…</p>
        )}
        <div className="flex gap-2">
          {png ? (
            <Button onClick={() => download("qr-link.png", png)} variant="ghost" className="px-3">
              <Icon name="download" className="h-4 w-4" /> PNG
            </Button>
          ) : null}
          {svg ? (
            <Button onClick={() => download("qr-link.svg", svg)} variant="ghost" className="px-3">
              <Icon name="download" className="h-4 w-4" /> SVG
            </Button>
          ) : null}
        </div>
      </div>
      <div>
        <h2 className="text-2xl">Tu enlace</h2>
        <p className="mt-2 text-ink-soft">
          Compártelo en tus redes, en la bio o impreso en material: quien lo abra llega directo a {label}.
        </p>
        <p className="mt-4 break-all rounded-(--radius-btn) bg-mist px-4 py-3 font-mono text-sm text-sage-dark">
          {url}
        </p>
        <div className="mt-3 flex gap-2">
          <Button onClick={copyLink} variant="secondary" className="px-4">
            <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
            {copied ? "Copiado" : "Copiar enlace"}
          </Button>
        </div>
      </div>
    </div>
  );
}
