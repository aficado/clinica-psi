# PLAN R4-B-HOTFIX-2 — El calendario abre en el PRIMER mes permitido por la ventana

**Tipo:** HOTFIX (apertura del calendario + validación de estado restaurado)
**Fecha:** 2026-11-08
**Solicitud del dueño (literal):**
> "ajusté los días máximos a 60 y me mandó al último mes de selección de cita; quiero que cuando ponga un límite de días, al pedir cita me mande al primer mes que te permite, no al último"

**Estado:** ✅ EJECUTADO y verificado (2026-11-08).

## 1. Qué está mal hoy

| # | Síntoma | Causa |
|---|---|---|
| 1 | Con ventana 60 (9-nov → 6-ene) el calendario del paso "¿Cuándo?" quedó abierto en el **último mes** (ene-2027) | al restaurar la cookie `booking_state`, `CalendarView` abre en el mes del **día restaurado** (`dateIso.slice(0,7)`), y la fecha guardada (ene-2027, elegida cuando la ventana era 365) **nunca se re-validó** contra la ventana nueva: sigue seleccionada y el botón "Siguiente" queda activo con una fecha imposible (el rechazo llega hasta el final, al enviar) |
| 2 | Si el primer mes de la ventana no tiene ningún horario del profesional (p. ej. bloquearon todo noviembre), el paciente aterriza en un mes todo gris | nada busca el **primer mes con cupo** — se abre siempre en el mes de hoy |

## 2. Product backlog del hotfix

| ID | Historia | Criterios de aceptación | Estado |
|---|---|---|---|
| **H2-1** | *Como paciente, al entrar al paso "¿Cuándo?" quiero que el calendario se abra en el **primer mes donde sí puedo agendar**.* | (a) Mes restaurado/cerrado **después** del límite de ventana → salta de vuelta al primer mes posible (mes de mañana). (b) Mes con **0 días libres** (todo cerrado/sin cupo/fuera de ventana) → avanza solo, mes a mes, hasta el primero con ≥1 día libre; se detiene en el último mes de la ventana con aviso razonable y tope de 12 saltos. (c) Cambiar de profesional re-ancla (el profesional nuevo puede no atender el mes visto). (d) Con `?dia=` (previsualización del admin) **no** se mueve nada: el día de preview manda. ✅ **ejecutado 2026-11-08**: `CalendarView` recibe `initialMonth` (ya no restaura el mes de una cookie vieja) y un anclaje que, si el mes visible no tiene ni un horario dentro de la ventana, salta al primer mes permitido: retrocede al mes de inicio si quedó después del límite (`windowStartIso`) y avanza mes a mes (tope 12) hasta el primer mes con cupo real; se detiene al agotar la ventana o en cuanto el usuario navega. Registra el mes de los `slots` (`slotsMonth`) para no decidir con datos del mes anterior (eso causaba un doble salto Nov→Dic→Ene). Cambiar de profesional re-ancla; con `?dia=` (preview del admin) el anclaje queda desactivado. Comprobado: ventana 60 → aterriza en **noviembre 2026**; noviembre bloqueado entero → aterriza en **diciembre 2026** (no en enero). |
| **H2-2** | *Como paciente, una fecha guardada que quedó fuera de la ventana (o fue bloqueada/ocupada desde entonces) no debe dejarme avanzar.* | Al montar (sin `?dia=`), el primer `dateIso` con profesional se valida con `fetchDaySlots`: si el día perdió todo cupo o quedó fuera de ventana → se **descarta** día+hora y el paso retrocede a "¿Cuándo?" (el calendario se re-centra por H2-1); si solo la **hora** elegida fue ocupada → se quita la hora y se conserva el día. La validación dura del servidor sigue intacta. ✅ **ejecutado 2026-11-08**: al montar, la primera fecha seleccionada se re-valida con `fetchDaySlots`: si perdió el cupo o quedó fuera de la ventana → se borran día+hora (y el paso retrocede si estaba en "Tus datos"), el calendario re-ancla y "Siguiente" queda desactivado; si solo la hora fue ocupada → se conserva el día y se quita la hora. Con `?dia=` no se valida (el preview se muestra tal cual). Comprobado: cookie con 2027-03-08 (fuera de ventana 60) → se descarta (`fechaCookie=null`, 0 días seleccionados) y aterriza en noviembre; cookie con una fecha válida del último mes (2027-01-07) → aterriza en noviembre y conserva la selección. |
| **H2-3** | *Evidencia y colateral.* | Suites `flow-verify-hotfix1` y `flow-verify-r4b3` dejaban la ventana en 365 al terminar; ahora **restauran el valor que encontró el dueño** (60). Suite nueva `flow-verify-hotfix2.mjs`: apertura en nov-2026 con ventana 60; cookie vieja con día jun-2027 → descarta y abre noviembre con "Siguiente" desactivado; bloqueo de todo noviembre → abre **diciembre** solo. `tsc`+build+`check:agenda`+4 suites previas en verde. ✅ **2026-11-08**: `tsc` + build limpios; `check:agenda` PASS; **`flow-verify-hotfix2.mjs` → ✔ TODAS** (A–E + Z: ventana sigue en 60, 0 bloqueos de prueba); suites previas re-expresadas y en verde: `flow-verify-hotfix1` y `flow-verify-r4b3` ahora **restauran la ventana/ajustes que encontraron** (60, no 365), `flow-verify-ux1` y `flow-verify-final` sin cambios de criterio. Docs: esta + `BACKLOG-R4-B.md`, `BACKLOG-R4.md`, `ESTRUCTURA-DEL-CODIGO.md`, `ORGANIZACION-DEL-PROYECTO.md` (ronda 19). |

## 3. Diseño técnico

**`components/CalendarView.tsx`** (todo cliente, sin acciones nuevas; usa el `windowEndIso` que ya traen los días fuera de ventana):
- Estado de anclaje en `useRef` (`{ tuned, back, steps }`), reseteado al cambiar `proId` (no en el primer montaje, que respeta el día restaurado).
- Efecto de anclaje tras cada carga de mes: si hay ≥1 día libre (futuro) → anclado; si no: mes después del límite → salta **una vez** hacia atrás al mes de hoy; mes dentro del límite → `mes siguiente` (tope 12, se detiene en el mes del límite); mes antes de la ventana/sin datos → igual hacia adelante.
- Si `dateIso` pasa de tener valor a `null` (H2-2 descartó la fecha) → re-ancla al mes de hoy y vuelve a buscar.

**`components/BookingFlow.tsx`**:
- Efecto único (`slotCheckedRef`) después del restore: `fetchDaySlots(dateIso, proId)` → descarta día+hora (y baja el paso a 3) si ya no hay cupo, o solo la hora si fue ocupada. Con `?dia=` se omite (el preview del admin se muestra tal cual).

**No se toca:** motor (`windowBounds`/`daySlotsFor`), validación de `createAppointment`, vista del admin, flujo de pasos ni estilos de botones.

## 4. Verificación
`flow-verify-hotfix2.mjs` (escenarios a–c de arriba, con ventana 60 real del dueño) + regresión de las 4 suites existentes + `check:agenda`. La BD termina como la encontró: ventana 60, `date_exceptions` = 0, sin citas nuevas.

## 5. Resultado de la verificación (2026-11-08)

`flow-verify-hotfix2.mjs` con la ventana real del dueño (**60 días** → 2026-11-09 … 2027-01-07), transcripción en `/tmp/opencode/flow-verify-hotfix2.txt`:

```
A) aterrizaje nuevo: "Noviembre 2026" (esperado) ✔ · Siguiente desactivado
B) cookie vieja con cita 2027-01-07 (aún dentro de ventana): aterriza en "Noviembre 2026" ✔ (conserva la selección)
C) cookie fuera de ventana (2027-03-08): mes "Noviembre 2026", Siguiente disabled=true, fechaCookie=null, días sel=0 ✔
D) noviembre bloqueado entero: aterriza en "Diciembre 2026" (primer mes con cupo) ✔
E) preview ?dia=2027-02-06: mes "Febrero 2027", Siguiente disabled=true ✔ (el anclaje no mueve el preview)
Z) ventana sigue=60 · bloqueos de prueba restantes=0 ✔
RESULTADO: ✔ TODAS las verificaciones R4-B-HOTFIX-2 pasaron
```

Regresión: `flow-verify-hotfix1` ✔ (restaura 60), `flow-verify-r4b3` ✔ (restaura cutoff/ventana/zona encontrados), `flow-verify-ux1` ✔, `flow-verify-final` ✔, `npm run check:agenda` PASS.

**Nota:** `flow-verify-hotfix1.mjs` y `flow-verify-r4b3.mjs` dejaban la ventana en 365 al terminar; ahora capturan los ajustes al inicio y los restauran, para no pisar los del dueño.
