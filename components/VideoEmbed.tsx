import { cn } from "@/lib/utils";

/**
 * Reproductor de video (YouTube) para recursos y artículos.
 * TODO: reemplazar por videos propios de la clínica cuando se publiquen.
 */
export function VideoEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-(--radius-card) bg-ink">
      <iframe
        className={cn("h-full w-full")}
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
