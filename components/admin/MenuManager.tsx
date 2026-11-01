"use client";

// ============================================================
// MENÚ Y REDES — R3-D (8.11)
//
// Elementos del menú de navegación (header/footer) y perfiles de
// redes sociales (site_settings). Solo administrador; las flechas
// reordenan con `moveNavItem`. Borrar es blando con "Deshacer".
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NavItemView, SiteSettings } from "@/lib/content";
import {
  deleteNavItem,
  moveNavItem,
  restoreNavItem,
  saveMap,
  saveNavItem,
  saveSocials,
} from "@/lib/content/actions";
import { Icon } from "@/components/ui";
import { Chk, SaveBar, Sel, T } from "./content/ui";

export function MenuManager({
  navItems,
  settings,
}: {
  navItems: NavItemView[];
  settings: SiteSettings;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<{ id: string; label: string } | null>(null);
  const [draft, setDraft] = useState<{ id: string; label: string; href: string; visible: boolean } | null>(
    null,
  );
  const [socialDraft, setSocialDraft] = useState({ instagram: settings.instagram, facebook: settings.facebook });
  const [socialMsg, setSocialMsg] = useState<string | null>(null);
  // Mapa (8.15): tipo + consulta/URL; el tipo "" vuelve al placeholder.
  const [mapDraft, setMapDraft] = useState({
    mapType: settings.mapType as string,
    mapQuery: settings.mapQuery,
    mapUrl: settings.mapUrl,
  });
  const [mapMsg, setMapMsg] = useState<string | null>(null);

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
            Se eliminó <strong>{deleted.label}</strong> del menú. Puedes restaurarlo.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void run(async () => {
                const res = await restoreNavItem(deleted.id);
                if (res.ok) setDeleted(null);
                return res;
              });
            }}
            className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-sage px-4 py-2 font-semibold text-white no-underline hover:bg-sage-dark disabled:opacity-60"
          >
            <Icon name="arrow" className="h-4 w-4 rotate-180" />
            Deshacer
          </button>
        </div>
      ) : null}

      {/* ================= Menú ================= */}
      <section aria-labelledby="menu-h">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="menu-h" className="text-2xl font-semibold text-ink">
            Menú de navegación
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={() => setDraft({ id: "", label: "", href: "/", visible: true })}
            className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) bg-terracotta px-4 py-2 text-sm font-semibold text-ink no-underline hover:bg-terracotta-dark disabled:opacity-60"
          >
            + Nuevo elemento
          </button>
        </div>
        <p className="mb-4 text-sm text-ink-soft">
          Enlaces del encabezado y del pie. El primero suele ser «Inicio»; el pie omite el
          primero para no repetirlo.
        </p>

        {draft ? (
          <div className="mb-4 rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <T label="Texto" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} />
              <T
                label="Destino"
                value={draft.href}
                onChange={(v) => setDraft({ ...draft, href: v })}
                hint="Interno: «/servicios». Externo: «https://…»."
              />
            </div>
            <div className="mt-4">
              <Chk
                label="Visible"
                checked={draft.visible}
                onChange={(v) => setDraft({ ...draft, visible: v })}
              />
            </div>
            <SaveBar
              busy={busy}
              msg={null}
              saveLabel={draft.id ? "Guardar cambios" : "Crear elemento"}
              onSave={() => {
                void run(async () => {
                  const res = await saveNavItem({
                    id: draft.id || undefined,
                    label: draft.label,
                    href: draft.href,
                    visible: draft.visible,
                  });
                  if (res.ok) setDraft(null);
                  return res;
                });
              }}
              onCancel={() => setDraft(null)}
            />
          </div>
        ) : null}

        <ul className="flex flex-col gap-2">
          {navItems.map((n, i) => (
            <li
              key={n.id}
              className="flex flex-wrap items-center gap-3 rounded-(--radius-card) bg-white px-4 py-3 shadow-[0_1px_2px_rgba(31,42,39,0.06)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{n.label}</p>
                <p className="truncate text-xs text-ink-soft">{n.href}</p>
              </div>
              {!n.visible ? (
                <span className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  Oculto
                </span>
              ) : null}
              <span className="flex gap-1">
                <button
                  type="button"
                  className={btn}
                  disabled={busy || i === 0}
                  onClick={() => void run(() => moveNavItem(n.id, -1))}
                  aria-label={`Subir ${n.label}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={btn}
                  disabled={busy || i === navItems.length - 1}
                  onClick={() => void run(() => moveNavItem(n.id, 1))}
                  aria-label={`Bajar ${n.label}`}
                >
                  ↓
                </button>
              </span>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() => setDraft({ id: n.id, label: n.label, href: n.href, visible: n.visible })}
              >
                Editar
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-(--radius-btn) border border-terracotta/40 bg-white px-3 text-sm font-semibold text-terracotta-dark hover:bg-terracotta/10 disabled:opacity-40"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`¿Eliminar "${n.label}" del menú? Podrás deshacerlo.`)) return;
                  void run(async () => {
                    const res = await deleteNavItem(n.id);
                    if (res.ok) setDeleted({ id: n.id, label: n.label });
                    return res;
                  });
                }}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ================= Redes sociales ================= */}
      <section aria-labelledby="redes-h">
        <h2 id="redes-h" className="mb-4 text-2xl font-semibold text-ink">
          Redes sociales
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          Enlaces de contacto que se muestran en el pie del sitio. Déjalos vacíos para
          ocultarlos.
        </p>
        <div className="rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <T
              label="Instagram"
              value={socialDraft.instagram}
              onChange={(v) => setSocialDraft((s) => ({ ...s, instagram: v }))}
              placeholder="https://instagram.com/…"
            />
            <T
              label="Facebook"
              value={socialDraft.facebook}
              onChange={(v) => setSocialDraft((s) => ({ ...s, facebook: v }))}
              placeholder="https://facebook.com/…"
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void run(async () => {
                  const res = await saveSocials(socialDraft);
                  if (res.ok) setSocialMsg("Redes guardadas.");
                  else setSocialMsg(null);
                  return res;
                });
              }}
              className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) bg-sage px-5 py-2.5 font-semibold text-white no-underline hover:bg-sage-dark disabled:opacity-60"
            >
              {busy ? "Guardando…" : "Guardar redes"}
            </button>
            {socialMsg ? (
              <p role="status" className="text-sm font-semibold text-sage-dark">
                {socialMsg}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ================= Mapa (8.15) ================= */}
      <section aria-labelledby="mapa-h">
        <h2 id="mapa-h" className="mb-4 text-2xl font-semibold text-ink">
          Mapa
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          Mapa de la home y de Contacto. Como la dirección real aún no está definida, puedes
          cambiar el tipo y la URL cuando quieras sin tocar código; el tipo «placeholder» usa la
          dirección de ejemplo del seed.
        </p>
        <div className="rounded-(--radius-card) bg-white p-5 shadow-[0_1px_2px_rgba(31,42,39,0.06)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Sel
              label="Tipo de mapa"
              value={mapDraft.mapType}
              onChange={(v) => setMapDraft((s) => ({ ...s, mapType: v }))}
              options={[
                { key: "", label: "— Placeholder (dirección de ejemplo) —" },
                { key: "embed", label: "Google Maps (por dirección o lugar)" },
                { key: "iframe", label: "Iframe genérico (URL de insertar)" },
                { key: "link", label: "Solo enlace «Cómo llegar»" },
              ]}
            />
            {mapDraft.mapType === "embed" ? (
              <T
                label="Dirección o nombre del lugar"
                value={mapDraft.mapQuery}
                onChange={(v) => setMapDraft((s) => ({ ...s, mapQuery: v }))}
                placeholder="Av. Insurgentes Sur 200, CDMX"
              />
            ) : null}
            {mapDraft.mapType === "iframe" || mapDraft.mapType === "link" ? (
              <T
                label="URL"
                value={mapDraft.mapUrl}
                onChange={(v) => setMapDraft((s) => ({ ...s, mapUrl: v }))}
                placeholder="https://…"
                hint={
                  mapDraft.mapType === "iframe"
                    ? "URL de insertar del mapa (src del iframe)."
                    : "Destino del botón «Cómo llegar»."
                }
              />
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void run(async () => {
                  const res = await saveMap(mapDraft);
                  if (res.ok) setMapMsg("Mapa guardado.");
                  else setMapMsg(null);
                  return res;
                });
              }}
              className="btn inline-flex min-h-11 items-center rounded-(--radius-btn) bg-sage px-5 py-2.5 font-semibold text-white no-underline hover:bg-sage-dark disabled:opacity-60"
            >
              {busy ? "Guardando…" : "Guardar mapa"}
            </button>
            {mapMsg ? (
              <p role="status" className="text-sm font-semibold text-sage-dark">
                {mapMsg}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
