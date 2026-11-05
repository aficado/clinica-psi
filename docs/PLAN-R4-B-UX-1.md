# PLAN R4-B-UX-1 — Bloquear el día haciendo clic (+ deshacer)

**Sprint:** R4-B-UX-1 (intermedio de UX, entre R4-B-3 y R4-B-4/gate)
**Fechas:** 2026-11-05 →
**Estado:** ✅ EJECUTADO (2026-11-05) — verificado con `flow-verify-ux1.mjs` (todas pasaron). **Falta el feedback del admin** (sección 6).
**Origen:** el dueño pidió refactorizar el bloqueo de días por festivos: "más sencillo e intuitivo, siendo el admin quien bloquea exactamente el día", y que se pueda **deshacer**.

## 1. Qué está mal hoy (R4-B-3)

| Problema | Síntoma |
|---|---|
| El bloqueo vive **lejos del calendario** | el admin ve el año arriba, pero tiene que bajar a un formulario aparte y escribir la fecha a mano |
| Se bloquea por **rango**, no por día | para un solo festivo hay que escribir la misma fecha dos veces |
| Sin confirmación útil | el mensaje dice "Bloqueo creado…" pero el admin no tiene forma rápida de comprobar que quedó bien |
| Sin **deshacer** | corregir significa ir a la lista, buscar el bloqueo, "Eliminar", "Sí, eliminar" (3 clics y memoria) |
| Doble camino | formulario de rango + lista de bloqueos, ambos visibles siempre |

**Feedback del admin (decisión de diseño, 2026-11-05):** interacción elegida = **clic en el día del calendario anual**, panel en el sitio; retroalimentación = **mensaje + previsualización en `/agendar`** ("cómo lo ve el paciente"). Se añadió **deshacer** por petición explícita del dueño.

## 2. Product backlog

| ID | Tipo | Historia (usuario) | Criterios de aceptación | Estado |
|---|---|---|---|---|
| **PB-1** | UX | *Como administradora, quiero **hacer clic en el día** del calendario anual para bloquearlo, sin escribir fechas.* | Cada casilla del año es un botón accesible (teclado, `aria-label` con fecha y estado). Al hacer clic se abre un panel junto al calendario con: día ("jueves, 12 de noviembre de 2026"), profesional en vista, motivo (Vacaciones / Festivo / Bloqueo), nota opcional y alcance (solo este profesional / toda la clínica). "Bloquear el día" graba con `date_from = date_to = día`. Panel cierra con Escape y con "Cancelar". ✅ **ejecutado 2026-11-05**: casillas `<button>` con `aria-label` (fecha + profesional + estado) y `aria-pressed`; panel anclado al clic con motivo (Festivo/Vacaciones/Bloqueo), nota y alcance; graba `date_from = date_to`; cierra con × y con Escape. Prueba: `flow-verify-ux1.mjs` pasos 1–5. |
| **PB-2** | UX | *Como administradora, quiero hacer clic en un **día ya bloqueado** y poder liberarlo desde ahí.* | El panel muestra qué lo bloquea (motivo, nota, rango, alcance). Botón "Liberar este día": si el bloqueo es de un solo día lo elimina; si es un rango lo **parte** conservando el resto (p. ej. liberar el 25 de unas vacaciones 20-30 deja 20-24 y 26-30). Bloqueo de "toda la clínica" → el panel dirige a la lista con un acceso directo (no parte rangos de clínica sin confirmación). ✅ **ejecutado 2026-11-05**: el panel muestra qué bloquea el día (motivo, nota, rango, alcance); "Liberar este día" borra si era un día suelto y **parte** el rango conservando el resto; los bloqueos de `*` (clínica) no se parten: el panel dirige a la lista. Prueba: pasos 8–10 (rango 15→21 dic, liberar el 18 → quedan 15–17 y 19–21). |
| **PB-3** | UX | *Como administradora, quiero **ver que el cambio quedó bien** sin salir del panel.* | Tras bloquear/liberar: banner de confirmación con el día en texto ("Martes, 10 de noviembre · Dra. Mariana Solís · Festivo") + **enlace "Ver cómo lo ve el paciente"** que abre `/agendar` (pestaña nueva) con servicio/modo/profesional/día ya cargados y el día marcado como bloqueado. El calendario se repinta al instante (sin recargar) con el día en color de bloqueo. ✅ **ejecutado 2026-11-05**: banner "Día bloqueado: viernes, 6 de noviembre · Festivo · Dra. Mariana Solís" + enlace "Ver cómo lo ve el paciente ↗" (`/agendar?...&dia=…`, pestaña nueva) + repintado inmediato (`override` local + `router.refresh`). Prueba: pasos 3, 5 y 6 (el preview abre en ¿Cuándo?, mes correcto, día deshabilitado con el motivo). |
| **PB-4** | UX | *Como administradora, quiero **deshacer** el último cambio con un clic.* | En el banner hay "Deshacer". Revirtió exactamente la operación: crear → borrar; partir un rango → **reconstruir el rango original** (mismos valores e id). Cadena de varios deshaces en la misma sesión (pila, tope 20). Al deshacer: mensaje "Deshecho" + el calendario vuelve a su estado anterior. El deshacer es de la **sesión de la página** (si se recarga, desaparece; la lista de bloqueos sigue siendo la vía permanente). ✅ **ejecutado 2026-11-05**: `DayOpUndo` (ids + valores anteriores) viaja al cliente; pila de hasta 20 "Deshacer" en el banner; revertir la partición **restaura el rango con su id original**. Prueba: pasos 7 (crear→deshacer→0 filas) y 11 (partir→deshacer→ id 11 con 15→21 intacto). |
| **PB-5** | UX | *Como administradora, quiero que el rango largo no estorbe pero siga existiendo.* | El formulario de rango queda **plegado** bajo `Bloqueo por rango (vacaciones largas)`; la lista de bloqueos se queda debajo, con el mismo CRUD. Nada de la lógica de R4-B-3 se pierde. ✅ **ejecutado 2026-11-05**: formulario de rango dentro de `<details>` "Añadir bloqueo por rango (vacaciones de varios días)"; la lista de bloqueos conserva activar/desactivar/eliminar. La lógica de R4-B-3 sigue intacta. |
| **PB-6** | QA/Docs | *Como dueño, quiero evidencia de que el cambio no rompió la agenda.* | `tsc` + build limpios; `check:agenda` PASS; Puppeteer nuevo: clic→panel→bloquear→banner con deshacer→deshacer→día libre otra vez; partir rango (bloqueo 3 días, liberar el del medio → quedan 2 rangos); enlace de preview llega a `/agendar` con el día bloqueado; limpieza final (BD sin datos de prueba, ajustes en 24/365/`America/Mexico_City`). Docs: `BACKLOG-R4-B.md`, `ORGANIZACION-DEL-PROYECTO.md` (ronda 17), `ESTRUCTURA-DEL-CODIGO.md`, `BACKLOG-R4.md` (5.02). Commit + push `r4-b`. ✅ **2026-11-05**: `tsc` y build limpios; `check:agenda` PASS; `flow-verify-ux1.mjs` → **TODAS pasaron** (transcripción `/tmp/opencode/flow-verify-ux1.txt`); la prueba solo borra los ids que ella creó (BD final sin datos de prueba). Docs actualizadas. |

## 3. Diseño técnico

**Motor (`lib/schedule.ts`, sin cambios de esquema):**
- `exceptionsCovering(proId, dateIso, { includeInactive })` → lo que bloquea un día (incluye inactivos para mostrarlos).
- `blockDay(proId, dateIso, kind, note)` → inserta el día exacto; si ya está bloqueado, error claro. Devuelve `DayOpUndo`.
- `freeDay(proId, dateIso)` → transacción `BEGIN IMMEDIATE`: para cada bloqueo activo **del profesional** que cubre el día, lo parte (`left`/`right`) o lo borra si solo cubría ese día. Devuelve `DayOpUndo` con el estado anterior (ids e valores originales).
- `undoDayOp(undo)` → inverso exacto: borra los ids creados y restaura por id los modificados/eliminados (`UPDATE` si existe, `INSERT` con el mismo id si ya no está). Idempotente: si el día ya cambió por otro lado, avisa en vez de romper.
- `type DayOpUndo = { before: ExceptionView[]; created: number[] }` — serializable, viaja al cliente y regresa.

**Acciones (`lib/schedule/actions.ts`):** `fetchDayBlocks`, `blockDayAction`, `freeDayAction`, `undoDayAction` — todas con `guardSchedule` (RBAC) + `logAudit` + `revalidatePath("/admin/horarios")`.

**Preview del lado del paciente:** `/agendar` acepta `?service=&mode=&pro=` ya hoy; se añade `&dia=YYYY-MM-DD` (param `dia` → `BookingFlow` arranca en ¿Cuándo? con ese mes/día cargados y la **cookie `booking_state` no pisa** la URL de preview). El panel del admin construye el enlace con un "plan de reserva" válido del profesional (servicio + primera modalidad que atiende), calculado en el server (`app/admin/horarios/page.tsx` → `previews: Record<proId, string>`).

**UI (`ScheduleManager.tsx`):** casillas `<span>` → `<button>`; estado `dayPanel: {iso} | null` + `blocks` del día + `override: Record<iso,"closed"|"open">` para repintar sin recargar; pila `undoStack` en memoria; banner con `role="status"`. El formulario de rango dentro de `<details>`.

**Fuera de alcance:** pedir citas fuera de regla por WhatsApp (D-R4-B-6), bloqueos recurrentes anuales ("cada 25 de diciembre"), historial de desfacer permanente, cambios al motor de disponibilidad.

## 4. Verificación ejecutada (Puppeteer, `flow-verify-ux1.mjs`)

Resultado: **✔ TODAS las verificaciones R4-B-UX-1 pasaron** (transcripción `/tmp/opencode/flow-verify-ux1.txt`).

```
1) día objetivo (con cupos, futuro): 2026-11-06
2) panel del día: {"open":true,"text":"viernes, 6 de noviembreDra. Mariana Solís×Este día no está bloqueado.MotivoFestivoVacacion"}
3) banner: "Día bloqueado: viernes, 6 de noviembre · Festivo · Dra. Mariana Solís" + Deshacer (1) + preview /agendar?service=terapia-individual&mode=presencial&pro=dra&dia=2026-11-06
4) BD tras bloquear: [{"id":10,"pro_id":"dra","date_from":"2026-11-06","date_to":"2026-11-06","kind":"festivo","note":"PRUEBA-UX1","active":1}]
5) casilla: aria-pressed=true, title="2026-11-06 · Bloqueado — clic para liberarlo"
6) preview paciente: paso=bk-paso4 mes="Noviembre 2026" día deshabilitado=true label="El profesional no atiende este día (Festivo: PRUEBA-UX1)."
7) clic Deshacer=true → BD bloqueos del día=0 → banner "Deshecho: Bloqueo de viernes, 6 de noviembre."
10) rango partido: id 11 → 2026-12-15..17 + id 12 → 2026-12-19..21
11) tras Deshacer: id 11 con 2026-12-15 → 2026-12-21 (mismo id, rango original)
12) limpieza: bloqueos creados por la prueba restantes = 0
```

## 5. Feedback del admin (pendiente — lo pidió el dueño)

El sprint cambia **cómo se hace la tarea**, así que necesita la opinión de quien la usa. Sesión propuesta (5 min, con el sitio corriendo):

| # | Tarea que hace el admin | Qué observamos |
|---|---|---|
| F-1 | Bloquear el festivo del 20 de noviembre para toda la clínica | ¿encuentra el día? ¿entiende el panel? ¿le basta el mensaje? |
| F-2 | Liberar solo el 18 de unas vacaciones ya bloqueadas (15→21) | ¿esperaba que el rango se partiera? ¿entiende el resultado? |
| F-3 | Equivocarse y corregir | ¿usa "Deshacer" o va a la lista? ¿confía en el deshacer? |
| F-4 | Comprobar que quedó bien | ¿el enlace "Ver cómo lo ve el paciente" le da seguridad o le sobra? |

Tres preguntas al cierre: **(a)** ¿qué tuviste que buscar o adivinar?, **(b)** ¿en qué momento no estuviste segura de si había quedado guardado?, **(c)** ¿qué sobra?

Respuestas registradas aquí mismo; si alguna es un cambio de fondo, va al backlog de R4-B-4 (gate) o a un UX-2.

## 6. Pasos que se probaron (guion original)

1. Login admin → pestaña Calendario → clic en un día libre → panel → Festivo → Bloquear → banner con día + "Deshacer" + enlace de preview → casilla en terracota sin recargar.
2. Clic en el día bloqueado → "Liberar este día" → día vuelve a su color → banner con su propio deshacer.
3. Bloqueo de rango → clic en un día del medio → Liberar → quedan dos rangos → **Deshacer** → vuelve el rango intacto (mismo id).
4. Enlace de preview abre `/agendar?...&dia=` con el día deshabilitado y el motivo legible.
5. Limpieza: borrar solo los bloqueos creados por la prueba; ajustes y BD como al inicio; `check:agenda` PASS.
