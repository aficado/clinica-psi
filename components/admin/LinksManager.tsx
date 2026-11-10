"use client";

// ============================================================
// GESTOR DE ENLACES — R3-C (7.01 / 7.03)
//
// Dos secciones: los botones de la página `/links` (link_items) y los
// enlaces cortos `/c/<slug>` (short_links) con su QR (7.02). Solo el
// administrador los edita (validado también en las actions). Borrar es
// blando con "Deshacer" (8.13).
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LinkItemView, ShortLinkView } from "@/lib/content";
import {
  deleteLinkItem,
  deleteShortLink,
  moveLinkItem,
  restoreLinkItem,
  restoreShortLink,
  saveLinkItem,
  saveShortLink,
} from "@/lib/content/actions";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui";
import { QrWidget } from "@/components/QrWidget";
import { Chk, SaveBar, T } from "./content/ui";

type Deleted = { kind: "link" | "short"; id: string; name: string };

export function LinksManager({
  linkItems,
  shortLinks,
  siteBase,
}: {
  linkItems: LinkItemView[];
  shortLinks: ShortLinkView[];
  siteBase: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<Deleted | null>(null);

  // Botón en edición: id "" = nuevo.
  const [linkDraft, setLinkDraft] = useState<{
    id: string;
    label: string;
    href: string;
    isPrimary: boolean;
    visible: boolean;
  } | null>(null);

  // Enlace corto en creación/edición.
  const [shortDraft, setShortDraft] = useState<{ slug: string; target: string; label: string } | null>(
    null,
  );
  const [qrSlug, setQrSlug] = useState<string | null>(null);
  // QR del enlace único (/links): material del admin (ya no se muestra en público).
  const [qrMain, setQrMain] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "No se pudo completar la acción.");
      else router.refresh();
      return res.ok;
    } finally {
      setBusy(false);
    }
  }

  function undo() {
    if (!deleted) return;
    void run(async () => {
      const res =
        deleted.kind === "link" ? await restoreLinkItem(deleted.id) : await restoreShortLink(deleted.id);
      if (res.ok) setDeleted(null);
      return res;
    });
  }

  const btn =
    "inline-flex min-h-11 items-center rounded-(--radius-btn) border border-ink/15 bg-white px-3 text-sm font-semibold text-ink-soft hover:border-sage hover:text-sage disabled:opacity-40";

  return (
    <div className="flex flex-col gap-10">
      {error ? (
        <p role="alert" className="rounded-(--radius-input) bg-terracotta/10 px-4 py-3 text-sm font-semibold text-terracotta-dark">
          {error}
        </p>
      ) : null}

      {deleted ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-(--radius-card) border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-ink"
        >
          <p>
            Se eliminó <strong>{deleted.name}</strong>. Puedes restaurarlo mientras no se purguen
            los borrados.
          </p>
          <button
            type="button"
            onClick={undo}
            disabled={busy}
            className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-sage px-4 py-2 font-semibold text-white no-underline hover:bg-sage-dark disabled:opacity-60"
          >
            <Icon name="arrow" className="h-4 w-4 rotate-180" />
            Deshacer
          </button>
        </div>
      ) : null}

      {/* ================= Botones de /links ================= */}
      <section aria-labelledby="botones-h">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="botones-h" className="text-2xl font-semibold text-ink">
            Botones del enlace único
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={() => setLinkDraft({ id: "", label: "", href: "/", isPrimary: false, visible: true })}
            className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) bg-terracotta px-4 py-2 text-sm font-semibold text-ink no-underline hover:bg-terracotta-dark disabled:opacity-60"
          >
            + Nuevo botón
          </button>
        </div>
        <p className="mb-4 text-sm text-ink-soft">
          Los botones que aparecen en <a href="/links" className="font-semibold text-sage">{siteBase}/links</a>, en
          orden. Las flechas suben o bajan un botón.
        </p>

        {linkDraft ? (
          <div className="mb-4 rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <T
                label="Texto del botón"
                value={linkDraft.label}
                onChange={(v) => setLinkDraft({ ...linkDraft, label: v })}
              />
              <T
                label="Destino (URL o /ruta)"
                value={linkDraft.href}
                onChange={(v) => setLinkDraft({ ...linkDraft, href: v })}
                hint="Interno: «/agendar». Externo: «https://…». También vale «/c/agendar»."
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-6">
              <Chk
                label="Botón destacado"
                checked={linkDraft.isPrimary}
                onChange={(v) => setLinkDraft({ ...linkDraft, isPrimary: v })}
                hint="Se resalta con el color de acento."
              />
              <Chk
                label="Visible"
                checked={linkDraft.visible}
                onChange={(v) => setLinkDraft({ ...linkDraft, visible: v })}
              />
            </div>
            <SaveBar
              busy={busy}
              msg={null}
              saveLabel={linkDraft.id ? "Guardar cambios" : "Crear botón"}
              onSave={() => {
                void run(async () => {
                  const res = await saveLinkItem({
                    id: linkDraft.id || undefined,
                    label: linkDraft.label,
                    href: linkDraft.href,
                    isPrimary: linkDraft.isPrimary,
                    visible: linkDraft.visible,
                  });
                  if (res.ok) setLinkDraft(null);
                  return res;
                });
              }}
              onCancel={() => setLinkDraft(null)}
            />
          </div>
        ) : null}

        <ul className="flex flex-col gap-2">
          {linkItems.map((l, i) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center gap-3 rounded-(--radius-card) bg-white px-4 py-3 shadow-[0_1px_2px_rgba(31,42,39,0.06)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{l.label}</p>
                <p className="truncate text-xs text-ink-soft">{l.href}</p>
              </div>
              {l.isPrimary ? (
                <span className="rounded-full bg-terracotta/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-terracotta-dark">
                  Destacado
                </span>
              ) : null}
              {!l.visible ? (
                <span className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Oculto
                </span>
              ) : null}
              <span className="flex gap-1">
                <button
                  type="button"
                  className={btn}
                  disabled={busy || i === 0}
                  onClick={() => void run(() => moveLinkItem(l.id, -1))}
                  aria-label={`Subir ${l.label}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={btn}
                  disabled={busy || i === linkItems.length - 1}
                  onClick={() => void run(() => moveLinkItem(l.id, 1))}
                  aria-label={`Bajar ${l.label}`}
                >
                  ↓
                </button>
              </span>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  setLinkDraft({
                    id: l.id,
                    label: l.label,
                    href: l.href,
                    isPrimary: l.isPrimary,
                    visible: l.visible,
                  })
                }
              >
                Editar
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-(--radius-btn) border border-terracotta/40 bg-white px-3 text-sm font-semibold text-terracotta-dark hover:bg-terracotta/10 disabled:opacity-40"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`¿Eliminar el botón "${l.label}"? Podrás deshacerlo.`)) return;
                  void run(async () => {
                    const res = await deleteLinkItem(l.id);
                    if (res.ok) setDeleted({ kind: "link", id: l.id, name: `el botón "${l.label}"` });
                    return res;
                  });
                }}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>

        {/* QR del enlace único: solo el admin lo genera y descarga. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className={btn} onClick={() => setQrMain((v) => !v)}>
            <Icon name="qr" className="mr-1.5 h-4 w-4" />
            {qrMain ? "Ocultar QR de /links" : "QR del enlace único (/links)"}
          </button>
          <span className="text-sm text-ink-soft">
            Material para bio o impresión; no se muestra en la página pública.
          </span>
        </div>
        {qrMain ? (
          <div className="mt-4">
            <QrWidget url={`${siteBase}/links`} label="el enlace único /links" />
          </div>
        ) : null}
      </section>

      {/* ================= Enlaces cortos ================= */}
      <section aria-labelledby="cortos-h">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="cortos-h" className="text-2xl font-semibold text-ink">
            Enlaces cortos <code className="text-base font-normal text-ink-soft">/c/…</code>
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShortDraft({ slug: "", target: "/", label: "" })}
            className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) bg-terracotta px-4 py-2 text-sm font-semibold text-ink no-underline hover:bg-terracotta-dark disabled:opacity-60"
          >
            + Nuevo enlace corto
          </button>
        </div>
        <p className="mb-4 text-sm text-ink-soft">
          URL amigable para carteles y redes: <strong>{siteBase}/c/nombre</strong> redirige al
          destino que definas. Puedes reasignar el destino cuando quieras sin cambiar el enlace
          impreso.
        </p>

        {shortDraft ? (
          <div className="mb-4 rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
            <div className="grid gap-4 sm:grid-cols-3">
              <T
                label="Nombre corto"
                value={shortDraft.slug}
                onChange={(v) => setShortDraft({ ...shortDraft, slug: v })}
                hint="Solo minúsculas, números y guiones."
              />
              <T
                label="Destino"
                value={shortDraft.target}
                onChange={(v) => setShortDraft({ ...shortDraft, target: v })}
                hint="Interno («/agendar») o URL completa."
              />
              <T
                label="Descripción"
                value={shortDraft.label}
                onChange={(v) => setShortDraft({ ...shortDraft, label: v })}
              />
            </div>
            <SaveBar
              busy={busy}
              msg={null}
              saveLabel="Guardar enlace"
              onSave={() => {
                void run(async () => {
                  const res = await saveShortLink(shortDraft.slug, shortDraft.target, shortDraft.label);
                  if (res.ok) setShortDraft(null);
                  return res;
                });
              }}
              onCancel={() => setShortDraft(null)}
            />
          </div>
        ) : null}

        <ul className="flex flex-col gap-2">
          {shortLinks.map((s) => (
            <li
              key={s.slug}
              className="flex flex-wrap items-center gap-3 rounded-(--radius-card) bg-white px-4 py-3 shadow-[0_1px_2px_rgba(31,42,39,0.06)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">
                  {siteBase}/c/{s.slug}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  → {s.target}
                  {s.label ? ` · ${s.label}` : ""}
                </p>
              </div>
              <button
                type="button"
                className={cn(btn, qrSlug === s.slug && "border-sage text-sage")}
                disabled={busy}
                onClick={() => setQrSlug(qrSlug === s.slug ? null : s.slug)}
                aria-expanded={qrSlug === s.slug}
              >
                <Icon name="qr" className="mr-1.5 h-4 w-4" />
                {qrSlug === s.slug ? "Ocultar QR" : "Ver QR"}
              </button>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() => setShortDraft({ slug: s.slug, target: s.target, label: s.label })}
              >
                Editar
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-(--radius-btn) border border-terracotta/40 bg-white px-3 text-sm font-semibold text-terracotta-dark hover:bg-terracotta/10 disabled:opacity-40"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`¿Eliminar /c/${s.slug}? Podrás deshacerlo.`)) return;
                  void run(async () => {
                    const res = await deleteShortLink(s.slug);
                    if (res.ok) {
                      setDeleted({ kind: "short", id: s.slug, name: `el enlace /c/${s.slug}` });
                      if (qrSlug === s.slug) setQrSlug(null);
                    }
                    return res;
                  });
                }}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>

        {(() => {
          // El QR del corto apunta DIRECTO al destino (no al /c/…): así el
          // material impreso abre la URL final aunque el dominio corto no sea
          // alcanzable. Los destinos internos (/agendar) se completan con la base.
          const item = qrSlug ? shortLinks.find((s) => s.slug === qrSlug) : null;
          if (!item) return null;
          const url = /^https?:\/\//.test(item.target) ? item.target : `${siteBase}${item.target}`;
          return (
            <div className="mt-4">
              <QrWidget url={url} label={`el destino de /c/${item.slug}`} />
            </div>
          );
        })()}
      </section>
    </div>
  );
}
