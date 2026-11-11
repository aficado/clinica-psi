# PLAN R4-B-PROF-1 — Profesionales: modalidades, horario inclusivo y refactor del módulo

**Tipo:** FIX + REFACTOR (módulo `/admin/profesionales` y motor de disponibilidad)
**Fecha:** 2026-11-11
**Solicitud del dueño (literal):**
> "agregué un terapeuta Manuel Mashiagui… al hacer una cita con él me salió que no atendía esa modalidad, cuando claramente me dejaba seleccionarla… ni siquiera me deja ponerle la modalidad en línea o presencial a los profesionales… la cantidad de horas que atienden va de x a y-1 cuando debería ser desde x a y. Arregla eso."

**Estado:** ✅ EJECUTADO y verificado (2026-11-11).

## 1. Diagnóstico (reproducido 2026-11-11)

| # | Síntoma | Causa real |
|---|---|---|
| 1 | Con Manuel, «Terapia de pareja · En línea» se puede elegir y al confirmar dice **"Ese profesional no atiende este servicio en esa modalidad"** | `slotCandidateError` llamaba `professionalsFor(svc, modality)` **sin pasar los profesionales de la BD**, así que validaba contra la **lista demo de `lib/data.ts`** (donde Manuel no existe). El flujo UI sí usa la BD → ve a Manuel; el servidor no → lo rechaza. |
| 2 | El panel **no tiene** el campo modalidad | `professionals` nunca tuvo modalidades: `professionalsFor` solo filtraba por servicio. Cualquier profesional aparecía en presencial y en línea, aunque no ofreciera una. |
| 3 | El horario configurado «7 a 20» ofrece citas 7:00…**19:00** | `daySlotsFor` y `slotCandidateError` usan `h + duración <= close`: el cierre era exclusivo. El dueño espera que la última hora configurada **también** sea agenda-ble (rango inclusivo `x…y`). |

## 2. Product backlog

| ID | Historia | Criterios de aceptación | Estado |
|---|---|---|---|
| **PF-1** | *Como admin, quiero marcar si cada profesional atiende **presencial**, **en línea** o ambos.* | Columna `professionals.modalities_json` (migración); el formulario tiene checkboxes (al menos una); la lista muestra badges; `professionalsFor` filtra por modalidad; en `/agendar` solo aparecen los profesionales que la ofrecen; si no queda ninguno, mensaje claro. ✅ **2026-11-11**: columna `modalities_json` (migración idempotente, default ambas); el formulario tiene sección **Modalidades** (Presencial / En línea, al menos una) y la lista muestra badges; `professionalsFor` filtra por modalidad. Probado: quitar «En línea» a Manuel → desaparece del paso de profesional en `/agendar` (modo en línea) y sigue en presencial; volver a marcarla → reaparece. |
| **PF-2** | *Como admin, quiero que el rango de horas sea **inclusivo** (`x…y`).* | Con «primera cita 7» y «última cita 20», el último horario ofrecido es **20:00** (no 19). Motor (`daySlotsFor` y `slotCandidateError`) y etiquetas del panel alineados («Primera cita» / «Última cita»). ✅ **2026-11-11**: rango **inclusivo** en `daySlotsFor` (`h <= close`) y `slotCandidateError` (`hour <= close`); etiquetas del panel «Primera cita» / «Última cita». Verificado con Manuel (7–20): el calendario ofrece **14 horarios, 7:00 … 20:00** (antes 13 y hasta 19). |
| **PF-3** | *Como paciente, no quiero que el servidor me rechace una modalidad que la UI me ofreció.* | `slotCandidateError` valida contra `getProfessionals()` (BD), nunca contra la lista demo. Reproducción del caso Manuel: alta en línea **exitosa**. ✅ **2026-11-11**: `slotCandidateError` valida con `getProfessionals()` (BD). Reproducción del bug: «Terapia de pareja · En línea · Manuel» antes fallaba; ahora **la cita se crea** (`rv-…`) y el registro de prueba se borra al terminar. |
| **PF-4** | *Como admin, quiero un módulo de profesionales claro y sin ruido.* | Formulario por secciones (Identidad · Servicios · Modalidades · Días y horas), validación en línea (nombre, ≥1 servicio, ≥1 modalidad, ≥1 día, primera < última), sábado solo si está marcado, sin chip «TODO: profesional de muestra»; lista con badges de modalidad, días, horario y enlaces a Agenda; botones Editar / Activar-Inactivar / Baja. ✅ **2026-11-11**: `ProfessionalsManager` refactorizado en 5 secciones (Identidad · Servicios · Modalidades · Días · Horario), validación en el cliente con mensajes claros, sábado solo si está marcado, sin `TODO: profesional de muestra` (también se quitó del flujo público), lista con badges de modalidad, «citas de 07:00 a 20:00» y acceso a Agenda. |
| **PF-5** | Evidencia | `tsc`+build, `check:agenda`, suite de reserva (Manuel en línea), comprobación de que un pro solo-presencial no aparece en línea, 14 horarios 7…20, regresión de las suites de agenda; docs (`PLAN`, `BACKLOG-R4-B`, `ESTRUCTURA`, `ORGANIZACION`). Commit+push `r4-b`. ✅ **2026-11-11**: `tsc` + build limpios; `check:agenda` PASS; `flow-verify-hotfix2`, `flow-verify-final`, `flow-verify-r4b3`, `flow-verify-hotfix1` y `flow-verify-ux1` en verde; pruebas manuales de modalidad y de horario inclusivo con Manuel (BD restaurada a ambas modalidades). Docs: este plan + `BACKLOG-R4-B`, `BACKLOG-R4`, `ESTRUCTURA`, `ORGANIZACION` (ronda 20). |

## 3. Diseño técnico

- **BD** (`lib/db.ts`): `ALTER TABLE professionals ADD COLUMN modalities_json TEXT NOT NULL DEFAULT '["presencial","enlinea"]'` (idempotente, patrón de migraciones).
- **Datos** (`lib/professionals.ts`): fila/vista `modalities`; semilla con modalidades del demo; `getProfessionals()` las expone.
- **Motor** (`lib/schedule.ts`): `professionalsFor(svc, modality, getProfessionals())`; rango inclusivo `h <= rule.close` y `hour <= rule.close`.
- **Filtro** (`lib/slots.ts`): `professionalsFor` exige que el pro incluya la modalidad (vacío/ausente = ambas, compatibilidad).
- **Panel** (`components/admin/ProfessionalsManager.tsx`): refactor del formulario y de la lista descrito en PF-4.

## 4. Fuera de alcance
Reglas finas por día (`/admin/horarios`) se mantienen; no se re-siembran datos ni se tocan citas existentes.
## 5. Evidencia (2026-11-11)

```
Antes:  Terapia de pareja · En línea · Manuel → "Ese profesional no atiende este servicio en esa modalidad."
Ahora:  la cita se crea correctamente (y el registro de prueba se borra).
Horario: Manuel 7–20 → /agendar muestra 14 horarios, de 7:00 a 20:00 (inclusivo).
Modalidad: sin «En línea» desaparece del flujo en línea; sigue en presencial; al reactivarla vuelve.
Formulario: Identidad · Servicios que atiende · Modalidades · Días de atención · Horario de citas.
Regresión: check:agenda PASS · hotfix2/final/r4b3/hotfix1/ux1 ✔
```
