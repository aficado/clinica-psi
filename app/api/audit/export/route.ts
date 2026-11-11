// ============================================================
// EXPORTACIÓN DE AUDITORÍA — R4-B-AUDIT-2
//
// Descarga las entradas de `audit_logs` por rango de DÍAS y HORAS,
// en markdown o texto. Solo administrador. La UI visible de auditoría
// se retiró del panel; esta ruta alimenta el panel oculto
// `/admin/registro` (enlace discreto en la barra lateral).
// ============================================================

import { cookies } from "next/headers";
import { getSessionProfile } from "@/lib/admin/session";
import { canAdmin } from "@/lib/rbac";
import { getAuditLogsRange } from "@/lib/audit";
import { getSiteTimeZone } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "rv_admin_session";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Desfase (ms) de la zona del sitio en un instante dado. */
function tzOffsetMs(ms: number, tz: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms;
}

/** Fecha+hora de la zona del sitio → epoch ms (maneja el cambio de horario). */
function localToUtc(dateIso: string, hour: number, tz: string): number {
  const [y, m, d] = dateIso.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, 0, 0);
  const off1 = tzOffsetMs(guess, tz);
  const ms = guess - off1;
  const off2 = tzOffsetMs(ms, tz);
  return off2 === off1 ? ms : guess - off2;
}

/** Fecha y hora legibles en la zona del sitio. */
function fmt(ms: number, tz: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(ms));
}

function esc(v: string): string {
  return v.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export async function GET(request: Request): Promise<Response> {
  // RBAC: solo administrador (la herramienta es interna, no del panel diario).
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const profile = getSessionProfile(token);
  if (!profile || !canAdmin(profile.role)) {
    return new Response("No autorizado", { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const fromHour = Number(params.get("fromHour") ?? 0);
  const toHour = Number(params.get("toHour") ?? 23);
  const format = (params.get("format") ?? "md").toLowerCase() === "txt" ? "txt" : "md";

  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) {
    return new Response("Rango de fechas inválido (usa YYYY-MM-DD y desde ≤ hasta).", { status: 400 });
  }
  const hourOk = (h: number) => Number.isInteger(h) && h >= 0 && h <= 23;
  if (!hourOk(fromHour) || !hourOk(toHour) || (from === to && fromHour > toHour)) {
    return new Response("Rango de horas inválido (0–23 y, el mismo día, desde ≤ hasta).", { status: 400 });
  }

  const tz = getSiteTimeZone();
  const start = localToUtc(from, fromHour, tz);
  const end = localToUtc(to, toHour + 1, tz); // la hora final es inclusiva
  const rows = getAuditLogsRange(start, end);

  const rango = `${from} ${pad(fromHour)}:00 → ${to} ${pad(toHour)}:59 (${tz})`;
  let body: string;
  if (format === "md") {
    body =
      `# Auditoría — Raíz Viva\n\n` +
      `Rango: ${rango}\n` +
      `Registros: ${rows.length}\n\n` +
      `| Fecha y hora | Actor | Rol | Acción | Entidad | ID | Detalle |\n` +
      `|---|---|---|---|---|---|---|\n`;
    body += rows
      .map(
        (r) =>
          `| ${fmt(r.created_at, tz)} | ${esc(r.actor_email)} | ${esc(r.actor_role)} | ${esc(r.action)} | ${esc(r.entity)} | ${esc(r.entity_id ?? "")} | ${esc(r.detail ?? "")} |`,
      )
      .join("\n");
    body += "\n";
  } else {
    body =
      `AUDITORÍA — RAÍZ VIVA\n` +
      `Rango: ${rango}\n` +
      `Registros: ${rows.length}\n\n`;
    body += rows
      .map(
        (r) =>
          `${fmt(r.created_at, tz)} | ${r.actor_email} | ${r.actor_role} | ${r.action} | ${r.entity} | ${r.entity_id ?? ""} | ${(r.detail ?? "").replace(/\r?\n/g, " ")}`,
      )
      .join("\n");
    body += "\n";
  }

  const filename = `auditoria-${from}_a_${to}_${pad(fromHour)}-${pad(toHour)}.${format}`;
  return new Response(body, {
    headers: {
      "Content-Type": format === "md" ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}