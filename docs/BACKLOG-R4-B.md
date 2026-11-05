# BACKLOG — Release R4-B: Agenda completa (intermedia)

> **Estado (2026-11-01):** En construcción. Es el release intermedio entre R4-A (agenda real sobre SQLite, 2026-10-23) y las fases de pagos (Fase 5). Su objetivo: que el calendario sea utilizable por el paciente en **cualquier día del año**, que la clínica pueda **configurar servicios, profesionales y horarios** desde el panel, y que la programación no se pierda si el paciente recarga la página o navega a otro apartado (cookies).
>
> **Decisiones clave:**
> - **D-R4-B-1 (2026-11-01):** El calendario público muestra un **grid de mes entero** (sin límite de 21 días); los días que caen fuera del horario del profesional se muestran disponibles pero inactivos, con el motivo.
> - **D-R4-B-2:** Los servicios y profesionales se configuran en el panel (`/admin/servicios`, `/admin/profesionales`); el `lib/data.ts` sigue siendo solo la semilla (TODO D8).
> - **D-R4-B-3:** La programación del paciente (`service → modo → profesional → fecha → hora`) se persiste en cookies del navegador para que no se borre al recargar o navegar.

---

## 1. Qué resuelve este release

En R4-A la cita es real (BD, anti-doble-reserva), pero el calendario público sigue siendo: *solo los próximos 21 días*, con una disponibilidad calculada por `lib/schedule.ts` y sin que el dueño pueda tocar nada sin código. R4-B cambia eso en dos frentes:

1. **El paciente ve el año completo** — eligiendo cualquier día, viendo si hay horario libre o no, sin saltos ni límites de ventana.
2. **La clínica gestiona los insumos de la agenda** — servicios (nombre, duración, modalidad), profesionales (activos/inactivos) y horarios por día de la semana — desde el panel admin, con reglas de validación en `schedule.ts`.

## 2. Alcance por epica (E5: Agenda)

| Ítem | Hoy (R4-A) | Después de R4-B |
|---|---|---|
| **5.03** — ventana de disponibilidad | Solo los próximos 21 días (`BOOKING_WINDOW_DAYS`), calculada en `schedule.ts` | **Grid de mes entero**; el año completo seleccionable; día no disponible marcado (no borra al paciente) |
| **5.04** — anti-doble-reserva | Transacción + índice parcial | Igual (heredado, ya probado) |
| **5.01** — servicios del servicio | Fijos en `lib/data.ts` | **Configurables desde el panel** (slug, nombre, duración, buffer, modalidades) |
| **5.02** — reglas por día/profesional | Reglas sembradas (`availability_rules`) + edición simple | **CRUD completo de profesionales + horarios por día/hora**; bloqueo/liberación **de un día exacto** por clic en el calendario anual, con deshacer (R4-B-UX-1) |
| **5.05** — flujo 4 pasos sobre BD | Flujo funciona, estado en `useState` (se pierde al recargar) | **Misma experiencia + cookies** (`booking_state`); sobrevive reload y navegación a `/privacidad`, `/nosotros`, etc. |
| **5.10** — panel admin | `/admin/horarios` (citas + horarios por día/prof) | **Ajustado (R4-B-3):** en vez de un módulo `/admin/calendario` separado, la vista anual vive como pestaña "Calendario anual" dentro de `/admin/horarios` (misma audiencia `canManageSchedule`); además `/admin/ajustes` (política) |
| **5.06/5.08** — correos | Encolados (stub) | Pendiente de R4-D (Resend) |

## 3. UI del calendario (D-R4-B-1 + D-R4-B-3)

### 3.1 Grid de mes completo (`components/CalendarView.tsx` — nuevo)

Sigue la paleta y tipografía del sitio (Lora títulos / Raleway cuerpo, `sage` como primario, `sage-dark`, `terracotta` para avisos, `mist`/`sand` para superficies). Mismo estilo de los `Card`/`Button` que ya existen.

- **Navegación**: `<` / `>` por meses (y selector `Año`), siempre visibles en la cabecera del calendario.
- **Grid**: 7 columnas (Lun–Dom), filas ajustables, días con número pequeño; hoy resaltado `border-sage`.
- **Disponibilidad por día** (leída del servidor):
  - Días dentro de las reglas del profesional → botón interactivo con el número de horarios libres abajo (`(3)` como en R4-A).
  - Días fuera de regla → **inactivo** (`cursor-not-allowed`, color `text-ink-soft`), al pasar el mouse muestra "El profesional no atiende ese día".
  - Días dentro de la regla pero sin cupo hoy → inactivo, tooltip "Sin cupos este día".
- Al elegir un día disponible se despliega el **grid de horas** (igual que R4-A: `timeLabel(hour)`, tachados los ocupados).
- En móvil: una sola columna; en desktop: sidebar con el mes a la izquierda y detalles a la derecha.

### 3.2 Persistencia (`components/BookingFlow.tsx` — refactor)

El estado del flujo (`serviceSlug, mode, proId, dateIso, hour`) se guarda en **cookies** (`booking_state`, 7 días) cada vez que el paciente avanza de paso o cambia una selección:
- Sobrevive: recarga de la página, ir a `/privacidad`/`/nosotros`/`/contacto`, volver con `router.back()`.
- Se borran al confirmar la cita (`resetCookie`) y al "agendar otra cita".
- Validación: si el paciente vuelve a `/agendar`, se restaura el estado guardado (con un badge "volver a agendar" o continuar).

### 3.3 Experiencia de paso a paso (sin cambios visuales, cambio de motor)

Mismo flujo visual de R4-A (servicio → modalidad → profesional → cuándo → datos), pero:
- El paso "Cuándo" no fuerza `BOOKING_WINDOW_DAYS` — el paciente puede cambiar de mes para ver el año completo.
- Si la fecha está fuera de regla del profesional, el mensaje de error dice **por qué** (no atiende ese día / no tiene horarios).

## 4. Administración (`/admin/servicios`, `/admin/profesionales`)

### 4.1 Servicios (`lib/services/admin.ts` — nuevo)

Cada servicio edita: slug (inmutable), nombre, categoría, duración (minutos), buffer (minutos), modalidades (`presencial`, `enlinea`, o ninguna), descripción corta/larga y FAQ. El panel muestra una lista con acciones de **alta/edición/baja lógica** (marcar `inactive` — los servicios inactivos ya no aparecen en el catálogo ni en la agenda, pero las citas históricas siguen leyendo el nombre).

### 4.2 Profesionales (`lib/professionals/admin.ts` — nuevo)

- **Crear/Editar**: nombre, rol, servicios (check-list de checkboxes), días de la semana (1–6), hora apertura/cierre y sábado opcional (apertura/cierre propios).
- **Baja lógica** (`disabled: 1`): un profesional deshabilitado no aparece en `professionalsFor()`, pero sus citas históricas se mantienen.
- El seed demo de `lib/data.ts` sigue alimentando la BD al arrancar si la tabla está vacía (inmutable por el panel).

### 4.3 Horarios por día (`/admin/horarios`) — ampliación

El módulo de R4-A ya tiene edición de horarios; aquí se añade:
- Selector de profesional + selector de mes para ver **la ventana completa** del año en una tabla (cada fila es un día, con open/close).
- Nueva función `getProfessionalSchedule(proId, dateIso)` que cruza regla del día → reglas específicas (sábado diferente) → ocupación real → y devuelve los horarios libres por cada día.

## 5. Motor de disponibilidad (`lib/schedule.ts`) — cambios técnicos

```ts
// Nuevo: ventana configurable + cualquier día del año
export const BOOKING_WINDOW_DAYS = 365; // TODO (D4): decidir si es fijo o editable desde ajustes

/** Regla extendida: día de la semana → hora apertura/cierre, con sábado opcional. */
export function getRule(proId: string, dateIso: string): RuleView | undefined { ... }

/** ¿Hay disponibilidad real en `dateIso`? Devuelve los slots libres y el motivo si no hay. */
export function daySlotsFor(dateIso: string, proId: string): DaySlots | { ok: false; error: string } { ... }

/** Agenda completa del mes para el panel admin (todos los días del mes → horarios). */
export function monthSchedule(proId: string, dateIso: string): MonthView { ... }
```

- `openSlotsFor` se simplifica a: **leer reglas → leer ocupación → cruzar**; la ventana ya no corta la selección.
- Si un día está fuera de las reglas del profesional, se devuelve `{ ok: true, days: [] }` — el calendario lo pinta inactivo con motivo (no error de "ventana").
- La garantía anti-doble-reserva (`BEGIN IMMEDIATE` + `ux_appt_slot`) **se mantiene intacta**.

## 6. Decisiones pendientes del dueño (antes del gate R4-B)

| ID | Pregunta | Impacto |
|---|---|---|
| **D-R4-B-5** | ~~¿La ventana de reserva es un año fijo o editable desde el panel?~~ **RESUELTA (R4-B-3, provisional):** editable en `/admin/ajustes` (`site_settings.booking_window_days`, default 365, clamp 1–730). El dueño puede cambiar de opinión en el gate. | `BOOKING_WINDOW_DAYS` = default de la columna |
| **D-R4-B-6** | ¿Las citas "fuera de regla" se pueden pedir por WhatsApp y el admin las abre manualmente? (SIGUE PENDIENTE — no entró en R4-B-3) | Añade flujo `request` → `adminApprove()` |
| **D-R4-B-7** | ~~¿El panel debe mostrar la ocupación anual (mes a mes) o solo la lista de horarios?~~ **RESUELTA (R4-B-3):** vista anual mes a mes en la pestaña "Calendario anual" de `/admin/horarios` | El calendario del admin en 3.3 |

## 7. Sprints de R4-B

| Sprint | Contenido | Estado |
|---|---|---|
| **R4-B-1** — Motor + disponibilidad | `getRule`, `daySlotsFor`, `monthSchedule`; grid mes completo; día fuera de regla con motivo; cookies del estado (`booking_state`) | 🔶 **EJECUTADO + ronda de corrección (2026-11-01):** 10 defectos del refactor corregidos (pantalla en blanco al elegir modalidad, calendario vacío en el mes actual, horas no seleccionables, restauración de cookies sin validar…). Detalle: `docs/PLAN-R4-B-1.md` §Corrección de bugs; verificación `tsc`+build limpios, `check:agenda` PASS |
| **R4-B-2** — Panel servicios + profesionales | `/admin/servicios` (CRUD), `/admin/profesionales` (CRUD + activo/inactivo), seed → BD (inmutable) | 🔶 **EJECUTADO (2026-11-02):** D-R4-B-2 ajustada — NO se duplica `services` (la tabla de R3-C ya era la única fuente y su editor ya elegía modalidades); sí se crea `professionals` + `getProfessionals()` (todos los consumidores cambian de `lib/data` a BD); `/admin/profesionales` alta/edición/activar/inactivo/baja + alinea reglas; `/admin/servicios` vista dedicada con deep-links al editor. Verificado: RBAC 307/200, semilla, UPSERT, `check:agenda` PASS, build 33 rutas |
| **R4-B-BUG-1** — Sprint intermedio de corrección del flujo `/agendar` (Volver + horarios tachados + citas de prueba) | PB-2b: `Volver` visible en ¿Cuándo? sin fecha elegida. PB-1: `Volver` arriba de cada paso. PB-2: horarios reservados desaparecen. PB-3: citas de prueba visibles en `/admin/horarios`. | 🔶 **EJECUTADO (2026-11-02):** verificado con Puppeteer (volver arriba, persona simula agendado) + dueño confirmó las 2 citas de prueba en `/admin/horarios` (`rv-ce8…`, `rv-fba…`). Commit `defd286` → push `r4-b`. |
| **R4-B-3** — Calendario admin + Ajustes | `/admin/horarios` ampliado con vista anual, página Ajustes (`cancel_cutoff_hours`, `booking_window_days`, zona horaria), excepciones por fecha (vacaciones/festivos) | ✅ **EJECUTADO (2026-11-05):** pestaña **Calendario anual** (12 mini-meses, carga por día, nav por año/profesional con `yearSchedule` = 2 consultas/año; D-R4-B-7 resuelta: mes a mes); **`/admin/ajustes`** (cutoff + ventana + zona, solo admin, D-R4-B-5 resuelta: ventana editable; D-R4-4: zona configurable); **bloqueos por fecha** (5.02): tabla `date_exceptions`, alta/desactivar/eliminar desde la pestaña, motivo `cerrado` en el calendario público + rechazo duro al reservar. `flow-verify-r4b3.mjs` → TODAS pasaron; `check:agenda` PASS; detalle `docs/PLAN-R4-B-3.md` |
| **R4-B-UX-1** — Bloqueo de días por clic (+ deshacer) | Casillas del calendario anual clicables: panel en el sitio para bloquear/liberar **ese día exacto**, motivo y alcance; partir rangos; banner con **Deshacer** (pila de la sesión) y enlace "Ver cómo lo ve el paciente" (`/agendar?...&dia=`); formulario de rango plegado | ✅ **EJECUTADO (2026-11-05):** motor nuevo `blockDay`/`freeDay`/`undoDayOp`/`exceptionsCovering` (+acciones RBAC/auditoría), UI en `ScheduleManager`, `?dia=` en `/agendar`. `flow-verify-ux1.mjs` → TODAS pasaron; `check:agenda` PASS. Detalle y guion de feedback: `docs/PLAN-R4-B-UX-1.md`. **Pendiente: feedback del admin (F-1…F-4)** |
| **R4-B-4** — QA y gate | `npm run check:agenda` + nueva prueba (año completo); smoke del calendario en 3 dispositivos; docs actualizados | ⬜ |

## 8. Gate de salida de R4-B (propuesto, lo aprueba el dueño)

Persona no técnica, < 10 min, con el sitio corriendo:
1. Ir a `/agendar`, elegir un servicio → en el calendario "Cuándo", **navegar a cualquier mes del año** y elegir un día; si cae en día de regla sin cupo → ver "Sin cupos"; si es día inactivo → ver el motivo (no atiende).
2. Navegar `/privacidad` y volver: la selección está intacta.
3. En `/admin/servicios`: crear/editar un servicio con modalidades; en `/admin/profesionales`: deshabilitar un profesional y que deje de aparecer en `/agendar`.
4. En `/admin/horarios`: programar un nuevo horario para un día de la semana; verlo reflejado en `/agendar`.
5. `npm run check:agenda` → PASS.

## 9. Lo que NO entra (para no dispersarse)

- Correos reales (Resend) y cron — **R4-D**.
- Usuarios reales con login/BD (`/admin/usuarios`) — **R4-C**.
- Pagos (Mercado Pago) — **Fase 5**.
- E2E Playwright — **R4-D**.

## 10. Documentación a actualizar con R4-B

`docs/BACKLOG-R4.md` §3 (estado), `README.md` §2/§8, `docs/ORGANIZACION-DEL-PROYECTO.md` (crónica + D-R4-B-1…7), `docs/ESTRUCTURA-DEL-CODIGO.md` (nuevos archivos: `CalendarView.tsx`, `lib/services/admin.ts`, `lib/professionals/admin.ts`, cookies helper).
