"use client";

// ============================================================
// EMBED DE VIDEO (admin) — R3-B (8.06)
//
// Reproductor embebido para YouTube y Vimeo en la biblioteca de
// medios. Se elige el origen según `provider`.
// ============================================================

import { cn } from "@/lib/utils";

export function MediaEmbed({
  url,
  title,
  provider,
}: {
  url: string;
  title: string;
  provider: "youtube" | "vimeo" | null;
}) {
  // Vimeo usa su propio reductor; YouTube, la versión nocookie.
  const src =
    provider === "vimeo"
      ? `${url}?dnt=true`
      : `${url.replace("youtube.com/embed/", "youtube-nocookie.com/embed/")}`;
  const allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  return (
    <div className="aspect-video w-full overflow-hidden rounded-(--radius-card)">
      <iframe
        className={cn("h-full w-full")}
        src={src}
        title={title}
        allow={allow}
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
