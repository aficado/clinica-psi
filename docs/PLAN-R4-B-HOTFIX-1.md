# PLAN R4-B-HOTFIX-1 — Ventana visible en el calendario + botones del flujo

**Tipo:** HOTFIX (corrección de comportamiento + botones del flujo de reserva)
**Fecha:** 2026-11-05
**Solicitud del dueño (literal):**
> "la ventana de reserva debe deshabilitar los días después de la cantidad puesta en el campo. sin mover nada más debes desactivar el botón de siguiente en la agenda de cita a menos que se hayan seleccionado los campos necesarios, caso contrario no debe aparecer activado, solo difuminado. el botón de siguiente solo debe estar debajo, y el botón de atrás siempre en la parte de arriba. el botón de siguiente debe estar abajo a la derecha y el botón de regresar debe ser específico y decir 'Regresar' con colores nítidos"

**Estado:** ✅ EJECUTADO y verificado (2026-11-05).

## 1. Qué está mal hoy

| # | Síntoma actual | Por qué |
|---|---|---|
| 1 | `Ajustes → ventana de reserva = 15` **no se ve** en el calendario: la persona puede elegir cualquier día del año y solo al final recibe "Solo puedes agendar entre mañana y dentro de 15 días" | `daySlotsFor` abre el año completo a propósito (decisión D-R4-B-1 de R4-B-3) y la ventana solo se valida al escribir la cita (`slotCandidateError`). El campo del panel no tiene efecto visual |
| 2 | En "¿Cuándo?" el botón **Continuar está arriba**, junto a "Volver", y **aparece/desaparece** (no se ve hasta elegir día y hora) | PB-1 de R4-B-BUG-1 subió la fila de acciones completa |
| 3 | En "Tus datos", **Confirmar cita** queda alineado a la izquierda y se ve **activo aunque falten datos**; el error llega al enviar | el botón vive suelto al final del `<form>`; la validación es del servidor |
| 4 | El botón de retroceso dice **"Volver"** y es de contorno tenue (variante `ghost`) | mismo sitio de PB-1 |

**Corrección del criterio de UX (deja sin efecto parcial el PB-1 de R4-B-BUG-1, por orden del dueño):** *Regresar* arriba · *Siguiente/Confirmar* **abajo a la derecha, siempre visible, difuminado y desactivado** hasta que el paso tenga lo necesario.

## 2. Product backlog del hotfix

| ID | Tipo | Historia | Criterios de aceptación | Estado |
|---|---|---|---|---|
| **HF-1** | Bug/UX | *Como persona que agenda, quiero ver **grisados** los días que caen fuera de la ventana de reserva, para no elegir una fecha imposible.* | Con `booking_window_days = N`: en `/agendar` (y en el reprogramar de `/mi-cita`, que comparte la regla) solo son seleccionables **mañana … mañana+N-1**; los demás días salen deshabilitados con motivo nuevo `"fuera_de_ventana"` y el aviso "la agenda abre hasta el <fecha límite>". Cambiar N en `Ajustes` se nota sin recargar código ni BD extra. La validación dura del servidor **no se toca** (sigue rechazando por API). El calendario anual del **admin** conserva el año completo (es vista de planeación, no de reserva). ✅ **ejecutado 2026-11-05**: `windowBounds()` (mañana … mañana+N-1) alimenta `daySlotsFor` (motivo nuevo `fuera_de_ventana`) y `slotCandidateError` con el mismo mensaje; el calendario público grisó los días fuera de ventana y muestra "Puedes agendar hasta el viernes, 20 de noviembre de 2026…". Comprobado con ventana=15: mes de enero → 31 días, **0 habilitados**, título "Fuera de la ventana de reserva…". La vista anual del admin conserva el año completo. |
| **HF-2** | UX | *Como persona que agenda, quiero un botón claro que diga **"Regresar"**, siempre **arriba**, con color nítido.* | Los 4 pasos con retroceso muestran `← Regresar` (variante sólida sage, texto blanco, icono de flecha a la izquierda) en la **primera línea** del paso; ningún botón de avance queda arriba. `aria-label` descriptivo ("Regresar a <paso>"). ✅ **ejecutado 2026-11-05**: `BackButton` (variante `secondary`, fondo sage, texto blanco, flecha ←) en la primera línea de Modalidad/Profesional/¿Cuándo?/Tus datos, con `aria-label="Regresar a <paso>"`. Geometría verificada: el botón queda **arriba** del `h2` en los 4 pasos. |
| **HF-3** | UX | *Como persona que agenda, quiero ver el botón **Siguiente abajo a la derecha** y **difuminado** mientras no haya elegido lo necesario.* | "¿Cuándo?": `Siguiente` fijo abajo, alineado a la derecha, `disabled` + opacidad hasta tener **día y hora**; pista discreta al lado ("Elige día y hora para continuar"). "Tus datos": `Confirmar cita` abajo a la derecha, `disabled` hasta cumplir lo mismo que exige el servidor: nombre ≥3, correo válido, teléfono vacío o ≥10 dígitos, consentimiento marcado; con la pista de qué falta. Nada más del flujo se mueve ni se cambia. ✅ **ejecutado 2026-11-05**: `Siguiente` (¿Cuándo?) y `Confirmar cita` (Tus datos) viven en una fila `justify-end` del pie del paso; `disabled` + `opacity-50` (Button ya lo aplica) hasta cumplir lo mismo que valida el servidor (`slotPicked`; nombre ≥3, correo válido, teléfono vacío o ≥10, consentimiento) y con pista en texto (`role="note"`). Probado: vacío → disabled "Escribe tu nombre completo.", nombre de 2 letras → disabled, teléfono "123" → disabled "El teléfono necesita 10 dígitos…", al marcar el consentimiento → habilitado → cita creada. |
| **HF-4** | QA/Docs | *Como dueño, quiero evidencia.* | `tsc` + build limpios; `npm run check:agenda` PASS; `flow-verify-final.mjs` actualizado a "Regresar" y pasa; suite nueva `flow-verify-hotfix1.mjs`: ventana 15 → día +20 deshabilitado con motivo y el límite visible; `Siguiente` deshabilitado/derecha antes de elegir y activo después; `Confirmar cita` deshabilitado con datos incompletos y habilitado al cumplirlos; geometría (Regresar arriba del contenido, Siguiente abajo y a la derecha); restaurar ventana 365 y borrar citas de prueba. Docs: `BACKLOG-R4-B.md` (fila), `ORGANIZACION-DEL-PROYECTO.md` (ronda 18), `ESTRUCTURA-DEL-CODIGO.md`, `BACKLOG-R4.md` (5.03). Commit + push `r4-b`. ✅ **2026-11-05**: `tsc` + build limpios; `check:agenda` PASS; **`flow-verify-hotfix1.mjs` → TODAS pasaron** (restaura ventana 365 y borra la cita que creó). Suites anteriores actualizadas al nuevo criterio y en verde: `flow-verify-final.mjs` (Regresar arriba / avance abajo-derecha / token de esta corrida visible en `/admin/horarios`), `flow-verify-r4b3.mjs` (la ventana ahora se comprueba grisando días; formulario de rango abierto desde `<details>`), `flow-verify-ux1.mjs`. Docs: esta + `BACKLOG-R4-B.md`, `BACKLOG-R4.md`, `ESTRUCTURA-DEL-CODIGO.md`, `ORGANIZACION-DEL-PROYECTO.md` (ronda 18). |

## 3. Diseño técnico

**`lib/schedule.ts`**
- `windowBounds(): { min: string; max: string }` = `addDaysIso(1)` … `addDaysIso(getBookingWindowDays())` — **la misma** que usa `slotCandidateError` (una sola fuente de verdad).
- `DayReason` gana `"fuera_de_ventana"`; `DaySlotsWithReason` gana `windowEndIso?: string` (para el aviso legible).
- `daySlotsFor`: si `dateIso` está fuera de `windowBounds()` → `{ hours: [], freeCount: 0, reason: "fuera_de_ventana", windowEndIso: max }` **antes** de mirar reglas/bloqueos.
- `monthSchedule` y las acciones (`fetchMonthSchedule`/`fetchDaySlots`) no cambian de firma: heredan el motivo. `/mi-cita` (reprogramar) también, porque usa los mismos días.
- `yearSchedule` (admin): **sin** la ventana — sigue mostrando el año completo para planear.

**`components/CalendarView.tsx`**
- Motivo nuevo en `dayTitle()`: "Fuera de la ventana de reserva: la agenda abre hasta el <fecha>."
- Cuando el mes mostrado tiene días fuera de ventana, línea de ayuda bajo la cuadrícula con el límite (usa `windowEndIso` del primer día que lo traiga).
- Días bloqueados por ventana quedan deshabilitados (ya ocurre: `freeCount = 0`) y sin el estilo de "cerrado" (terracota), para no confundir un bloqueo del admin con la política.

**`components/BookingFlow.tsx`**
- Fila superior de cada paso: `<Button variant="secondary">← Regresar</Button>` (antes `ghost` "Volver"); se elimina el botón de avance de esa fila.
- "¿Cuándo?": nueva fila `<div className="mt-6 flex flex-wrap items-center justify-end gap-3">` con pista + `Siguiente` (`disabled={!(dateIso && hour !== null)}`).
- "Tus datos": misma fila `justify-end` con `Confirmar cita` `disabled={submitting || !formReady}`, donde `formReady` replica las 4 reglas del servidor (sin tocar `submit`).

**No se toca:** motor de disponibilidad/bloqueo, anti-doble-reserva, vista anual del admin, panel de Ajustes, bloqueo por clic (R4-B-UX-1).

## 4. Verificación
`flow-verify-hotfix1.mjs` con ventana temporal = 15 días (se restaura al final) + `flow-verify-final.mjs` (PB-1 con el nuevo nombre). Se documenta el resultado en `ORGANIZACION-DEL-PROYECTO.md` ronda 18.

## 5. Resultado de la verificación (2026-11-05)

`flow-verify-hotfix1.mjs` (transcripción `/tmp/opencode/flow-verify-hotfix1.txt`):

```
0) ventana en BD = 15 (esperado 15)
1) sin elección: back arriba del h2, Siguiente abajo/derecha/disabled, nota "Puedes agendar hasta el viernes, 20 de noviembre de 2026…"
2) mes fuera de ventana: días=31 habilitados=0 · título "Fuera de la ventana de reserva: la agenda abre hasta el 2026-11-20."
4) Siguiente tras elegir día+hora: disabled=false
5) Tus datos vacío: disabled=true · "Escribe tu nombre completo."
7) teléfono de 3 dígitos: disabled=true · "El teléfono necesita 10 dígitos (o déjalo vacío)."
8) con consentimiento: disabled=false
9) cita creada: rv-883fb2e1534b679d
10) ventana restaurada=365; citas de prueba borradas=1
RESULTADO: ✔ TODAS las verificaciones del hotfix pasaron
```

Suite de R4-B-BUG-1 (`flow-verify-final.mjs`) re-expresada al nuevo criterio: ✔ TODAS pasaron (Regresar arriba, avance abajo-derecha, cita de esta corrida visible en `/admin/horarios`). Suites de R4-B-3 y R4-B-UX-1: ✔ en verde. `npm run check:agenda`: PASS.

**Nota:** la BD quedó con 10 citas `confirmada` de pruebas de rondas anteriores (varias con nombre "Cita de prueba…"). Se conservan por la regla de PB-3 de R4-B-BUG-1 (el dueño decide cuándo borrarlas); el panel solo lista como visibles las futuras con token.
