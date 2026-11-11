// ============================================================
// AUDITORÍA — R3-D (8.12)
//
// Registra quién hizo qué y cuándo en el panel. Cada acción
// mutante de `lib/content/actions.ts` (y de apariencia/multimedia
// cuando aplique) llama a `logAudit` después de escribir.
//
// SOLO servidor (usa `lib/db.ts`).
// ============================================================

import { getDb } from "./db";

export interface AuditLogRow {
  id: number;
  actor_email: string;
  actor_role: string;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: string | null;
  created_at: number;
}

/** Escribe una entrada de auditoría (sin validar: se llama tras una escritura exitosa). */
export function logAudit(
  actor: { email: string; role: string },
  action: string,
  entity: string,
  entityId?: string | null,
  detail?: string | null,
): void {
  getDb()
    .prepare(
      `INSERT INTO audit_logs (actor_email, actor_role, action, entity, entity_id, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(actor.email, actor.role, action, entity, entityId ?? null, detail ?? null, Date.now());
}

/** Últimas entradas de auditoría, con filtros opcionales (máx. 300). */
export function getAuditLogs(opts?: {
  limit?: number;
  entity?: string;
  action?: string;
  q?: string;
}): AuditLogRow[] {
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 300);
  const clauses: string[] = [];
  const params: string[] = [];
  if (opts?.entity) {
    clauses.push("entity = ?");
    params.push(opts.entity);
  }
  if (opts?.action) {
    clauses.push("action = ?");
    params.push(opts.action);
  }
  if (opts?.q) {
    clauses.push("(actor_email LIKE ? OR action LIKE ? OR entity LIKE ? OR entity_id LIKE ? OR detail LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like, like, like);
  }
  const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDb()
    .prepare(`SELECT * FROM audit_logs${where} ORDER BY created_at DESC, id DESC LIMIT ?`)
    .all(...params, limit) as unknown as AuditLogRow[];
  return rows;
}

/** R4-B-AUDIT-2: todas las entradas de un rango [fromMs, toMs), ascendente (export). */
export function getAuditLogsRange(fromMs: number, toMs: number): AuditLogRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM audit_logs WHERE created_at >= ? AND created_at < ?
       ORDER BY created_at ASC, id ASC`,
    )
    .all(fromMs, toMs) as unknown as AuditLogRow[];
}
