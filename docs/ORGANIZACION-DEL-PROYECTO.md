# Organización del proyecto — Clínica de bienestar integral (Raíz Viva)

> Cómo se organiza el proyecto: qué papel juega cada documento, cómo se dividieron las fases,
> la crónica de las rondas de trabajo, el registro de decisiones, el proceso y la
> metodología de verificación. Última revisión: 2026-10-23 (ronda 11 — R4-A, agenda real).

---

## 1. Cómo se organiza: el mapa de documentos

El proyecto se organiza en **dos capas**: documentación de dirección (fuera del código) y
código + documentación técnica (dentro de `clinica-bienestar/`).

| Documento | Dónde | Rol | Se pregunta |
|---|---|---|---|
| `PROMPT.md` | `/home/aficado/` | **Contrato/brief.** Requisitos, pilares, reglas de trabajo, fases, entregables | *Qué se debe construir y bajo qué reglas* |
| `MAPA_IMPACTO.md` | `/home/aficado/` | **Estrategia.** Meta general, resultados R1–R5, actores, diagrama de impacto, epicas E1–E10 con historias y criterios de aceptación | *Para qué sirve cada cosa y qué resultados debe producir* |
| `BACKLOG.md` | `/home/aficado/` | **Lista de trabajo.** Backlog items (1.01–10.06) con prioridad (P0/P1/P2), tamaño (S/M/L), dependencias, releases R0–R7, decisiones abiertas D1–D8, riesgos | *En qué orden se trabaja y qué se decide después* |
| `DEFINITION_OF_DONE.md` | `/home/aficado/` | **Estado y evidencia.** Criterios de aceptación A–F, verificación con pruebas reales (build, HTTP, headless), crónica de las 5 rondas | *Se puede dar por terminada esta entrega y con qué evidencia* |
| `README.md` | `clinica-bienestar/` | **Puerta de entrada.** Objetivo, estado, estructura resumida, cómo ejecutar, siguientes pasos | *Dónde empiezo si llego al proyecto hoy* |
| `docs/ESTRUCTURA-DEL-CODIGO.md` | `clinica-bienestar/docs/` | **Arquitectura e inventario.** Árbol de 58 archivos, rutas, flujos, mapa historias ↔ archivos | *Dónde vive cada cosa y a qué historia responde* |
| `docs/ORGANIZACION-DEL-PROYECTO.md` | `clinica-bienestar/docs/` | **Organización.** Fases, crónica, decisiones, proceso, verificación, riesgos, siguientes pasos | *Cómo se ha venido organizando el trabajo y cómo se continúa* |

**Cómo encajan:** `PROMPT` fija las reglas → `MAPA_IMPACTO` define **qué y por qué** (objetivos, actores, historias) → `BACKLOG` **ordena el trabajo** (prioridades, releases, decisiones) → cada entrega se **certifica contra el DoD con evidencia** → `README` + `docs/` documentan **cómo quedó el sistema** (estructura, estado, proceso).

Nota: `INVENTARIO.md` ahora vive en `docs/`, junto a este archivo. **No forma parte del sitio de la clínica**: es el inventario de la máquina (discos, `/mnt/models`, symlinks, scripts de inferencia local y el repo `ninfer-5070ti`). Se incluye, a petición del dueño, para conservar el registro del entorno junto al proyecto; su propia sección 7 pide actualizarlo cuando cambien los elementos que describe.

---

## 2. Fases del plan y su estado

Según `PROMPT.md` §11 y `BACKLOG.md` §4 (releases R0–R7):

| Fase | Contenido | Puerta de aceptación (DoD) | Estado |
|---|---|---|---|
| **0. Descubrimiento** | Preguntas al cliente, stack, mapa del sitio, wireframes, mapa de impacto y backlog | Aprobación del cliente | ✅ Aprobada (se resolvieron las preguntas, se eligió el stack y se aprobaron mapa/backlog) |
| **1. Base y diseño** | Proyecto, tokens, layout, inicio, páginas estáticas, a11y | Build limpio + criterios A–C del DoD | ✅ Hecha (en la demo) |
| **2. Contenido** | Zona gratuita, blog, servicios, cursos (lectura) + reserva demo + links + admin placeholder | Criterios A–F del DoD R0–R2 | ✅ Hecha (en la demo) |
| **3. Panel admin** | Auth, RBAC, WYSIWYG, multimedia, CRUD, testimonios, enlaces/QR, apariencia | E8 completa: editar contenido sin tocar código | 🔶 **R3-A–D ejecutados** (2026-10-16 → 2026-10-22): auth demo + RBAC + layout (R3-A); apariencia + multimedia sobre **BD local SQLite** (R3-B); CRUD de contenido con estados/preview, servicios/cursos con orden y visibilidad, enlaces cortos + QR, `/links` editable, OG, JSON-LD (R3-C); testimonios con consentimiento, menú/redes, auditoría, borrado blando + deshacer (R3-D). Diferidos P1: 8.03 (2FA) y 8.09 (WYSIWYG). **Retirado el 2026-10-22, a petición del dueño: el módulo Apariencia (8.05)** — el panel queda con 7 módulos; el sitio público sigue leyendo el tema de la BD (`theme_tokens`); el paso "cambia un color del tema" del gate se retira. **R3-E ejecutado (2026-10-23): 8.14 modo oscuro en todo el sitio, 8.15 mapa editable con tipo de URL configurable, 8.16 crédito «Generada por vegttech».** El gate quedó pendiente del visto bueno formal: el 2026-10-23 el dueño pidió pasar al siguiente sprint (R4) sin reportar bugs |
| **4. Agenda** | Disponibilidad real (Supabase + RLS), reserva, anti-doble-reserva, correos (Resend), recordatorios, cancelación, agenda admin | E5 completa: flujo de citas real y confiable | 🔶 **R4-A ejecutado (2026-10-23):** agenda REAL sobre SQLite local (decisión D-R4-1; Supabase al decidir despliegue): `appointments` + `availability_rules` + `notifications`, anti-doble-reserva por índice único parcial + transacción (prueba `npm run check:agenda` PASS), `/mi-cita/<token>` por BD con cutoff provisional 24 h (D-R4-3), módulo `/admin/horarios`, cola de correos (stub hasta Resend). 🔶 **R4-B en construcción (2026-11-01):** calendario de mes completo en `/agendar` (año seleccionable, día fuera de regla con motivo), servicios/profesionales/horarios configurables en el panel (`/admin/servicios`, `/admin/profesionales`, `/admin/horarios` ampliado + vista anual), cookies `booking_state`. Siguen R4-C (usuarios reales) y R4-D (correo real, E2E). Detalle: `docs/BACKLOG-R4.md` + `docs/BACKLOG-R4-B.md` |
| **5. Cursos y pagos** | Inscripción con pago (Mercado Pago), cupos atómicos, inscripciones en admin | E6 completa: ingresos por cursos | ⬜ Pendiente |
| **6. Alumnos (opcional)** | Área privada de alumnos | D5 decidida | ⬜ Pendiente (decisional) |
| **7. Cierre** | SEO local, rendimiento (Lighthouse ≥ 90), seguridad (RLS, respaldos), docs, despliegue | E9/E10 cerradas + sitio en producción | ⬜ Pendiente |

**Regla de proceso (PROMPT §12.4):** se avanza **fase por fase, con aprobación explícita** antes de pasar a la siguiente. La entrega R0–R2 está certificada en `DEFINITION_OF_DONE.md`; las rondas 3–11 están registradas en §3 con su evidencia. La Fase 3 tiene todo su código ejecutado (R3-A–E) y el dueño autorizó avanzar a Fase 4 el 2026-10-23; el gate de R3 puede pasarse junto con el de R4.

---

## 3. Crónica de las rondas de trabajo

Una **ronda** es un ciclo completo: petición del usuario → diagnóstico con evidencia → correcciones → verificación determinista → registro en el DoD.

| Ronda | Petición / reporte | Diagnóstico | Correcciones | Verificación |
|---|---|---|---|---|
| **R0** | Montar el proyecto | — | Setup Next.js 15 + TS + Tailwind 4, estructura de rutas, `lib/`, configuración | Build limpio |
| **R1** | Base + diseño + inicio | — | Tokens `@theme`, layout, header/footer, página de inicio completa, páginas estáticas, a11y (skip link, `aria-*`, foco, contraste) | Build + inspección (criterios A–C) |
| **R2** | Contenido completo + demos | — | 4 catálogos con filtros, 28 fichas de detalle, reserva demo en 4 pasos + `/mi-cita`, inscripción/contacto por WhatsApp, `/links` + QR, `/admin` placeholder, SEO (sitemap 38 URLs, robots), 92–93 `TODO:` | Build + HTTP + criterios D–F → **DoD R0–R2 firmado** |
| **3** (2026-10-15) | "Quiero animaciones de scroll" | No existían; se definió el sistema desde cero (criterios F1–F4) | `Reveal.tsx` (IntersectionObserver + animación CSS), variantes `up`/`card`, stagger, `float-soft`/`float-slow`, microinteracciones, `prefers-reduced-motion` | Build + headless (reveals al hacer scroll) |
| **4** (2026-10-15) | "No veo ninguna animación" | 3 causas distintas, todas verificadas headless: (a) el menú móvil quedaba "colgado" (el `backdrop-filter` del header lo convertía en contenedor de los `position: fixed` → **bug F6**); (b) el navegador servía un build viejo por caché (**bug F7**); (c) faltaba un sistema de movimiento consistente (**F8**) | Overlay del menú fuera del `<header>`; `middleware.ts` con `Cache-Control: no-store`; sistema de movimiento profesional (duración 750 ms entonces, staggeres grandes) | Headless: 0 errores, menú OK, cache `no-store` confirmada por HTTP |
| **5** (2026-10-15) | "Algunas animaciones se bugean de las tarjetas" | Causa raíz: el IO disparaba **antes** del primer paint en swipes rápidos + duración de 750 ms + staggeres de hasta 700 ms + `Reveal` anidados → tarjetas que "saltaban" sin animarse o aparecían fuera de sincronía | (1) duración **600 ms** y stagger acotado `Math.min(i,4)*70` ms (ola ≤ 280 ms); (2) **red de seguridad** en `Reveal`: scroll rAF-throttled + `getBoundingClientRect()` + chequeo único a 1,2 s; (3) **0 anidamientos** (se aplanó la sección de relacionados de `/aprende/[slug]`); (4) se eliminó la página de prueba `/prueba-animacion` | **Determinista** (headless por IP pública): scroll en pasos **131/131** en 10 páginas; swipe rápido **44/44, 10/10, 9/9, 8/8**; salto al 45 %: **0 sin revelar**; `prefers-reduced-motion`: 0 ocultos; sin errores JS (solo `favicon.ico` 404) |
| **6** (2026-10-16) | R3-A (base del panel admin) + "animaciones siempre activas" | El panel era un placeholder (roadmap estático en `/admin`); no existía auth, roles ni layout admin. Las animaciones solo corrían si el sistema no pedía `prefers-reduced-motion` | Login + recuperación (demo) con 3 perfiles (`demo123`), cookie firmada `rv_admin_session` (HMAC-SHA256, 12 h), RBAC admin/terapista/asistente (UI + server actions), `AdminShell` + dashboard, `SiteChrome` oculto en `/admin`; perfiles en memoria (se reinician al reiniciar) — sin BD real. Se eliminó el override `prefers-reduced-motion` de `animations.css` (40 px / 650 ms) | Build limpio (21 rutas); login de los 3 roles y RBAC verificados en vivo; `/admin` sin sesión → redirect a `/admin/login` |
| **7** (2026-10-16) | "El botón 'Volver al sitio' de `/admin/login` no funciona: te devuelve a la misma ruta" | El link apuntaba a `/admin`; sin sesión, `/admin` redirige a `/admin/login` → bucle que parecía "no hacer nada" | `href="/admin"` → `href="/"` en `app/admin/login/page.tsx` y `app/admin/login/[action]/page.tsx`; rebuild + relanzar el servidor | curl del HTML servido: ambos links apuntan a `/`; `/admin/login` y `/admin/login/confirm` → 200 |
| **8** (2026-10-21 → 22) | R3-B/C/D ("continúa con las tareas pendientes del backlog") + "no veo ningún cambio" + Application error en `/admin/apariencia` | El sitio aún leía de `lib/data.ts`; el `:3000` servía build viejo; `getThemeTokens()` devolvía fila `node:sqlite` (prototipo nulo) a un cliente (digest 3499041867) | **BD local SQLite** (`lib/db.ts` 12 tablas + seed idempotente + borrado blando; `lib/content.ts` capa de datos; actions con RBAC+auditoría+revalidate); apariencia+multimedia (R3-B); hub `/admin/contenido` (estados/preview/reordenar/deshacer), `/c/<slug>`+QR, `/links` editable, OG+JSON-LD (R3-C); testimonios con consentimiento, menú/redes, auditoría (R3-D); todo lo público migrado a la BD; copia plana en `themes.ts`; rebuild+restart | `tsc`+build 30 rutas; smoke: 200 público, `/c/` 301/404, admin 307 sin sesión y 200 con cookie firmada; RBAC verificado (terapeuta: contenido sí, auditoría no) |
| **9** (2026-10-22) | Retirar Apariencia (petición del dueño) + captura Multimedia: imagen rota + "Invalid Date" | `next start` congela `public/` al arrancar (subida posterior → 404); `formatDateMX` recibió ISO completa en lugar de `yyyy-mm-dd` | Borrado del módulo (página/editor/actions/`contrast.ts` huérfano; `fonts.ts` se queda: lo usa `themes.ts`), nav/dashboard limpios, docs con nota "retirado"; nueva `app/uploads/[name]/route.ts` (disco en runtime, anti-traversal) + fecha local; Multimedia permanece como almacén (decisión B) | `tsc`+build 30 rutas; archivo creado tras el arranque → 200 (antes 404); traversal 404; `/admin/apariencia` 404; 0 "Invalid Date" en el HTML |
| **10** (2026-10-22 → 23) | R3-E: modo oscuro universal, mapa editable (URL aún sin definir) y crédito «Generada por vegttech» | No existía paleta oscura; el mapa estaba hardcodeado con `clinic.mapQuery` en home y contacto; el pie no llevaba crédito | 8.14 `ThemeToggle` + script anti-flash + bloque `html.dark` (`!important` + overrides por rol, AA calculada); 8.15 `site_settings.map_*` (migración ALTER) + `MapBlock` (4 tipos) + sección «Mapa» en `/admin/menu` + acción `saveMap`; 8.16 crédito en `Footer` | `tsc`+build 30 rutas; crédito/toggle/script/paleta presentes en HTML-CSS servidos; migración aplicada; placeholder intacto |
| **11** (2026-10-23) | "continua con el siguiente sprint" → **R4-A, agenda real** (el gate de R3 queda a la espera del visto bueno formal; sin bugs reportados) | La reserva era demo: disponibilidad por hash, citas en `localStorage`, `/mi-cita` solo en el navegador emisor; sin modelo real de horarios | **Agenda real sobre SQLite** (D-R4-1, no Supabase: sin credenciales nube; lógica igual, conductor distinto): tablas `appointments`/`availability_rules`/`notifications` + índice único parcial `ux_appt_slot` (garantía dura 5.04) + `BEGIN IMMEDIATE`; `lib/schedule.ts` (motor desde BD: reglas − ocupación) + `lib/schedule/actions.ts` (reservar/cancelar/reprogramar con cutoff 24 h provisional D-R4-3; admin: `canManageSchedule`); `BookingFlow` sin `localStorage` (availability asíncrona por action); `/mi-cita/[token]` server-rendered por BD; módulo **`/admin/horarios`** (citas + historial + horarios por día/pro con alta/edición/baja); cola de correos `npm run notifications` (stub, entrega real → R4-D Resend); seed de reglas desde `lib/data` (TODO D8); dashboard con citas próximas; `docs/BACKLOG-R4.md` creado con alcance/sprints/gate | `tsc` limpio; build **31 rutas**; `npm run check:agenda` **PASS** (1.ª entra, 2.ª UNIQUE, tras cancelar se libera); smoke: `/admin/horarios` 307 sin sesión y 200 con cookie firmada; asistente ve mensaje de permiso; 11 reglas sembradas; `/mi-cita/rv-noexiste` 200 con "No encontramos esa cita"; dashboard muestra el stat; 118 `TODO:` en 31 archivos (103 + 15 nuevos honestos; 0 eliminados del R3: los 2 chips viejos de `/mi-cita` se reescribieron con estado real) |
| **12** (2026-11-01) | "después del último release, refactorizar el calendario + servicios/profesionales/horarios en panel + cookies" → **R4-B, agenda completa** (intermedia entre R4-A y Fase 5/pagos) | El calendario de R4-A es una ventana de 21 días; los servicios y profesionales son fijos en `lib/data.ts` (TODO); la programación se pierde al recargar; el admin solo puede editar reglas open/close | **Plan creado** (`docs/BACKLOG-R4-B.md`): D-R4-B-1 calendario de mes completo/año seleccionable con día fuera de regla marcado con motivo; D-R4-B-2 servicios/profesionales configurables en `/admin/servicios` + `/admin/profesionales` (CRUD + baja lógica); D-R4-B-3 horarios por día/hora + vista anual en `/admin/horarios`; cookies `booking_state` para no perder la programación al recargar/navegar; sprints R4-B-1…4; gate con 6 pasos; decisiones pendientes D-R4-B-5, -6, -7 | Nuevo archivo de backlog (el código aún no se toca) |
| **13** (2026-11-01) | "esta bugeado el apartado de citas" (post-refactor de R4-B-1) | 10 defectos del refactor: máquina de pasos desplazada (`COOKIE_STEP+1..3` → pantalla "done" vacía al elegir modalidad); mes interno con formatos mezclados (`YYYY-MM-DD`/UTC) → `Invalid Date`/`NaN` → grid vacío; `fetchMonthSchedule` comparaba MES (`2026-11`) contra DÍA (`2026-11-01`) → mes actual siempre vacío; `monthPrev` no decrementaba el año; horas como `<span>` sin `onClick` (no seleccionables); grid sin desfase por día de semana y con huecos; días pasados clicables; restauración de cookie sin validar contra el catálogo ni clamp del paso; cookies incompletas (`pickService` sin `writeState`, `clearDownstream` sin limpiar llaves, sin `monthIso`, `reset()`/submit sin `clearBookingState`); `onNavigate` nunca invocado y `pickDate` obsoleto | Corregidos los 10 (detalle paso a paso en `docs/PLAN-R4-B-1.md` §Corrección de bugs): pasos reales 0–4/5=done restaurados; mes SIEMPRE `YYYY-MM` local; mes-compara-mes en la action; `getLastDayOfMonth` con `new Date(año, mes, 0)`; cruces de año en prev/next; horas botones seleccionables con ocupados tachados; grid con desfase Lun–Dom y casillas inertes; días pasados `disabled`; restauración validada en cadena (catálogo + regex ISO + hora 0–23 + clamp 0–4) con cookie re-normalizada; writes completos en cada pick con `null`=borra; `reset()` y éxito de submít limpian la cookie; `monthIso` persiste | `tsc` limpio; build OK (31 rutas); `check:agenda` **PASS** (anti-doble-reserva intacto); smoke: `/agendar`, `/privacidad`, `/mi-cita/…` 200; sin errores en el log del servidor; servidor apagado al final de la ronda (petición del dueño) |
| **14** (2026-11-02) | "verifica que ya haya quedado este sprint, y inicializa el siguiente" → **R4-B-2 ejecutado** (`/admin/servicios` + `/admin/profesionales`) | Los profesionales vivían fijos en `lib/data.ts` (TODO D8); `/admin/servicios` y `/admin/profesionales` daban 404; el plan original del backlog duplicaría el catálogo de servicios | **Decisión D-R4-B-2 ajustada y documentada** (`docs/PLAN-R4-B-2.md`): NO se crea tabla `service_catalog` (la tabla `services` de R3-C ya es único sitio y su editor ya elegía modalidades); SÍ tabla `professionals` (identidad: servicios JSON, días JSON, horario, `active`, baja blanda). **Nuevos:** `lib/professionals.ts` (semilla demo idempotente, `getProfessionals/getProfessionalsAll`, `upsertRulesForPro` con UPSERT de reglas), `lib/professionals/actions.ts` (guardar/activo/baja con RBAC `canManageSchedule` + auditoría + revalidate), `components/admin/ProfessionalsManager.tsx`, páginas `/admin/profesionales` y `/admin/servicios` (vista dedicada con deep-links `?tab=servicios&edit=<slug>`), nav del panel (+2 ítems). **Consumidores migrados** a `getProfessionals()`: `lib/schedule.ts`, `lib/schedule/actions.ts`, `/agendar`, `/admin/horarios`, `/servicios/[slug]`, `/nosotros` | Verificación previa (R4-B-1): `tsc` limpio, build, `check:agenda` PASS, smoke 200/307. R4-B-2: `tsc` limpio; build **33 rutas**; RBAC verificado (307 sin sesión / 200 con cookie firmada admin); semilla BD (2 pros demo); UPSERT de reglas probado contra SQLite real (insert + conflicto → gana último); `/agendar` y `/admin/horarios` muestran los pros desde la BD; `check:agenda` PASS |

**Artifacts de verificación:** scripts en `/tmp/opencode/pptr/` (`verify5.js`, `final-verify.js`, `menu-check.js`, `cache-check.js`), screenshots por página en `/tmp/opencode/r5-shots/`, y el DoD con los criterios F1–F8 actualizados. Rondas 6–7: build de 2026-10-16 (21 rutas, `.next/BUILD_ID` `48m6u2zTuCf9dLu5hIDr-`) + checks HTTP por `curl` sobre `http://localhost:3000`. Ronda 8: build de 2026-10-22 (30 rutas, `.next/BUILD_ID` `M8NGOn4Hh4f3A0_NAU26o`) + smoke HTTP de las 30 rutas + checks de RBAC con cookies de sesión firmadas (admin/terapeuta) + verificación de `/c/<slug>` (301/404) y del fix de `/admin/apariencia` (200 con sesión). Rondas 12–14: build 33 rutas + smoke de las rutas nuevas + `npm run check:agenda` PASS en cada una.

---

## 4. Registro de decisiones

### 4.1 Decisiones de negocio (D1–D8 de `BACKLOG.md` §5)

| ID | Decisión | Estado en la demo |
|---|---|---|
| **D1** | ¿Admin mínimo desde la Fase 2? | **Resuelta:** no. La demo funciona con contenido de ejemplo en `lib/data.ts` (equivalente a un seed) y `/admin` es un placeholder honesto. El panel real es la Fase 3 |
| **D2** | Hosting de videos (propio / YouTube / Vimeo) | **Abierta.** La demo usa posters SVG + `VideoEmbed` preparado para YouTube/Vimeo (`TODO:`). Se decide con los videos reales del cliente |
| **D3** | Anticipo de cita por Mercado Pago | **Abierta** (Fase 5). La demo confirma por WhatsApp; el anticipo se marca `TODO` |
| **D4** | Política de cancelación (anticipo, plazo) | **Abierta.** La demo permite cancelar en 2 pasos sin plazo mínimo; se define con el cliente |
| **D5** | ¿Área privada de alumnos? | **Abierta** (Fase 6, opcional). No existe en la demo |
| **D6** | Integración con Google Calendar | **Abierta** (Fase 7). No existe en la demo |
| **D7** | Herramienta de analítica | **Propuesta:** Plausible (respetuosa, sin cookies). Pendiente (Fase 7) |
| **D8** | Profesionales y horarios reales | **Abierta.** La demo trae 2 profesionales de ejemplo con `TODO:` en credenciales y datos |

### 4.2 Decisiones técnicas tomadas (con su razón)

| Decisión | Razón | Dónde vive |
|---|---|---|
| **Next.js App Router + TS + Tailwind 4** | Stack del brief; prerender estático = site rápido sin BD; Tailwind v4 con tokens `@theme` inyectables (E1.4) | `package.json`, `globals.css` |
| **Componentes propios en `ui.tsx`** (no shadcn/ui) | Menos dependencias; el diseño es custom ("calma cálida y profesional"); las primitivas son pocas | `components/ui.tsx` |
| **Demo sin backend** (`lib/data.ts` + `localStorage`) | Entregar funcionalidad real antes de Supabase; todo determinístico y verificable; la migración a Supabase es puntual (marcada `TODO`) | `lib/data.ts`, `lib/slots.ts`, `BookingFlow.tsx` |
| **Disponibilidad simulada con hash FNV-1a (~30 % ocupado)** | La demo se ve realista y **estable entre cargas** sin base de datos; `slotKey` da anti-doble-reserva local | `lib/slots.ts` |
| **Animación CSS (no transición) en los reveals** | Robusta si el IO dispara antes del primer paint; `animation-fill-mode: both` evita CLS | `globals.css`, `Reveal.tsx` |
| **Parámetros de movimiento** (48 px / 600 ms / curva ease-out / stagger ≤ 280 ms / 0 anidamientos) | Resultado de la ronda 5: los valores grandes + anidamiento eran la causa del "bug" reportado | `globals.css`, `Reveal.tsx`, páginas |
| **Red de seguridad rAF + chequeo 1,2 s en `Reveal`** | Cubre swipes rápidos donde el IO no dispara; listeners se retiran tras revelar (cero coste residual) | `components/Reveal.tsx` |
| **Overlay del menú móvil fuera del `<header>`** | `backdrop-filter` del header lo convertía en contenedor de `position: fixed` (bug F6) | `Header.tsx` |
| **`Cache-Control: no-store` en el HTML** | Sin esto, los navegadores sirven HTML viejo (y el CSS/JS viejo que referencia) horas/días después de un rebuild; los assets `/_next/*` conservan caché inmutable | `middleware.ts` |
| **`scroll-behavior: smooth`** | Intencional para anclas (TOC, FAQ); **ya no** se desactiva con `prefers-reduced-motion` (animaciones forzadas, 2026-10-16); **no afecta** a flicks del usuario (es solo para `scrollTo` programático) | `globals.css` |
| **Ilustraciones SVG en vez de fotos** | Coherencia de marca, peso mínimo (LCP), sin fotos genéricas; fotos reales llegan con los datos del cliente (`TODO:`) | `public/images/*.svg` |
| **`use(params)` en rutas dinámicas** | Evita el 500 en SSR con el API de Next 15 | `mi-cita/[token]/page.tsx`, `[slug]/page.tsx` |
| **Sin cookies de terceros** | Cumple E9.5 (sin banner de cookies); la analítica, si se añade, será Plausible | todo el sitio |
| **Sin repositorio git (hoy)** | La máquina no tiene el repo inicializado; todo está en disco local, sin commits. **Riesgo operativo** mitigable (ver §8) | `/home/aficado` (no es repo) |
| **Retirada del módulo Apariencia del admin (8.05)** — 2026-10-22 | Petición del dueño: innecesario. Se eliminaron la página (`app/admin/apariencia/`), el editor (`components/admin/ThemeEditor.tsx`), sus actions (`lib/apariencia/`) y `lib/contrast.ts` (huérfano). **No se tocó el tema público**: `lib/themes.ts`/`lib/themes-core.ts`/`lib/fonts.ts`, `theme_tokens` (BD) y `app/layout.tsx` siguen igual; el sitio público sigue leyendo el tema de la BD | `AdminShell.tsx`, `app/admin/page.tsx` (nav y tarjeta retirados) |
| **Multimedia se queda sin salida pública inmediata (opción B)** — 2026-10-22 | Tras retirar Apariencia, el hero no tiene UI de asignación y los videos enlazados no los consume nada. El dueño decide **no** añadir el botón "usar como hero" ni resucitar Apariencia: el módulo queda como almacén de assets (uso activo: portadas de recursos vía `Contenido → Recursos → Imagen de portada`); "más tarde se le dará un uso justo" (Fase 4+). No borrar el módulo: es el único medio de subir imágenes al servidor | `MediaLibrary.tsx`, `lib/media.ts`, `app/page.tsx` (hero, lectura sin UI) |

---

## 5. Proceso de trabajo (reglas vigentes)

Extraídas de `PROMPT.md` §12 y `BACKLOG.md` §7, y aplicadas en todas las rondas:

1. **Fase por fase, con aprobación.** No se adelanta trabajo de una fase sin aprobar la entrega anterior (DoD).
2. **No inventar datos.** Testimonios, cifras, precios, credenciales y datos de contacto de ejemplo se marcan `TODO:` visibles (93 marcadores). El contenido de ejemplo es coherente pero **no se presenta como real** (las notas de demo lo dicen en `/agendar`, footer y `/links`).
3. **Verificación con evidencia antes de declarar "hecho".** Cada cierre se apoya en build limpio, respuestas HTTP, inspección de código y, desde la ronda 3, pruebas headless con Chromium.
4. **Grooming antes de cada release.** El backlog es vivo: se re-prioriza con lo aprendido en cada fase.
5. **Regresión mínima.** Cada corrección se valida contra el comportamiento anterior (p. ej., la corrección de caché se verificó con curl: 200 + `no-store` + CSS con hash nuevo).
6. **Documentar las decisiones.** Lo importante no se deja en la conversación: se registra aquí (§4), en el DoD o en `TODO:` del código.
7. **A11y no es opcional.** WCAG 2.2 AA en todo: teclado, foco, contraste, targets ≥ 44 px, fallback sin JavaScript. _(Excepción acordada: las animaciones son **forzadas** —se ignora `prefers-reduced-motion`— por petición del dueño, 2026-10-16; el fallback sin JavaScript sigue activo.)_

---

## 6. Metodología de verificación (cómo se comprueba el sitio)

Tres niveles, en orden:

**Nivel 1 — Build:** `npm run build` sin errores (31 rutas generadas: 30 + la ruta runtime de subidas; prerender de las estáticas, dynamic de las de BD/`[slug]`/`[token]`).

**Nivel 2 — HTTP (curl):**
- `/` → 200; `Cache-Control: no-store` presente; referencia al CSS con hash de build (p. ej. `e0f5ec6eaebf5c3c.css`).
- Rutas de detalle (28 slugs sembrados, ahora desde la BD) → 200; `/prueba-animacion` → 404; `/admin` y `/mi-cita` → `noindex` y bloqueados en robots.
- `robots.txt` correcto; `sitemap.xml` **generado desde la BD** (10 estáticas + fichas publicadas/visibles, `lastmod` real); `/c/<slug>` → 301 al destino y 404 si no existe (ronda 8).

**Nivel 3 — Headless (Puppeteer, móvil 390×844 y desktop 1440×900):**
- **Scroll en pasos** (incrementos de 300 px hasta el bottom, con espera): contar los `data-revealed` por página → 131/131 en 10 páginas (ronda 5).
- **Swipe rápido** (el escenario reportado): `scrollTo(0, 1e9)` instantáneo → 0 elementos sin revelar en el viewport; al llegar al bottom: 44/44, 10/10, 9/9, 8/8.
- **Salto al 45 %:** 0 sin revelar.
- **`prefers-reduced-motion` emulado:** las animaciones se **ven** (los elementos empiezan ocultos y se van revelando al scroll; nunca "todo de una vez") — confirma el forzado (2026-10-16).
- **Consola:** sin errores JS (solo `favicon.ico` 404 del navegador).
- **Menú móvil:** overlay funciona, items visibles, foco correcto.

**Contingencias del entorno (importantes para reproducir):**
- Node 20.18.1 **no está en el PATH**: usar `PATH="/tmp/node-v20.18.1-linux-x64/bin:$PATH"`.
- Puppeteer corre con Node 26 (`/tmp/opencode/node-v26.11.1-linux-x64/bin/node`); packages en `/tmp/opencode/pptr/node_modules`.
- En pruebas de **salto instantáneo** hay que desactivar primero `scrollBehavior: smooth` (`document.documentElement.style.scrollBehavior="auto"`), o el "salto" se convierte en animación y el test es inválido.
- `document.body.scrollHeight` deriva ~200 px entre medidas (reveal con `fill: both`); recalcularlo antes de cada salto.
- Los servidores de fondo (`npm start`) mueren en silencio: relanzar con `npm start` (y matar `next-server` sobrante si el puerto 3000 está ocupado).

**Scripts reutilizables:** `/tmp/opencode/pptr/verify5.js` (scroll en pasos, 10 páginas), `final-verify.js` (swipe + salto), `menu-check.js`, `cache-check.js`. Evidencia visual: `/tmp/opencode/r5-shots/`.

---

## 7. Riesgos vigentes (de `BACKLOG.md` §6, con estado actual)

| Riesgo | Estado / mitigación |
|---|---|
| **Datos del cliente no llegan** (NAP, precios, testimonios, dominio) | Mitigado con contenido de ejemplo coherente + 118 `TODO:` + notas de demo; el sitio se entrega "listo para reemplazar datos" |
| **Doble reserva en la agenda real** | **Mitigado desde R4-A (2026-10-23):** check transaccional + índice único parcial `ux_appt_slot` en SQLite; prueba determinista `npm run check:agenda` (PASS). Al migrar a Supabase (R4-D/despliegue) se reproduce con transacción + row lock |
| **Costo/velocidad de la Fase 3 (admin)** | Es la fase más grande (8.01–8.13); se puede entrar por módulos (primero CRUD de contenido, luego apariencia/QR) |
| **Videos propios sin hosting decidido (D2)** | Pendiente; `VideoEmbed` ya soporta YouTube/Vimeo |
| **Rendimiento en móvil (Lighthouse ≥ 90)** | SVGs ligeros + `font-display: swap` + reveals sin CLS; **medición pendiente** (último item del DoD) |
| **Servidor de demo sin respaldo** | Todo está en disco local, **sin git**: una pérdida de disco borra el proyecto. Mitigar creando el repo git (ver §8) |
| **Caché del navegador sirviendo builds viejos** | Resuelto con `no-store` en `middleware.ts` (F7); seguir validando el hash del CSS tras cada build |
| **Animaciones percibidas como "rotas" en swipes rápidos** | Resuelto en la ronda 5 (parámetros + red de seguridad + 0 anidamientos); verificación determinista 131/131 |
| **Dependencia de un solo técnico (autogestión, R4)** | Se resuelve con el panel admin de la Fase 3 (RBAC + UX de errores amigables, E8.10) |

---

## 8. Siguientes pasos (camino recomendado)

1. **QA manual + Lighthouse** (a11y y rendimiento ≥ 90 en las 4 métricas): cierra el último ⚠️ del DoD y da el "visto bueno" final de la demo.
2. **Datos reales del cliente** (D1–D8): nombre, lema, dirección, teléfono, correo, redes, horarios, precios, testimonios con consentimiento, dominio → se reemplazan los 118 `TODO:` (casi todo en `lib/data.ts`, que es la fuente del seed; horarios y lo demás operativo ya entra desde el panel; usuarios reales: R4-C).
3. **Cerrar la Fase 3 (visto bueno formal):** el dueño autorizó avanzar a R4 el 2026-10-23 sin bugs reportados; queda pasar el **gate de aceptación** (persona no técnica, < 15 min: editar+publicar, subir imagen, enlace corto+QR, `/links`, RBAC, modo oscuro, mapa, crédito) — puede hacerse junto con el gate de R4-A. Diferidos P1 del release: 8.03 (2FA) y 8.09 (WYSIWYG).
4. **Fase 4 — Agenda real:** 🔶 **R4-A EJECUTADO** (2026-10-23: citas en BD + anti-doble-reserva + `/admin/horarios` + cola de correos, sobre SQLite local por D-R4-1; Supabase queda para cuando se decida el despliegue). 🔶 **R4-B EN CONSTRUCCIÓN (intermedia):** calendario de mes completo seleccionable + servicios/profesionales/horarios configurables en el panel + cookies `booking_state` (ver `docs/BACKLOG-R4-B.md`). Siguen **R4-C** (usuarios reales en BD + `/admin/usuarios`) y **R4-D** (Resend + cron + Playwright E2E + pagos según D3). Plan completo: `docs/BACKLOG-R4.md`.
5. **Fase 5 — Pagos** (Mercado Pago): anticipos de cita (D3) e inscripciones de cursos con cupos atómicos.
6. **Fases 6–7 (según decisiones):** área de alumnos (D5), SEO local + Google Business, Plausible (D7), seguridad completa (RLS, respaldos, auditoría), despliegue a producción con dominio + SSL.
7. **Higiene inmediata (opcional pero recomendada):** `git init` + primer commit (el proyecto no está versionado), favicon PNG para eliminar el 404 de `favicon.ico`, y mover los docs de dirección (`PROMPT`, `MAPA_IMPACTO`, `BACKLOG`, DoD) al repo cuando se cree.

---

## 9. Notas operativas (entorno)

| Dato | Valor |
|---|---|
| Node | 20.18.1 en `/tmp/node-v20.18.1-linux-x64/bin` (**fuera del PATH**; usar `PATH="/tmp/node-v20.18.1-linux-x64/bin:$PATH"`) |
| Servidor de producción | `npm start` en `clinica-bienestar/` → `0.0.0.0:3000`; corre en background |
| URL pública | **http://100.69.186.68:3000/** (Tailscale) |
| Reavivar el servidor | Si la conexión se niega: matar `next-server` sobrante (PID vía `ss -tlnp`) y relanzar `npm start` en background |
| Build actual | 31 rutas; CSS `00c0ac521bbc085b.css`; `.next/BUILD_ID` `6kFT-jUCv1zlDeixAXetX` (rebuild 2026-10-23 ronda 11: R4-A agenda real; el de la ronda 10 fue `7u7EpPtMxk7PSRwvnIvHR`); BD local `data/clinica-bienestar.db` (15 tablas; seed + lo que edite el cliente del panel + citas reales) |
| Verificación headless | Node 26 en `/tmp/opencode/node-v26.11.1-linux-x64/bin/node`; scripts y screenshots en `/tmp/opencode/pptr/` y `/tmp/opencode/r5-shots/` |
| Versionado | **No hay git** (`/home/aficado` no es repo); todo en disco local |
| Entorno | Linux (Ubuntu), servidor en la misma máquina; `INVENTARIO.md` (discos/modelos) es de otro proyecto |

---

## 10. Resumen ejecutivo

El proyecto está **organizado por capas de documentación** (contrato → estrategia → backlog → DoD → docs técnicas), **por fases aprobadas** (0–2 hechas, 3 ejecutada con gate pendiente de visto bueno formal, 4 en curso) y **por rondas verificables** (11, con evidencia determinista). Cada archivo de código se traza a una historia del mapa de impacto, cada entrega se cierra con evidencia, y cada decisión relevante está registrada. El hito actual es la **Fase 4**: tras ejecutar R3-A–E (panel sobre **BD local SQLite**, modo oscuro, mapa editable, crédito — 2026-10-23) y retirar Apariencia (8.05) a petición del dueño, el mismo 2026-10-23 se ejecutó **R4-A: agenda real** (citas persistentes con anti-doble-reserva garantizada por la BD, `/admin/horarios`, `/mi-cita` por token, cola de correos pendiente de Resend), con Supabase aplazado al despliegue (D-R4-1). Siguen R4-B/C/D; los pendientes de usuario real (8.02/8.03) viven en R4-C.