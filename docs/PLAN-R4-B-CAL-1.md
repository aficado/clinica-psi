# PLAN R4-B-CAL-1 — Refactor de Agenda y calendario (por profesional y por mes)

**Tipo:** REFACTOR + FIX
**Fecha:** 2026-11-11
**Solicitud del dueño (resumen):**
> No desplegar los horarios de todos los profesionales de golpe: elegir experto y ver solo los suyos. Poder bloquear cualquier día (lun–dom), para uno o varios profesionales (casillas), con hora de inicio/fin en 24 h y una nota solo para el admin. Las horas agendables deben ser n…p (inclusive), no n…p-1. El calendario anual debe mostrar solo el mes elegido. Todo reactivo en teléfono.

**Estado:** ✅ EJECUTADO y verificado (2026-11-11).

## 1. Diagnóstico

| # | Problema | Causa |
|---|---|---|
| 1 | Pestaña **Horarios** larguísima | Renderiza una tarjeta con todas las reglas de **todos** los profesionales a la vez. |
| 2 | **Calendario** larguísimo | Pinta los **12 meses** en una sola rejilla. |
| 3 | Bloqueo rígido | Solo un profesional (o toda la clínica) y solo día completo; sin horas. La nota del bloqueo se filtra al paciente en el tooltip. |
| 4 | Horas n…p-1 | Ya corregido en R4-B-PROF-1 para reglas; falta revisar que los bloqueos por hora respeten el rango inclusivo y que no quede ningún borde exclusivo. |

## 2. Product backlog

| ID | Historia | Criterios | Estado |
|---|---|---|---|
| **CL-1** | *Como admin, elijo un profesional y veo solo su horario semanal.* | Selector de profesional en la pestaña Horarios; una sola tarjeta; en móvil los campos se apilan; añadir/quitar días igual que antes. ✅ **2026-11-11**: selector «Profesional» en la pestaña Horarios; se renderiza **una sola tarjeta** con sus reglas (antes todas). En 390 px los campos se apilan. Suites: 1 tarjeta y cambio de profesional verificado. |
| **CL-2** | *Como admin, elijo mes y año y veo solo ese mes.* | Selector de mes + flechas; una sola rejilla (`max-w-md`), celdas táctiles; responsive; conserva año/mes en la URL. ✅ **2026-11-11**: el calendario muestra **un mes** (`max-w-md`, celdas aspect-square) con selector de mes + flechas de año; la URL guarda `year` y `month`. Móvil 390 px sin desbordes (también se corrigió el `pl-60` fijo del layout del panel). |
| **CL-3** | *Como admin, bloqueo un día para varios profesionales a la vez.* | Checkboxes por profesional (uno o varios) en el panel del día; se aplica a todos los marcados; «toda la clínica» sigue disponible. ✅ **2026-11-11**: en el panel del día hay **casillas por profesional** (uno o varios) + «Toda la clínica»; `blockDaysAction` aplica el bloqueo a todos los marcados en una sola operación con auditoría. |
| **CL-4** | *Como admin, bloqueo por horas (24 h) con inicio y fin.* | `date_exceptions` gana `start_hour`/`end_hour` (null = día completo); el rango es inclusivo (9–12 bloquea 9,10,11,12); el día sigue abierto fuera del rango; validación del servidor rechaza esas horas. ✅ **2026-11-11**: `date_exceptions` gana `start_hour`/`end_hour` (null = día completo). El panel permite «Todo el día» o «Solo una franja» (0–23, inclusiva). `daySlotsFor` resta las horas bloqueadas sin cerrar el día y `slotCandidateError` las rechaza. Probado: 9–12 bloqueadas → el público solo ofrece 13:00–17:00. |
| **CL-5** | *La nota es solo del admin.* | La nota ya no aparece en el tooltip público ni en mensajes al paciente; solo en el panel. ✅ **2026-11-11**: la nota ya no se filtra al paciente: las etiquetas públicas usan solo el tipo (`exceptionKindLabel`). Verificado: el texto `PRUEBA-CAL1` no aparece en `/agendar`. |
| **CL-6** | *Horas agendables n…p (inclusive).* | Revisión completa: `daySlotsFor`, `slotCandidateError`, UI y pruebas con 7–20 ⇒ 20:00 disponible. ✅ **2026-11-11**: rango inclusivo n…p en reglas y bloqueos (`h <= close`); con 7–20 el calendario ofrece 20:00. |
| **CL-7** | Verificación | Suite nueva/actualizada (mes único, selector de pro, bloqueo multi-pro con horas, nota privada) + regresión de agenda + móvil 390 px + `tsc`/build; docs y push. ✅ **2026-11-11**: suite nueva `flow-verify-cal1.mjs` (una tarjeta, un mes, bloqueo 2 pros con franja 9–12, nota privada, horas restantes 13–17, móvil sin desborde) → ✔ TODAS; regresión `check:agenda`, UX-1, R4-B-3, hotfix-1/2 y final en verde; `tsc`+build limpios; docs y push. |

## 3. Diseño

- **BD**: `ALTER TABLE date_exceptions ADD COLUMN start_hour INTEGER; ADD COLUMN end_hour INTEGER;` (null = todo el día).
- **Motor** (`lib/schedule.ts`): `blockedHours(proId, dateIso)` resta horas bloqueadas a `daySlotsFor`; `slotCandidateError` las rechaza; `blockDay`/`saveException` aceptan horas; etiqueta pública por **tipo** (sin nota).
- **Acciones** (`lib/schedule/actions.ts`): `blockDaysAction(proIds[], dates[], kind, note, startHour, endHour)` con RBAC/auditoría/revalidate; se conservan `blockDayAction`, `freeDayAction`, `undoDayAction` para el panel y las suites.
- **UI** (`components/admin/ScheduleManager.tsx`): pestaña Horarios con selector; pestaña Calendario con selector mes/año y una rejilla; panel del día con checkboxes de profesionales, «todo el día» + horas, motivo y nota privada.
- **Página** (`app/admin/horarios/page.tsx`): parámetro `month` (YYYY-MM) acotado al año.

## 4. Fuera de alcance
Motor de reserva pública (solo hereda), datos existentes, pestaña Citas.
## 5. Evidencia (2026-11-11)

```
1) Horarios: 1 tarjeta y selector de profesional (cambio Dra. → Manuel) ✔
3) Calendario: 1 grilla de mes + selector (noviembre → diciembre) ✔
6) Bloqueo para 2 profesionales, 9–12, nota PRUEBA-CAL1: 2 filas con start/end en BD ✔
7) Público: horas 9–12 cerradas; quedan 13:00–17:00; la nota NO aparece ✔
8) Móvil 390 px: calendario visible, sin desborde horizontal ✔
Regresión: check:agenda PASS · UX-1 · R4-B-3 · hotfix-1 · hotfix-2 · final ✔
```
