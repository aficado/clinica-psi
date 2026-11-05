# PLAN R4-B-3 — Calendario anual + Ajustes + Excepciones por fecha

**Sprint:** R4-B-3 (último feature de R4-B antes del gate R4-B-4/QA)
**Fechas:** 2026-11-05 →
**Estado:** ✅ EJECUTADO (2026-11-05) — verificado con `flow-verify-r4b3.mjs` (todas pasaron) y `check:agenda` PASS. Pendiente solo la revisión visual del dueño (gate R4-B-4).
**Depende de:** R4-B-BUG-1 cerrado (flujo `/agendar` verificado por el dueño)

## 1. Objetivo

Que la clínica controle la agenda **desde el panel**, sin tocar la BD:

1. **Ajustes** (`/admin/ajustes`, hoy `comingSoon`): política de cancelación, ventana de reserva y zona horaria editables.
2. **Vista anual** en `/admin/horarios`: ocupación mes a mes del año por profesional.
3. **Excepciones por fecha** (5.02): bloqueos por vacaciones/festivos (rango de fechas, por profesional o para todos) que desaparecen de `/agendar` y no se pueden reservar ni por API.

## 2. Decisiones del dueño aplicadas (provisionales, marcadas en docs)

| ID | Decisión | Qué se hace en este sprint |
|---|---|---|
| **D-R4-B-5** | Ventana de reserva editable desde Ajustes | `site_settings.booking_window_days` (default 365); `BOOKING_WINDOW_DAYS` queda como *default* del ajuste |
| **D-R4-B-7** | El admin muestra ocupación anual mes a mes | pestaña "Calendario" en `/admin/horarios` |
| **D-R4-B-6** | (NO responde aún) citas fuera de regla por WhatsApp | **fuera de alcance** — queda pendiente para el gate |
| **D-R4-4** | Zona horaria configurable explícita | `site_settings.time_zone` (default `America/Mexico_City`); se usa en la hora local del panel y en Auditoría; el motor de fechas sigue siendo local-servidor (mismo valor en el despliegue) |
| **D-R4-3** | Cutoff provisional de cancelación = 24 h | el valor ya vive en BD; este sprint le pone **UI** en Ajustes |

## 3. Product backlog del sprint

| ID | Tipo | Historia (usuario) | Criterios de aceptación | Estado |
|---|---|---|---|---|
| **PB-1** | Feature | *Como dueño, quiero editar en `/admin/ajustes` las horas de anticipación para cancelar, los días de ventana de reserva y la zona horaria, para ajustar la política sin tocar la BD.* | Formulario solo-admin (RBAC 307/403 como el resto); validaciones (cutoff 0–720 h entero; ventana 1–730 días; zona de una lista conocida); guarda en `site_settings`; `/mi-cita` y el flujo de reserva usan los valores nuevos al instante; escritura queda en Auditoría. | ✅ **ejecutado 2026-11-05** (`/admin/ajustes` + `BookingSettings` + `saveBooking`; verificado: ventana 15 → el motor rechazó “dentro de 15 días” y cutoff/zona persistieron en BD) |
| **PB-2** | Feature | *Como clínica, quiero ver en `/admin/horarios` el año completo mes a mes con la carga de cada día, para planificar vacaciones y cupos.* | Pestaña nueva "Calendario": selector de profesional + año (nav ←/→); 12 mini-meses con día: libres (verde con nº), sin cupo (ámbar), no atiende (gris), bloqueado (terracota); calculado con **1 consulta por mes** (no 365); carga con la página (server component + `?year=&pro=`). | ✅ **ejecutado 2026-11-05** (pestaña "Calendario anual" con `yearSchedule` — 2 consultas por año; verificado: 12 grids + leyenda renderizan, nav `?year=`) |
| **PB-3** | Feature | *Como clínica, quiero bloquear rangos de fechas (vacaciones, festivos) por profesional o para todos, para que esos días no ofrezcan horarios.* | Tabla `date_exceptions` (pro_id o `*`, fecha inicio/fin, tipo, nota, activo); CRUD desde la pestaña Calendario con RBAC `canManageSchedule` + auditoría; `daySlotsFor` → `reason: "cerrado"` (el calendario público lo pinta no-seleccionable con el motivo en el `title`); `createAppointment` rechaza el slot con mensaje claro; borrar la excepción libera el día. | ✅ **ejecutado 2026-11-05** (bloqueo de un día con cupo → en `/agendar` quedó deshabilitado con motivo; al eliminarlo volvió a habilitarse; rechace duro también en `slotCandidateError`) |
| **PB-4** | QA/Docs | *Como dueño, quiero evidencia de que nada se rompió.* | `tsc` limpio; build OK; `npm run check:agenda` PASS; prueba Puppeteer (crear excepción → día bloqueado en `/agendar`; ajuste ventana/cutoff persiste; vista anual renderiza); docs: `BACKLOG-R4-B.md`, `ORGANIZACION-DEL-PROYECTO.md`, `ESTRUCTURA-DEL-CODIGO.md`, `BACKLOG-R4.md` (5.02/5.03); commit + push `r4-b`. | ✅ **2026-11-05**: `tsc`/build limpios, `check:agenda` PASS, `flow-verify-r4b3.mjs` → **TODAS las verificaciones pasaron** (transcripción `/tmp/opencode/flow-verify-r4b3.txt`) |

## 4. Diseño técnico

**BD (`lib/db.ts`, patrón ALTER ya usado):**
- `site_settings` + `booking_window_days INTEGER NOT NULL DEFAULT 365` + `time_zone TEXT NOT NULL DEFAULT 'America/Mexico_City'`.
- Tabla nueva `date_exceptions (id, pro_id, date_from, date_to, kind, note, active, created_at, updated_at)` + índice `(pro_id, date_from, date_to)`.

**Motor (`lib/schedule.ts`):**
- `getBookingWindowDays()` (clamp 1–730, default 365) — sustituye la constante en `slotCandidateError` (mensaje pasa a dinámico).
- `getSiteTimeZone()` — usado en la UI del panel (Auditoría ya tenía el valor fijo).
- `exceptionFor(proId, dateIso)` → `daySlotsFor` devuelve `{ hours: [], reason: "cerrado", blockedLabel }` si aplica; `monthSchedule` se beneficia gratis.
- `yearSchedule(proId, year)` para la vista anual: 1 query de citas + 1 de excepciones por año, reglas en memoria.
- `listExceptions / saveException / deleteException` con validación (ISO, from ≤ to, tipo ∈ {vacaciones, festivo, bloqueo}, pro existe o `*`).

**Acciones server (`lib/schedule/actions.ts`, `lib/content/actions.ts`):** mismo patrón `guard* → mutar → logAudit → revalidatePath`. `saveBookingSettings` exige `canAdmin`.

**UI:**
- `app/admin/ajustes/page.tsx` (server, RBAC admin) + `components/admin/BookingSettings.tsx` (form).
- `ScheduleManager.tsx`: tab `calendario` (12 mini-meses + gestor de excepciones); props nuevos `yearDays`, `exceptions`, año/pro desde `searchParams`.
- `CalendarView.tsx`: motivo `cerrado` en `dayTitle` (no selectable, igual que `no_atiende` en el detalle del día).
- `AdminShell.tsx`: "Ajustes" deja de ser `comingSoon`.

**Fuera de alcance (para no dispersarse):** pedido fuera de regla por WhatsApp (D-R4-B-6), marcado `completada` de citas (R4-B-4/gate), correo real (R4-D), Supabase (despliegue).

## 5. Verificación prevista

1. `npx tsc --noEmit` + `npm run build` limpios.
2. `npm run check:agenda` → PASS (anti-doble-reserva intacto).
3. Puppeteer: alta de excepción para Dra. Mariana (rango que incluye un día de regla) → en `/agendar` ese día sale bloqueado y `createAppointment` lo rechaza; Ajustes: cambiar ventana a 30 y cutoff a 12 → persiste y `/mi-cita` lo refleja; vista anual con 12 meses visible con `?year=`.
4. El dueño prueba en su navegador (vista anual + excepciones + ajustes).
