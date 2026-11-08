# BACKLOG — Release 4 (R4): Fase 4, agenda real

> **Estado (2026-11-01):** **R4-A EJECUTADO** (agenda real sobre la BD local: citas persistentes,
> anti-doble-reserva garantizada por la base, reprogramación/cancelación por enlace único, módulo
> `/admin/horarios` y cola de notificaciones). **R4-B en construcción**: calendario de mes completo + servicios/profesionales/horarios configurables en el panel + cookies de programación (intermedia antes de pagos/Fase 5). **R4-C/D pendientes** (§3). El dueño pidió continuar con el siguiente sprint el 2026-10-23; el gate de R3 queda pendiente de su visto bueno formal (sin bugs reportados hasta hoy).
> Ítems de referencia: `BACKLOG.md` E5 (5.01–5.12). Carga del release según el maestro: 40+ puntos / 4–6 semanas.

---

## 1. Qué resuelve esta fase

El negocio central: **que un paciente agende solo, no haya dos citas en el mismo horario, y pueda
cancelar o reprogramar sin llamar**; y que la clínica vea y gestione todo desde el panel. En Fase 3
la reserva era demo (`localStorage`, disponibilidad simulada). En R4-A la cita se registra en la
BD, la ocupación es real y el enlace `/mi-cita/<token>` funciona desde cualquier dispositivo.

## 2. Ajustes de alcance sobre el backlog maestro (decisiones documentadas)

| ID | Decisión | Motivo |
|---|---|---|
| **D-R4-1** (2026-10-23) | La agenda real se construye sobre la **BD local SQLite** (5.01–5.04 en SQLite), no sobre Supabase. La migración a Supabase + RLS se hace cuando se decida el despliegue: la lógica de `lib/schedule.ts` no cambia, solo el conductor | Misma decisión-estructura que R3; el dueño no ha dado credenciales nube. Marcado `TODO` en código |
| **D-R4-2** | **Resend sin credenciales del dueño** → los correos se **encolan** en `notifications` (confirmación, recordatorio, cancelación) y `scripts/process-notifications.mjs` los procesa como *stub* (queda registro; entrega real en R4-D cuando exista `RESEND_API_KEY` + remitente verificado) | El dominio real tampoco está (D1) — Resend exige remitente verificado |
| **D-R4-3** | Política de cancelación **provisional: 24 h** de anticipación para auto-gestión del paciente (cancelar/reprogramar). Guardada en `site_settings.cancel_cutoff_hours` (editable en BD; UI en R4-B). El admin cancela siempre | **D4 sin decisión del dueño**; configurable en cuanto la dé |
| **D-R4-4** | Zona horaria = la del servidor (America/Mexico_City en el despliegue). Configurable explícito: `TODO` (5.03) | Sin servidores multi-región en esta etapa |
| **D-R4-5** | **Asistente sin acceso a la agenda** por ahora (`canManageSchedule` = admin + terapeuta) | No está decidido si recepción agenda citas (se pregunta al cerrar D8) |

## 3. Sprints del R4

| Sprint | Contenido | Estado |
|---|---|---|
| **R4-A — Agenda real núcleo** | Tablas `appointments`, `availability_rules`, `notifications` (+ índice único parcial `ux_appt_slot` = garantía dura 5.04; `BEGIN IMMEDIATE` en alta y reprogramación). Motor de disponibilidad real desde BD (`lib/schedule.ts`): reglas por pro/día − ocupación real. `BookingFlow` pasa a server actions (sin `localStorage`); `/mi-cita/<token>` se resuelve en BD con **cancelar y reprogramar** (cutoff D-R4-3). Módulo **`/admin/horarios`** (5.10 parcial + 5.02): citas próximas con cancelación administrativa, historial, edición de horarios por día y profesional (alta/edición/baja). Cola de correos + `npm run notifications` (stub). Dashboard: stat de citas próximas. **Prueba 5.04:** `npm run check:agenda` → PASS (1.ª entra, 2.ª bloqueada, tras cancelar el slot se libera) | ✅ 2026-10-23 |
| **R4-B — Agenda completa (intermedia, 2026-11-01)** | Calendario de mes completo en `/agendar` (año entero seleccionable, día fuera de regla con motivo), servicios/profesionales/horarios configurables desde el panel (`/admin/servicios`, `/admin/profesionales`, `/admin/horarios` ampliado + vista anual), cookies `booking_state` para no perder la programación al recargar/navegar, excepciones por fecha (vacaciones/festivos, 5.02), Ajustes (cutoff + zona horaria + ventana), marcado `completada`. Detalle: `docs/BACKLOG-R4-B.md` | 🔶 |
| **R4-C — Usuarios reales** (8.02 completo) | Tabla `admin_users` con hash scrypt (`node:crypto`), login contra BD, migrar los 3 perfiles de `lib/admin/store.ts`, módulo `/admin/usuarios` (CRUD + roles, solo admin); evaluar 8.03 (2FA) | ⬜ |
| **R4-D — Entorno real** (necesita insumos del cliente) | Entrega de correos con Resend + cron del procesador (5.06/5.08), E2E Playwright reservar/cancelar/reprogramar/doble-reserva paralela (5.12), anticipos Mercado Pago **solo si D3 aprueba** (5.09), Google Calendar si se aprueba (5.11), migración a Supabase+RLS si el despliegue lo pide | ⬜ |

**Diferidos que arrastra el R4:** 8.03 (2FA → R4-C), 8.09 (WYSIWYG), "uso justo" del Multimedia
(decisión B del dueño: portada editable de recursos y/o selector de imagen del hero → R4-B/C).

## 4. Historias E5 tras R4-A (trazabilidad rápida)

| ID | Situación |
|---|---|
| 5.01 | ✅ 🔶 en SQLite; ✅ servicios configurables desde el panel (tabla `services` de Contenido + vista `/admin/servicios`, R4-B-2) |
| 5.02 | ✅ reglas por día/profesional editables; ✅ **excepciones por fecha (R4-B-3):** bloqueos vacaciones/festivos por rango (`date_exceptions`, pro o toda la clínica) con CRUD en la pestaña Calendario del panel |
| 5.03 | ✅ motor de disponibilidad real; ✅ calendario del flujo público **ampliado a mes entero/año completo** (R4-B-1); ✅ **vista de calendario anual del admin + ventana y zona horaria configurables** (R4-B-3); ✅ la ventana **se ve en el calendario**: los días fuera de rango salen deshabilitados con su motivo y aviso del límite (R4-B-HOTFIX-1); ✅ al fijar el límite, el calendario abre en el **primer mes permitido** y las fechas guardadas fuera de ventana se descartan (R4-B-HOTFIX-2) |
| 5.04 | ✅ **doble garantía**: check transaccional + índice único parcial; prueba `check:agenda` PASS |
| 5.05 | 🔶 flujo 4 pasos sobre BD; ✅ **cookies `booking_state`** implementadas y restauración validada (R4-B-1); ⬜ nada adicional pendiente |
| 5.05b | ✅ **profesionales configurables en el panel** (tabla `professionals` + `/admin/profesionales` con alta/edición/activar/baja, R4-B-2) |
| 5.06 | 🔶 página `/mi-cita/<token>` real + WhatsApp; ⬜ correo (encolado, entrega R4-D) |
| 5.07 | 🔶 cancelar/reprogramar por enlace único con cutoff 24 h (D-R4-3); ⬜ expiración de enlace, política definitiva (D4) |
| 5.08 | 🔶 recordatorios encolados + script; ⬜ cron real (R4-D) |
| 5.09 | ⬜ D3 |
| 5.10 | 🔶 `/admin/horarios` (ver/cancelar/horarios); ⬜ calendario + lista de clientes (R4-B) |
| 5.11 | ⬜ opcional |
| 5.12 | ⬜ Playwright (R4-D) |

## 5. Gate de salida de la Fase 4 (propuesto, lo aprueba el dueño)

Persona no técnica, < 10 min, con el sitio corriendo:
1. Agendar una cita desde `/agendar` con datos propios → aparece de inmediato en `/admin/horarios`.
2. Abrir el enlace `/mi-cita/<token>` **desde otro dispositivo/navegador** y ver la cita real.
3. Reprogramar a otro horario y confirmar el cambio en el panel.
4. Intentar agendar en el slot ya tomado (2 pestañas) → el segundo recibe "ya no está disponible".
5. Cancelar desde el panel como admin y desde `/mi-cita` como paciente (con cutoff: una cita a <24 h no se puede cancelar en línea → se indica WhatsApp).
6. `npm run check:agenda` → PASS.

## 6. Insumos que faltan del dueño (bloqueos parciales)

- **D3** anticipos por cita → activa/descarta 5.09.
- **D4** política real de cancelación → sustituye el provisional de 24 h (D-R4-3).
- **D8** profesionales y horarios reales → reemplaza la semilla demo (marcada `TODO`) y la lista de `lib/data.ts`.
- Credenciales nube (para R4-D): proyecto Supabase si el despliegue va a Supabase; clave y **dominio verificado** de Resend (depende del dominio real, D1/Fase 7).
- Decisión D-R4-5: ¿recepción (asistente) gestiona agenda?
