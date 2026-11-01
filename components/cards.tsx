import Link from "next/link";
import type { Article, Course, FreeResource, Service } from "@/lib/data";
import { articleCategories, courseThemes, resourceCategories, serviceCategories } from "@/lib/data";
import { cn, formatDateMX, readingTime } from "@/lib/utils";
import { Button, Card, Chip, Icon } from "./ui";

type CatList = Array<{ key: string; label: string }>;

export function categoryLabel(list: CatList, key: string): string {
  return list.find((c) => c.key === key)?.label ?? key;
}

/** Poster por categoría (SVG local; los videos propios se publican en /gratis). */
export function posterSrc(category: string): string {
  return `/images/poster-${category}.svg`;
}

/* ---------- Recurso gratuito ---------- */

export function ResourceCard({ r }: { r: FreeResource }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/gratis/${r.slug}`} className="block" aria-label={`Ver recurso: ${r.title}`}>
        <img
          src={posterSrc(r.category)}
          alt=""
          width={640}
          height={360}
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <Chip>{categoryLabel(resourceCategories, r.category)}</Chip>
          <Chip>{r.minutes} min</Chip>
          <Chip className="capitalize">{r.level}</Chip>
        </div>
        <h3 className="text-xl leading-snug">
          <Link href={`/gratis/${r.slug}`} className="no-underline transition-colors hover:text-sage">
            {r.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-ink-soft">{r.description}</p>
        <Link
          href={`/gratis/${r.slug}`}
          className="mt-auto inline-flex items-center gap-1 font-semibold text-sage no-underline hover:text-sage-dark"
        >
          Ver recurso
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}

/* ---------- Artículo ---------- */

export function ArticleCard({ a }: { a: Article }) {
  const words = a.sections.map((s) => s.paragraphs.join(" ")).join(" ");
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <Chip>{categoryLabel(articleCategories, a.category)}</Chip>
        <span>{formatDateMX(a.date)}</span>
        <span aria-hidden="true">·</span>
        <span>{readingTime(words)} min de lectura</span>
      </div>
      <h3 className="text-xl leading-snug">
        <Link href={`/aprende/${a.slug}`} className="no-underline transition-colors hover:text-sage">
          {a.title}
        </Link>
      </h3>
      <p className="line-clamp-3 text-ink-soft">{a.excerpt}</p>
      <Link
        href={`/aprende/${a.slug}`}
        className="mt-auto inline-flex items-center gap-1 font-semibold text-sage no-underline hover:text-sage-dark"
      >
        Leer artículo
        <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </Card>
  );
}

/* ---------- Servicio ---------- */

export function ServiceCard({ s }: { s: Service }) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <Chip>{categoryLabel(serviceCategories, s.category)}</Chip>
      <h3 className="text-xl leading-snug">
        <Link href={`/servicios/${s.slug}`} className="no-underline transition-colors hover:text-sage">
          {s.name}
        </Link>
      </h3>
      <p className="line-clamp-3 text-ink-soft">{s.description}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <Icon name="clock" className="h-4 w-4" />
          {s.duration} min
        </span>
        {s.modalities.map((m) => (
          <Chip key={m}>{m === "enlinea" ? "En línea" : "Presencial"}</Chip>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button href={`/servicios/${s.slug}`} variant="ghost" className="px-4">
          Ver detalle
        </Button>
        <Button href={`/agendar?service=${s.slug}`} variant="primary" className="px-4">
          Agendar
        </Button>
      </div>
    </Card>
  );
}

/* ---------- Curso ---------- */

export function CourseCard({ c }: { c: Course }) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <div className="flex flex-wrap gap-2">
        <Chip>{categoryLabel(courseThemes, c.theme)}</Chip>
        <Chip>{c.weeks} semanas</Chip>
        <Chip>{c.modality === "enlinea" ? "En línea" : "Presencial"}</Chip>
      </div>
      <h3 className="text-xl leading-snug">
        <Link href={`/cursos/${c.slug}`} className="no-underline transition-colors hover:text-sage">
          {c.title}
        </Link>
      </h3>
      <p className="line-clamp-3 text-ink-soft">{c.description}</p>
      <div className="flex flex-wrap gap-2 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <Icon name="calendar" className="h-4 w-4" />
          {c.schedule}
        </span>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Button href={`/cursos/${c.slug}`} variant="secondary" className="px-4">
          Ver curso
        </Button>
        <Chip className={cn("border border-dashed border-terracotta/70 bg-terracotta/10 text-terracotta-dark")}>
          {c.price}
        </Chip>
      </div>
    </Card>
  );
}
