"use client";

// ============================================================
// BIBLIOTECA DE MEDIOS — R3-B (8.06)
//
// Componente de cliente: subir/reemplazar/eliminar imágenes con barra
// de progreso, enlazar videos YouTube/Vimeo, y gestionar medios.
//
// - Subida: XMLHttpRequest (para escuchar el progreso) →
//   `POST /api/media/upload` (RBAC: solo admin).
// - Videos: server action `addVideo` (valida URL YouTube/Vimeo).
// - Eliminar: server action `removeMedia` (confirma; avisa si está
//   referenciado).
// ============================================================

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui";
import { RoleGuard } from "@/components/admin/RoleGuard";
import { MAX_UPLOAD_BYTES, mediaToView } from "@/lib/media-core";
import { addVideo, listMedia, removeMedia, restoreMedia } from "@/lib/multimedia/actions";
import { formatDateMX } from "@/lib/utils";
import { MediaEmbed } from "@/components/admin/MediaEmbed";
import type { MediaAssetRow } from "@/lib/db";

type MediaView = ReturnType<typeof mediaToView>;

const ALLOWED_HINT = "JPEG, PNG, WEBP, GIF o SVG";

export function MediaLibrary({ initial }: { initial: ReturnType<typeof mediaToView>[] }) {
  const [items, setItems] = useState<MediaView[]>(initial);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Último medio borrado (borrado blando, 8.13): permite "Deshacer".
  const [lastDeleted, setLastDeleted] = useState<{ id: string; name: string } | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);

  // Subida
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function refresh() {
    setItems(await listMedia());
  }

  /* ---------- Subida con barra de progreso ---------- */

  async function uploadFiles(files: FileList | File[]) {
    setError(null);
    setUploadError(null);
    setUploadDone(false);
    const file = Array.from(files)[0];
    if (!file) return;

    // Validación del cliente (lenguaje claro) antes de subir.
    const badType = !/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.type || "");
    if (badType) {
      setUploadError(`Ese tipo de archivo no es válido. Sube una imagen (${ALLOWED_HINT}).`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(`El archivo pesa demasiado (máximo 5 MB). Prueba con una imagen más pequeña.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/media/upload");
        // Progreso de subida en tiempo real (barra).
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.error ?? `Error ${xhr.status}`));
            } catch {
              reject(new Error(`Error ${xhr.status} al subir el archivo.`));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Error de conexión al subir el archivo."));
        xhr.send(formData);
      });

      setProgress(100);
      setUploadDone(true);
      await refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "No se pudo subir el archivo. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length) uploadFiles(files);
    e.target.value = ""; // permite subir el mismo archivo de nuevo
  }

  function onDrag(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(e.dataTransfer.types.includes("Files"));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  /* ---------- Enlazar video ---------- */

  async function onAddVideo(e: FormEvent) {
    e.preventDefault();
    setVideoError(null);
    setVideoBusy(true);
    try {
      const res = await addVideo(videoUrl);
      if (res.error) {
        setVideoError(res.error);
      } else {
        setVideoUrl("");
        await refresh();
      }
    } finally {
      setVideoBusy(false);
    }
  }

  /* ---------- Eliminar (blando, con "Deshacer") ---------- */

  async function onRemove(id: string) {
    const asset = items.find((a) => a.id === id);
    if (!asset) return;
    // Confirmar antes de eliminar; avisar si el medio está referenciado.
    const message = asset.references.length
      ? `"${asset.name}" está en uso en ${asset.references.join(", ")}. Retíralo de ahí antes de eliminarlo.`
      : `¿Eliminar "${asset.name}"? Podrás deshacerlo desde el aviso que aparece justo después.`;
    if (!window.confirm(message)) return;
    setDeletingId(id);
    try {
      const res = await removeMedia(id);
      if (res.error) {
        setError(res.error);
      } else {
        setLastDeleted({ id, name: asset.name });
        await refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function onUndo() {
    if (!lastDeleted) return;
    setUndoBusy(true);
    try {
      const res = await restoreMedia(lastDeleted.id);
      if (res.error) {
        setError(res.error);
      } else {
        setLastDeleted(null);
        await refresh();
      }
    } finally {
      setUndoBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {lastDeleted ? (
        /* Aviso de borrado con "Deshacer" (8.13) */
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-(--radius-card) border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-ink lg:col-span-5"
        >
          <p>
            Se eliminó <strong>{lastDeleted.name}</strong>. Puedes restaurarlo mientras no se
            purguen los borrados.
          </p>
          <button
            type="button"
            onClick={onUndo}
            disabled={undoBusy}
            className="btn inline-flex min-h-11 items-center gap-2 rounded-(--radius-btn) bg-sage px-4 py-2 font-semibold text-white no-underline hover:bg-sage-dark disabled:opacity-60"
          >
            <Icon name="arrow" className="h-4 w-4 rotate-180" />
            {undoBusy ? "Restaurando…" : "Deshacer"}
          </button>
        </div>
      ) : null}
      {/* Panel de subida / enlace */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        <RoleGuard rolesPermitidos={["admin"]}>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">Subir una imagen</h2>

            {/* Zona de arrastrar/soltar */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragEnter={onDrag}
              onDragOver={onDrag}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              aria-label="Subir una imagen"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-(--radius-input) border-2 border-dashed px-4 py-8 text-center transition-colors",
                dragOver ? "border-sage bg-sage/5" : "border-ink/15 hover:border-sage/50",
              )}
            >
              <Icon name="download" className="h-8 w-8 text-ink-soft" />
              <p className="mt-3 text-sm text-ink-soft">
                Arrastra una imagen aquí o <span className="font-semibold text-sage">explora</span>
              </p>
              <p className="mt-1 text-xs text-ink-soft">JPEG, PNG, WEBP, GIF o SVG · máx. 5 MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={onInputChange}
                className="hidden"
                aria-hidden="true"
              />
            </div>

            {/* Progreso */}
            {uploading || uploadDone || uploadError ? (
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-mist">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", uploadDone ? "bg-sage" : "bg-terracotta")}
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">
                  {uploadDone
                    ? "Imagen subida ✓"
                    : uploadError
                      ? uploadError
                      : `Subiendo… ${progress}%`}
                </p>
                {uploadError ? (
                  <div role="alert" className="mt-2 rounded-(--radius-input) bg-terracotta/10 px-3 py-2 text-sm text-terracotta-dark">
                    {uploadError}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </RoleGuard>

        {/* Enlazar video */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Enlazar un video</h2>
          <form onSubmit={onAddVideo} className="flex flex-col gap-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Enlace de YouTube o Vimeo</span>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className="h-12 rounded-(--radius-input) border border-ink/15 bg-white px-3 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
              />
            </label>
            <button
              type="submit"
              disabled={videoBusy || !videoUrl.trim()}
              className="inline-flex min-h-11 items-center justify-center rounded-(--radius-btn) bg-sage px-4 text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
            >
              {videoBusy ? "Guardando…" : "Añadir video"}
            </button>
            {videoError ? (
              <div role="alert" className="rounded-(--radius-input) bg-terracotta/10 px-3 py-2 text-sm text-terracotta-dark">
                {videoError}
              </div>
            ) : null}
          </form>
        </div>
      </div>

      {/* Cuadrícula de medios */}
      <div className="lg:col-span-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Medios ({items.length})</h2>
        </div>

        {items.length === 0 ? (
          <p className="rounded-(--radius-input) bg-mist px-3 py-4 text-sm text-ink-soft">
            Aún no hay medios. Sube una imagen o enlaza un video para empezar.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                onRemove={onRemove}
                deleting={deletingId === asset.id}
              />
            ))}
          </div>
        )}

        {error ? (
          <div role="alert" className="mt-4 rounded-(--radius-input) bg-terracotta/10 px-3 py-2 text-sm text-terracotta-dark">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Tarjeta de medio ---------- */

function MediaCard({
  asset,
  onRemove,
  deleting,
}: {
  asset: MediaView;
  onRemove: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <li className="overflow-hidden rounded-(--radius-card) border border-ink/10 bg-white shadow-[0_4px_16px_rgba(31,42,39,0.06)]">
      <div className="bg-ink/95">
        {asset.kind === "video" ? (
          <MediaEmbed
            url={asset.embedUrl ?? ""}
            title={asset.name}
            provider={asset.videoProvider}
          />
        ) : (
          <img src={asset.url} alt={asset.name} className="aspect-video w-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{asset.name}</p>
          <p className="text-xs text-ink-soft">
            {asset.kind === "video" ? asset.videoProvider : asset.mime} · {formatDateMX(new Date(asset.createdAt).toLocaleDateString("en-CA"))}
          </p>
        </div>
        <RoleGuard rolesPermitidos={["admin"]}>
          <button
            type="button"
            onClick={() => onRemove(asset.id)}
            disabled={deleting}
            className="inline-flex shrink-0 items-center gap-1 rounded-(--radius-btn) px-2 py-1 text-xs font-semibold text-terracotta-dark transition-colors hover:bg-terracotta/10 disabled:opacity-50"
            aria-label={`Eliminar ${asset.name}`}
          >
            <Icon name="close" className="h-4 w-4" />
            {deleting ? "…" : "Eliminar"}
          </button>
        </RoleGuard>
      </div>
    </li>
  );
}

// Reexport para tipado interno.
export type { MediaAssetRow };
