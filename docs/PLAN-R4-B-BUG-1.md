# PLAN — Sprint R4-B-BUG-1: Corrección de bugs de UX del flujo de agendado (R4-B)

> **Sprint intermedio** entre R4-B-2 (ejecutado) y R4-B-3 (ajustes de agenda, aplazado).
> **Origen:** revisión del dueño el 2026-11-02 ("verifiquemos primero un par de cosas") +
> batería de pruebas del flujo como persona (Puppeteer, 6 tipos de caso × 3 corridas).
> **Gate del sprint:** el flujo `/agendar` retrocede con "Volver" visible ARRIBA en cada
> paso, los horarios ocupados NO se muestran (desaparecen), y las citas de prueba quedan
> visibles en `/admin/horarios` para revisión del dueño.

---

## Product backlog de mejoras del apartado "agendar citas"

| ID | Tipo | Historia de usuario | Criterio de aceptación | Estado |
|---|---|---|---|---|
| **PB-1** | Bug/UX | *Como persona que agendo, quiero ver el botón "Volver" ARRIBA de cada paso, no hasta abajo, para no tener que recorrer toda la pantalla (y en el calendario, para no perderme).* | En los pasos Modalidad, Profesional, ¿Cuándo? y Tus datos el botón "Volver" aparece en la PRIMERA línea del cuerpo del paso (encima del contenido). La acción principal (Continuar/Confirmar) conserva su lugar natural. | ✅ **verificado 2026-11-02**: Puppeteer confirmó filas de acciones arriba en los pasos 1–3; el paso 4 (`<form>`) corregido en código. |
| **PB-2** | Bug/UX | *Como persona que elige hora, los horarios ya reservados no deben verse tachados: quiero que desaparezcan y solo vea los horarios que de verdad puedo elegir.* | En el detalle del día, los horarios con `taken` NO se renderizan; si el día elegido se queda sin libres, se muestra el aviso "Ya no quedan horarios libres para este día." (cfr. caso de carrera: el hueco puede ocuparse mientras la persona llena sus datos). | ✅ **verificado 2026-11-02**: una persona simulada eligió un día y agendó — los horarios ya reservados ya no se muestran. |
| **PB-2b** | Bug (corregido antes del sprint, ronda 15) | *(previo a PB-1)* En ¿Cuándo?, si la persona aún no eligió fecha/hora, el botón "Volver" no existía — la persona quedaba atrapada en el calendario. | "Volver" visible en ¿Cuándo? desde el primer momento (con o sin hueco elegido). Probaron 4 runs con Puppeteer: visible=1 en los 4. | ✅ |
| **PB-3** | Datos/verificación | *Como dueño, quiero ver las citas de prueba en `/admin/horarios` hasta que yo las apruebo.* | VERIFICADO: no es un bug de software — la limpieza automática de la batería de pruebas borró las 6 citas de prueba antes de que el dueño las mirara. Regla del sprint: las citas creadas por pruebas SE CONSERVAN en la BD (el dueño es quien puede pedir borrarlas). | ✅ **confirmado por el dueño (2026-11-02)**: vio 2 citas de prueba (`rv-ce82c2b823d51dc8`, `rv-fbaecae5c25f6867`) en `/admin/horarios` con servicio, profesional, modalidad y 60 min. |
| **PB-4** | Mejora (futura, NO en este sprint) | Los números del "Progreso de la reserva" (1. Servicio … 5. Tus datos) no son clicables: navegar a un paso ya visitado exige "Volver" varias veces. | Los pasos ya visitados se vuelven clicables (click → salta al paso, conservando el estado posterior intacto). | ⬜ propuesto (espera prioridad del dueño) |
| **PB-5** | Mejora (futura, NO en este sprint) | Al retroceder con "Volver" no queda señal visual de lo ya elegido (el servicio/modalidad/profesional elegidos no se resaltan). | Al regresar a un paso anterior, la selección vigente se ve resaltada (aria-pressed) para confirmar sin re-elegir. | ⬜ propuesto |
| **PB-6** | Mejora (futura, NO en este sprint) | Al dar el "Continuar" y tras elegir la hora/pasillo, el scroll de la página no sube: en móvil la persona puede no ver el nuevo paso de una sola vez. | Al cambiar de paso, hacer scroll al tope del flujo (scrollIntoView del bloque). | ⬜ propuesto |

**Fuera de alcance** (junto con R4-B-3): excepciones por fecha (vacaciones), cutoff/ventana/zona horaria, calendario anual en el panel admin.

---

## Ejecución

### Acción 1 — PB-2: ocultar horarios ocupados (`components/CalendarView.tsx`)

Hoy:

```tsx
<p className="text-sm text-ink-soft">Elige la hora (los horarios tachados están reservados):</p>
{day.hours.map((s) => (
  <button disabled={s.taken} className={... s.taken ? "line-through" : ...}>{s.hour}:00</button>
))}
```

Cambio: `const libres = day.hours.filter((s) => !s.taken);` — se renderiza SOLO `libres`;
si `libres.length === 0` aparece el aviso en su lugar. Caption: "Elige la hora disponible:".

### Acción 2 — PB-1: "Volver" arriba en cada paso (`components/BookingFlow.tsx`)

- Modalidad (1): "Volver" pasa del pie a la primera línea (`mb-5 flex flex-wrap gap-3`).
- Profesional (2): igual.
- ¿Cuándo? (3): fila superior — "Volver" siempre + "Continuar" cuando `dateIso && hour !== null`; la fila del pie desaparece.
- Tus datos (4): "Volver" arriba; "Confirmar cita" se queda al pie (el sumbit conserva su lugar natural).

### Acción 3 — Verificación

- `tsc` limpio; build; reinicio del servidor.
- Smoke con Puppeteer (persona): (a) "Volver" visible en ¿Cuándo? sin elegir nada y ANTES
  del contenido en los 4 pasos; (b) un día con horario ocupado ya NO muestra la hora
  tachada (y sí lo muestra la agenda pública: que la persona no lo pueda elegir por accidente);
  (c) crear UNA cita de prueba que REVISA en la BD: queda en la BD en `/admin/horarios` (PB-3).
- `check:agenda` sigue PASS (no toca la BD).

---

## Notas

- No se toca la BD, el motor de disponibilidad ni el anti-doble-reserva (`ux_appt_slot`).
- Todo el cambio es en los 2 componentes de cliente (`BookingFlow`, `CalendarView`); \
  las server actions quedan intactas.
- `lib/data.ts` sigue como semilla demo (TODO D8 жить).
- En `docs/ORGANIZACION-DEL-PROYECTO.md` queda el capítulo de ronda 15 con la crónica.
