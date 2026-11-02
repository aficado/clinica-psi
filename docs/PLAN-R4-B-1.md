# PLAN DE ACCIÓN — Sprint R4-B-1: Motor + disponibilidad + cookies

> **Release intermedio:** R4-B (agenda completa). **Objetivo del sprint:** el calendario público muestra cualquier día del año, la disponibilidad se lee como "día disponible/fuera de regla/sin cupo" y la programación del paciente sobrevive recargar o navegar (`booking_state` en cookies).
> **Estado:** 2026-11-01 — inicializado: acciones 1–4 ejecutadas, build limpio, `check:agenda` PASS.
> **Ronda de corrección (2026-11-01):** tras revisar el flujo reportado como "bugeado" se corrigieron 10 defectos del refactor (ver §Corrección de bugs abajo); `tsc` + build limpios, `check:agenda` PASS, `:3000` reiniciado.
> **Largo:** 2–3 días. **Gate (R4-B-1):** `/agendar` navega a cualquier mes; el día fuera de regla se explica; la selección sobrevive un reload.

---

**Ejecutado (2026-11-01):**
- ✅ Acción 1: `lib/cookies.ts` (`setBookingState`, `getBookingState`, `clearBookingState`).
- ✅ Acción 2: motor día-a-día — `getRule`, `daySlotsFor`, `monthSchedule`, `BOOKING_WINDOW_DAYS = 365`; el anti-doble-reserva (BD, `BEGIN IMMEDIATE` + índice parcial) **intacto**.
- ✅ Acción 3: `components/CalendarView.tsx` — grid de mes entero, navegación por años, día disponible con contador, día fuera de regla con motivo.
- ✅ Acción 4: `BookingFlow.tsx` integrado (paso "Cuándo" = CalendarView), cookies en cada selección, estado restaurado al montar.
- ✅ Documentación actualizada: `BACKLOG-R4.md` (R4-B como intermedia), `docs/BACKLOG-R4-B.md` (nuevo backlog), `README.md`, `ORGANIZACION` (crónica + D-siguientes pasos), `ESTRUCTURA` (archivos nuevos).
- ✅ Plan: este archivo.

---

## Acción 1 — `lib/cookies.ts`: helpers para `booking_state` (día 1, mañana)

El paciente selecciona servicio → modo → profesional → día → hora. Si recarga o va a `/privacidad`, el estado actual se pierde. R4-B-1 lo mantiene:

```ts
// lib/cookies.ts
export const COOKIE_NAME = "booking_state";
export const COOKIE_DAYS = 7;

/** Guardar (JSON serializable) en `booking_state`; sobreescritura por key. */
export function setBookingState(partial: Record<string, unknown>): void;
/** Leer el estado completo; `{}` si no existe. */
export function getBookingState(): Record<string, unknown>;
/** Borrar `booking_state` (se confirmó la cita o se agendó otra). */
export function clearBookingState(): void;
```

- Solo cookies técnicas de sesión (`SameSite=Lax`, sin `Secure`/httpOnly para que el cliente las lea — no contiene datos sensibles: solo slugs/hora/fecha).
- El componente lee al montar (`useEffect`), y si hay estado guardado restaura el paso actual (`step`).

## Acción 2 — Motor de disponibilidad día por día (`schedule.ts`, R4-B) (día 1–2)

Sustituir `openSlotsFor(window)` por una API basada en **días**:

```ts
/** Regla extendida: pro_id + día de la semana → open/close (+ sábado opcional). */
export function getRule(proId: string, dateIso: string): RuleView | undefined;

/** ¿Cuántos horarios libres tiene `dateIso` para el pro? Incluye motivo si no hay. */
export function daySlotsFor(dateIso: string, proId: string): DaySlots | { ok: false; error: string };

/** Vista de la ventana completa del mes (para `/admin/horarios`). */
export function monthSchedule(proId: string, dateIso: string): MonthView[];
```

- `BOOKING_WINDOW_DAYS` (365) se mantiene como constante **configurable** por decisión de negocio (D-R4-B-5).
- Si un día cae fuera de las reglas → `{ ok: true, hours: [] }` + motivo ("no atiende ese día") → el grid lo pinta inactivo con tooltip.
- La garantía anti-doble-reserva (`BEGIN IMMEDIATE` + `ux_appt_slot`) **se mantiene** en `createAppointment`/`rescheduleAppointment` (sin tocar).

## Acción 3 — `components/CalendarView.tsx`: grid de mes entero (día 2–3)

El nuevo componente que reemplaza el `<div class="flex flex-wrap gap-2">` de R4-A:

- Navegación: `<` `/` `>` por meses; selector de año.
- Grid: 7 columnas Lun–Dom, días con número + contador de horarios libres (si hay).
- Día disponible → botón clicable (mismo estilo `btn`, `border-sage`, `rounded-(--radius-btn)`); día fuera de regla → inactivo con motivo al pasar el cursor.
- Al elegir un día disponible → se muestra el grid de horas (`timeLabel`), tachados los ocupados.
- En móvil: columna única; en desktop: sidebar mes + detalles.
- Pausa para la sesión y estado compartido con `BookingFlow.tsx`.

## Acción 4 — Unir todo en `BookingFlow.tsx` (día 3)

- El paso "Cuándo" monta `CalendarView` en vez del grid de botones.
- Cada cambio de selección (`pickService`, `pickModality`, `pickPro`, `pickDate`) escribe la cookie (`setBookingState`).
- Al montar: `getBookingState()` → restaura `serviceSlug`, `modality`, `proId`, `dateIso`, `hour`, `step`.
- El botón "Continuar" lleva al paso de datos; el formulario y los campos mantienen lo del navegador (cookies) por si hay reload.

## Acción 5 — Prueba determinista y cierre (día 4–5)

1. `/agendar`: elegir cualquier día de cualquier mes → se pinta con su motivo.
2. Ir a `/privacidad`, volver: selección intacta.
3. `npm run check:agenda` sigue PASS (sin tocar).
4. Actualizar `docs/BACKLOG-R4-B.md` (status), README §2 y ORGANIZACION crónica si cambió algo relevante.

---

## Corrección de bugs (2026-11-01)

El dueño reportó `/agendar` "bugeado". Causa: defectos del refactor R4-B-1. Corregido:

1. **Máquina de pasos rota** (`BookingFlow`): `pickModality`/`pickPro`/Continuar saltaban a pasos 5–7 equivalentes a la pantalla "done" vacía (página en blanco al elegir modalidad). Restaurada la semántica R4-A: 0=Servicio, 1=Modalidad, 2=Profesional, 3=Horario, 4=Tus datos; 5=done solo tras confirmar.
2. **Mes con formato roto** (`CalendarView`): el estado era `YYYY-MM-DD` (o UTC con off-by-one); la navegación producía `Invalid Date → NaN` y el grid quedaba vacío. Ahora SIEMPRE `YYYY-MM` local; `getLastDayOfMonth` usa `new Date(año, mes, 0)` (tolerante a ambos formatos, bisiestos correctos).
3. **`prev(2026-01)` = `2026-12`**: mesPrev no decrementaba el año. Corregido (`2025-12`); ídem `next(2026-12) → 2027-01`.
4. **`fetchMonthSchedule` vaciaba el mes actual**: comparaba `"2026-11"` (mes) < `"2026-11-01"` (hoy) → true → días `[]`. Se compara MES contra MES.
5. **Horas no seleccionables**: los horarios eran `<span>` sin `onClick`; ahora son botones (se puede cambiar la hora sin salir del calendario), ocupados tachados y deshabilitados.
6. **Grid sin alinear ni rellenar**: el día 1 caía siempre en la 1.ª columna; ahora hay huecos de alineación por día de semana (Lun=0) y los días sin datos se rellenan como casillas inerte (no huecos vacíos).
7. **Días pasados accesibles**: ahora deshabilitados también en el cliente `< today` local.
8. **Restauración de cookies sin validar**: se restauraba servicio/pro/hora inexistente y paso sin clamp (pantalla vacía). Ahora se valida en cadena contra el catálogo (`services`, `professionalsFor`, regex ISO, hora 0–23), el paso se clampea a 0–4 y la cookie se re-normaliza.
9. **Cookies incompletas**: `writeState` faltaba en `pickService`; `clearDownstream` no limpiaba las cadenas invalidadas (cada pick ahora escribe el estado completo con `null` = borrado); `monthIso` se guarda/restaura; `reset()` y el éxito del submit llaman `clearBookingState()`.
10. **`onNavigate` nunca invocado y `pickDate` obsoleto**: la navegación de mes ahora también avisa al flujo (le de persistir el mes en la cookie); `pickDate` eliminado.

Verificación: `tsc` limpio; build OK; `:3000` con el nuevo build; `check:agenda` PASS; `/agendar`, `/privacidad`, `/mi-cita/…` 200; sin errores en el log del servidor.

## Notas técnicas

- **No** se toca la BD hasta el sprint R4-B-2 (servicios/profesionales en panel); aquí solo cambio de motor + UI + cookies.
- **RBAC**: no aplica al calendario público (cualquiera lo ve). Solo al admin (`/admin/horarios`, `/admin/servicios`, `/admin/profesionales`).
- Si el dueño no aprueba D-R4-B-5 (ventana de un año), se vuelve a `site_settings` (R4-B-3, Ajustes) antes del gate.
