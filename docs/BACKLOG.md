# Product Backlog — Plataforma web de clínica de bienestar integral

> **Preparado por:** ingeniería de software (senior, 10+ años).
> **Documentos de referencia:** `PROMPT.md` (requisitos y reglas) y `MAPA_IMPACTO.md` (objetivos, actores y epicas E1–E10).
> **Uso:** esta es la lista de trabajo del equipo. Cada ítem es un **Backlog Item (BI)** con prioridad, tamaño, dependencias y release sugerido. El backlog es vivo: se hace *grooming* antes de cada release y se re-prioriza según lo que se aprenda en cada fase.

---

## 1. Convenciones

**Prioridad**

- **P0 — Must:** sin este ítem el release está comprometido o se viola un requisito regulatorio.
- **P1 — Should:** importante, pero el release puede salir sin él si hay un trade-off consciente y documentado.
- **P2 — Nice:** mejora o diferible; se evalúa por sprint.

**Tamaño (escala t-shirt, relativa; calibrar en el primer grooming)**

| Tamaño | Story points | Criterio práctico |
|---|---|---|
| S | 1–2 | < 1 día persona; un archivo o una query |
| M | 3–5 | 1–3 días persona; 1 feature o 3–5 archivos |
| L | 8 | 4–8 días persona; flujo completo o módulo |
| XL | 13+ | > 1 semana persona; **descomponer antes de planificar** |

**Supuesto de capacidad:** equipo de 1–2 personas (full-stack + diseño). Si hay más capacidad, los releases se comprimen; la secuencia de dependencias se mantiene.

**ID de ítem:** `<Epica>.<n>`, alineado con las epicas de `MAPA_IMPACTO.md`.

---

## 2. Definition of Done (global)

Un ítem está **Done** solo si:

1. Código en **TypeScript strict**, modular, con `.env.example` documentado.
2. **Lint + format** pasan en CI; commits pequeños y descriptivos; `CHANGELOG.md` actualizado.
3. **Pruebas:** unitarias para lógica crítica (agenda, cupo, control por rol); **Playwright e2e** para flujos críticos (reservar, cancelar, inscribirse, login admin).
4. **Accesibilidad:** WCAG 2.2 AA en todo componente nuevo (foco visible, contraste, `aria`).
5. **UX mobile-first:** probado en móvil real o emulado; objetivos táctiles ≥ 44 px.
6. **Seguridad:** validación en servidor, control por rol aplicado, rate limiting en formularios públicos.
7. Nada se publica sin contenido real o marcado `TODO:`.
8. Vista previa aprobada antes de publicar (regla de UX del admin).

**Definition of Ready (para empezar un ítem):** criterios de aceptación claros, dependencias resueltas, diseño de la pantalla definido (al menos wireframe) y datos de ejemplo disponibles.

---

## 3. Backlog por epica

### E1 — Fundamentos, identidad y diseño (Release 1 / Fase 1)

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 1.01 | Bootstrap del repo: Next.js (App Router) + TypeScript, Tailwind, shadcn/ui, ESLint/Prettier, `.env.example` | P0 | M | — |
| 1.02 | CI/CD: GitHub Actions (lint, test, build) + preview deployments + despliegue a Vercel | P0 | M | 1.01 |
| 1.03 | Base de datos local (Postgres/MySQL): servidor, cliente SDK, migraciones versionadas (convención de nombres) | P0 | M | 1.01 |
| 1.04 | **Sistema de diseño:** design tokens en variables CSS (color, tipografía, radio, sombra, espaciado) + página interna `/design-system` | P0 | M | 1.01 |
| 1.05 | Layout base: header responsive, menú móvil, footer, botón flotante de WhatsApp | P0 | M | 1.04 |
| 1.06 | **Página de inicio:** hero, 4 accesos rápidos, presentación del psicólogo, testimonios, destacados dinámicos, ubicación | P0 | L | 1.04, 1.05 |
| 1.07 | Páginas estáticas: `/nosotros`, `/contacto`, `/privacidad` (aviso LFPDPPP integral) | P0 | M | 1.05 |
| 1.08 | Accesibilidad base: foco visible, orden de tab, contraste AA, `aria-live` en formularios | P0 | M | 1.05 |
| 1.09 | Copy de marca en español de México (tono cálido/profesional); contenido de ejemplo marcado `TODO:` | P0 | S | 1.06 |
| 1.10 | Dominio propio + SSL + redirect a www | P0 | S | 1.02 |

**Gate de salida (Fase 1):** se ve profesional en móvil y escritorio; pasa AA de contraste; el CTA "Agendar cita" es visible sin scroll en móvil.

### E2 — Zona gratuita (Release 2 / Fase 2)

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 2.01 | Migraciones: `free_resources`, `resource_categories`, `media_assets` + control por rol | P0 | M | 1.03 |
| 2.02 | Reproductor de video: YouTube/Vimeo embed + decisión sobre videos propios (almacenamiento local vs Mux/Cloudflare Stream — ver §5.2) | P0 | M | 2.01 |
| 2.03 | `/gratis`: biblioteca con filtros por categoría, duración y nivel + estados vacíos | P0 | M | 2.02 |
| 2.04 | Detalle de recurso: video, descripción, beneficios, precauciones, recursos relacionados | P0 | M | 2.03 |
| 2.05 | Botón compartir: WhatsApp (`wa.me` con texto precargado) + copiar enlace | P1 | S | 2.04 |
| 2.06 | CTA contextual recurso → servicio relacionado (mapeo configurable) | P1 | S | 2.04, 4.02 |
| 2.07 | Seed de contenido de ejemplo realista (12–16 recursos, 6 categorías) | P0 | M | 2.01 |

**Gate de salida (Fase 2):** filtros y reproductor funcionando; un visitante que llega por WhatsApp puede ver 3 videos y compartir uno en menos de 2 minutos.

### E3 — Blog educativo (Release 2 / Fase 2)

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 3.01 | Migraciones: `articles`, `article_categories`, `tags`, `article_tags` + control por rol | P0 | M | 1.03 |
| 3.02 | `/aprende`: listado con buscador y filtros por categoría/tag | P0 | M | 3.01 |
| 3.03 | Página de artículo: portada, autor, fecha, tiempo de lectura, índice, video opcional, artículos relacionados | P0 | M | 3.02 |
| 3.04 | Disclaimer "contenido informativo, no sustituye consulta" en cada artículo | P0 | S | 3.03 |
| 3.05 | SEO de artículos: meta por página, schema `Article`, sitemap dinámico | P1 | M | 3.03 |
| 3.06 | Seed de 10–12 artículos de ejemplo (uno por categoría) | P0 | M | 3.01 |

**Gate de salida:** buscador y filtros funcionando; lectura cómoda en móvil; disclaimer visible.

### E4 — Catálogo de servicios (Release 2–3 / Fases 2–3)

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 4.01 | Migraciones: `services`, `service_categories` + control por rol | P0 | M | 1.03 |
| 4.02 | `/servicios`: catálogo por categoría con filtros | P0 | M | 4.01 |
| 4.03 | Ficha de servicio: a quién va, qué esperar, duración, modalidad, precio opcional, FAQ | P0 | M | 4.02 |
| 4.04 | CTA "Agendar" con deep link: `/agendar?service=<id>&mode=<presencial|online>` | P0 | S | 4.03 |
| 4.05 | Seed de 8–10 servicios de ejemplo con precios marcados `TODO:` | P0 | S | 4.01 |
| 4.06 | Schema `Service` por ficha | P2 | S | 4.03 |

> **Estado (2026-10-22):** 4.06 ✅ JSON-LD `Service` (nombre, descripción, provider con NAP, `areaServed` CDMX) en cada `/servicios/[slug]` (R3-C).

**Gate de salida:** desde una ficha se llega a agendar con el servicio pre-cargado.

### E8 — Panel de administración (Release 3 / Fase 3)

> **Decisión clave (ver §5.1):** la Fase 2 publica contenido vía seed/migraciones. El admin completo llega en la Fase 3 y lo vuelve editable. Si el cliente exige editar desde el día 1, se adelanta un **admin mínimo** (auth + CRUD de 2.01/3.01/4.01) a la Fase 2.

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 8.01 | Auth (base de datos local): email/password + recuperación de contraseña | P0 | M | 1.03 |
| 8.02 | **RBAC:** roles Administrador/Terapeuta/Asistente en `profiles` + control por rol en todas las tablas | P0 | L | 8.01, 9.03 |
| 8.03 | 2FA opcional (TOTP) por usuario | P1 | M | 8.01 |
| 8.04 | Layout del admin: sidebar, responsive, ayuda contextual por pantalla | P0 | M | 8.01 |
| 8.05 | ~~**Módulo Apariencia:** logo, paleta (tokens), tipografías curadas, imágenes del hero → aplica tokens en vivo~~ — ❌ **retirado el 2026-10-22 a petición del dueño** (ver estado abajo) | P0 | L | 8.04, 1.04 |
| 8.06 | **Multimedia:** subir/reemplazar/eliminar con barra de progreso; enlazar YouTube/Vimeo; gestión de `media_assets` | P0 | L | 8.04, 2.01 |
| 8.07 | CRUD de artículos y recursos: borrador, programación de publicación, vista previa | P0 | M | 8.04, 3.01, 2.01 |
| 8.08 | CRUD de servicios y cursos: campos específicos, drag-and-drop de orden, visible/oculto | P0 | M | 8.04, 4.01 |
| 8.09 | Editor WYSIWYG para páginas y secciones + activar/desactivar | P1 | L | 8.04 |
| 8.10 | Testimonios: cola de aprobación (solo se publica aprobado; consentimiento registrado) | P1 | S | 8.04 |
| 8.11 | Enlaces: menú de navegación, botones, redes sociales, enlaces cortos (junto con 7.01/7.02) | P1 | M | 8.04, 7.01 |
| 8.12 | **Bitácora de auditoría** (`audit_logs`): quién cambió qué y cuándo | P1 | M | 8.02 |
| 8.13 | UX de errores: confirmación antes de borrar, deshacer de última acción, mensajes claros | P0 | M | 8.04 |

> **Estado (2026-10-22, R3-A/B/C/D ejecutados):** 8.01, 8.02 y 8.04 entregados como demo (auth + RBAC + layout; sesión firmada por cookie, perfiles en `lib/admin/store.ts` — usuarios reales Fase 4). **8.05–8.13 entregados contra base de datos local SQLite** (`node:sqlite`, `data/clinica-bienestar.db`): apariencia con paleta en vivo validada AA, multimedia con subida/progreso/referencias, CRUD de artículos/recursos/servicios/cursos con borrador/programado/publicado + `?preview=1`, cola de testimonios con consentimiento obligatorio, menú/redes/enlaces cortos editables, bitácora `audit_logs` consultable en `/admin/auditoria` y borrado blando con "Deshacer". **Diferidos P1 (válvulas de presión, no bloquean el gate): 8.03 (2FA) y 8.09 (WYSIWYG).** Nota: el "drag-and-drop" de 8.08/8.11 se implementó con botones ↑/↓ (accesible por teclado). **8.05 (Apariencia) retirado el 2026-10-22 a petición del dueño**: se eliminó el módulo de administración (página, editor y actions); el sitio público sigue leyendo el tema de la BD (`theme_tokens`), el panel queda con 7 módulos y el paso "cambia un color del tema" del gate se retira. Detalle por sprint y evidencia: `BACKLOG-R3.md` §5 y `ORGANIZACION-DEL-PROYECTO.md` §3 (ronda 8).

**Gate de salida (Fase 3):** una persona no técnica (probado con alguien real) edita un artículo, cambia un color del tema, sube una imagen y publica, sin ayuda, en menos de 15 minutos.

### E5 — Agenda de citas (Release 4 / Fase 4) — **core del negocio**

> **Estado (2026-10-23, R4-A EJECUTADO):** agenda REAL sobre **BD local SQLite** (decisión D-R4-1 en `BACKLOG-R4.md`; Supabase queda para el despliegue): 5.01–5.05 entregadas (tablas `appointments`/`availability_rules`/`notifications`, reglas por pro/día, motor de disponibilidad desde BD, **anti-doble-reserva por transacción + índice único parcial con prueba `npm run check:agenda` PASS**, flujo 4 pasos real); 5.06/5.07/5.10 parciales (`/mi-cita/<token>` por BD con cancelar/reprogramar y cutoff 24 h provisional D-R4-3; `/admin/horarios`; correos **encolados**, entrega stub → Resend en R4-D); 5.08 encolado (cron real R4-D); 5.09 pendiente D3; 5.12 pendiente R4-D. Faltas a cerrar en R4-B: excepciones por fecha, vista de calendario, lista de clientes.

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 5.01 | Migraciones: `clients`, `appointments`, `availability_rules`, `availability_exceptions` + control por rol | P0 | L | 1.03 |
| 5.02 | Horarios por profesional: días, turnos, duración por servicio, tiempo de descanso; bloqueos (vacaciones/festivos) | P0 | M | 5.01 |
| 5.03 | **Motor de disponibilidad:** zona horaria MX configurable, cálculo de slots por servicio/profesional, vista de calendario | P0 | L | 5.02 |
| 5.04 | **Anti-doble-reserva:** transacción + `SELECT … FOR UPDATE` (o advisory lock) en `appointments`; tests de concurrencia (2 requests paralelos → 1 éxito, 1 "ya ocupado") | P0 | L | 5.03 |
| 5.05 | **Flujo de reserva en 4 pasos** sin cuenta: servicio+modalidad → profesional+disponibilidad → fecha/hora → datos+consentimiento; un campo por pantalla en móvil | P0 | L | 5.03, 4.04 |
| 5.06 | Confirmación: correo (Resend) + enlace de WhatsApp + página `/mi-cita/<token>` | P0 | M | 5.05 |
| 5.07 | **Cancelación/reprogramación con enlace único firmado** (token con expiración) + política de anticipación configurable | P0 | L | 5.06 |
| 5.08 | Recordatorio automático: cron (función del servidor / Vercel cron) a N horas antes, configurable (email + `wa.me`) | P1 | M | 5.06 |
| 5.09 | **Mercado Pago** (opcional, activable por config): anticipo por cita, webhooks, **idempotencia**, estados de pago — misma capa que 6.05 | P1 | L | 5.05 |
| 5.10 | Agenda en admin: calendario, ver/confirmar/cancelar/reprogramar, lista de clientes | P0 | M | 5.07, 8.04 |
| 5.11 | Sincronización Google Calendar (API) — solo si se aprueba | P2 | L | 5.03 |
| 5.12 | **E2E Playwright:** reservar, cancelar, reprogramar, doble reserva paralela, login admin | P0 | L | 5.05–5.07 |

**Gate de salida (Fase 4):** cero dobles reservas en pruebas de carga; un paciente agenda, recibe confirmación, cancela y reagenda desde el enlace firmado, sin llamar.

### E6 — Cursos y talleres (Release 5 / Fase 5)

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 6.01 | Migraciones: `courses`, `course_sessions`, `enrollments`, `payments`, `lessons` + control por rol | P0 | L | 1.03 |
| 6.02 | `/cursos`: catálogo con filtros por tema y modalidad | P0 | M | 6.01 |
| 6.03 | Ficha del curso: temario, instructor, fechas, duración, precio, cupo disponible, requisitos | P0 | M | 6.02 |
| 6.04 | **Inscripción con control de cupo**: decremento atómico (transacción); "cupo lleno" deshabilita el botón | P0 | M | 6.03 |
| 6.05 | **Pagos de inscripción (Mercado Pago)**: reutiliza la capa de pagos de 5.09; confirmación por correo | P0 | M | 6.04, 5.09 |
| 6.06 | Inscripciones en admin: lista por curso, estado de pago, exportación CSV, reasignar cupos | P0 | M | 6.04, 8.04 |
| 6.07 | Schema `Course` + SEO de cursos | P2 | S | 6.03 |
| 6.08 | **Área privada de alumnos** *(Fase 6, opcional)*: lecciones en video, material descargable, avance; acceso solo con inscripción confirmada — **descomponer antes de planificar** | P2 | XL | 6.04, 8.02 |

**Gate de salida (Fase 5):** un alumno ve un curso, se inscribe, paga y recibe confirmación; el cupo baja; el admin ve la inscripción y la exporta a CSV.

### E7 — Enlace único y difusión (Releases 3 y 7 / Fases 3 y 7)

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 7.01 | **URL corta** personalizable `/c/<slug>` con redirect configurable desde el admin | P0 | M | 1.03, 8.04 |
| 7.02 | **Generador de QR** (PNG y SVG) desde el panel, descargables | P0 | S | 7.01 |
| 7.03 | **Página `/links`** tipo "link in bio": botones grandes a cada área, orden y textos editables desde el admin | P0 | M | 7.01, 8.04 |
| 7.04 | **Open Graph** completo en todas las páginas públicas (título, descripción, imagen, URL) | P1 | S | 1.05 |

> **Estado (2026-10-22):** 7.01 ✅ `app/c/[slug]/route.ts` (301/404, destino reasignable en `/admin/enlaces`); 7.02 ✅ QR PNG+SVG descargable por enlace corto en `/admin/enlaces`; 7.03 ✅ `/links` lee `link_items` (orden/textos/destacado editables); 7.04 ✅ OG + Twitter card con `public/images/og.png` (1200×630, `scripts/make-og.mjs`).

**Gate de salida (Fase 3):** el enlace corto + QR funcionan; la vista previa al compartir por WhatsApp se ve profesional.

### E9 — Datos, seguridad y privacidad (través; cierre en Release 7 / Fase 7)

> Estos ítems **no se acumulan al final**: control por rol y cifrado se aplican desde la migración correspondiente; el checklist completo se cierra en la Fase 7.

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 9.01 | **Aviso de privacidad LFPDPPP** integral + consentimiento expreso en la captura de citas | P0 | M | 1.07 |
| 9.02 | **Cifrado del "motivo de consulta"** (opcional) en reposo + minimización de datos | P0 | M | 5.01 |
| 9.03 | **Control por rol en todas las tablas** + pruebas de acceso cruzado por rol (cada rol solo ve lo suyo) | P0 | L | 8.02 |
| 9.04 | Hardening: cabeceras de seguridad, CSRF, rate limiting en formularios públicos, captcha invisible, validación en servidor | P1 | L | 1.02 |
| 9.05 | **Respaldos automáticos** + runbook de restauración documentado (pasos, RTO/RPO objetivo) | P0 | M | 1.03 |
| 9.06 | Banner de cookies **solo si** se habilitan cookies no esenciales (recomendado: no usar en Fase 1) | P2 | S | 10.05 |
| 9.07 | Procedimiento **ARCO** documentado (cómo atiende al paciente sus derechos, plazos, contacto) | P0 | S | 9.01 |
| 9.08 | **No publicar** historiales clínicos ni datos identificables en contenido público (regla verificable en 8.12 auditoría) | P0 | S | 8.12 |

**Gate de cierre (Fase 7):** checklist de cumplimiento entregado (LFPDPPP, control por rol probado, backups probados con una restauración real, bitácora activa).

### E10 — Rendimiento y SEO (Release 7 / Fase 7)

| ID | Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|---|
| 10.01 | **Core Web Vitals:** imágenes WebP/AVIF + lazy load, `font-display: swap`, preloads críticos | P0 | M | 1.06 |
| 10.02 | SEO técnico: metadatos por página, `sitemap.xml`, `robots.txt`, URLs semánticas en español | P0 | M | 3.03, 4.02 |
| 10.03 | **Datos estructurados:** `LocalBusiness`, `Article`, `Course`, `Service` | P1 | M | 3.03, 4.03, 6.03 |
| 10.04 | **SEO local:** NAP consistente en sitio, ficha de Google enlazada, mapa embebido | P1 | S | 1.06 |
| 10.05 | **Analítica respetuosa de privacidad** (Plausible o similar, sin cookies de seguimiento) | P1 | S | 1.02 |
| 10.06 | **Lighthouse ≥ 90 en móvil** (LCP < 2.5 s, CLS < 0.1, INP < 200 ms) en páginas públicas | P0 | M | 10.01 |

**Gate de cierre (Fase 7):** Lighthouse ≥ 90 en móvil en las 5 páginas principales; sitemap y robots verificados en Search Console.

---

## 4. Plan de releases (alineado con las fases de `PROMPT.md` §11)

| Release | Fases | Ítems incluidos | Gate de aceptación |
|---|---|---|---|
| **R0 — Setup** | Pre-fase 1 | 1.01, 1.02, 1.03, 1.10 | Repo, CI verde, base de datos local y dominio listos |
| **R1 — Base y diseño** | Fase 1 | 1.04–1.09 | Profesional en móvil/escritorio; AA de contraste |
| **R2 — Contenido** | Fase 2 | 2.01–2.07, 3.01–3.06, 4.01–4.05 | Filtros, buscador y reproductor funcionando |
| **R3 — Admin** | Fase 3 | 8.01–8.13, 7.01–7.04, 4.06 (opcional) | Persona no técnica edita todo sin ayuda — 🔶 ejecutado 2026-10-22 (salvo 8.03/8.09 diferidos); pendiente del visto bueno del gate |
| **R4 — Agenda** | Fase 4 | 5.01–5.10, 5.12 (5.09 solo si se aprueba) | Cero dobles reservas en pruebas de concurrencia — 🔶 **R4-A ejecutado 2026-10-23** (`BACKLOG-R4.md`) |
| **R5 — Cursos y pagos** | Fase 5 | 6.01–6.07 | Flujo de inscripción y pago extremo a extremo |
| **R6 — Alumnos (opcional)** | Fase 6 | 6.08 (descompuesto) | Acceso restringido por inscripción |
| **R7 — Cierre** | Fase 7 | 9.01–9.08, 10.01–10.06, 5.08, 5.11 (opcional) | Checklist completo: SEO, rendimiento, seguridad, docs, despliegue |

**Carga estimada (solo P0, con el supuesto de equipo de 1–2 personas):**

| Release | Puntos P0 (aprox.) | Duración estimada |
|---|---|---|
| R0 | 6 | ~1 semana |
| R1 | 18 | 2–3 semanas |
| R2 | 27 | 3–4 semanas |
| R3 | 27 | 3–4 semanas |
| R4 | 40+ | 4–6 semanas |
| R5 | 21 | 2–3 semanas |
| R6 | (se estima al descomponer 6.08) | a definir |
| R7 | 30+ | 2–4 semanas |

> El R4 es el más pesado y el más arriesgado (concurrencia, pagos, correos). Si el plazo aprieta, se recorta R7 (P1/P2) antes de recortar R4.

## 5. Decisiones abiertas (resolver antes de arrancar / por release)

| # | Decisión | Opciones | Impacto | Cuándo decidir |
|---|---|---|---|---|
| D1 | **Admin mínimo en Fase 2** | (a) contenido por seed → admin completo en Fase 3 (recomendado, menos fricción); (b) adelantar auth + 3 CRUDs a Fase 2 | (b) retrasa el contenido público ~1–2 semanas | Antes de R2 |
| D2 | **Hosting de videos propios** | (a) YouTube/Vimeo embed (casi gratis, sin control total); (b) almacenamiento local (corta; no ideal para streaming); (c) Mux/Cloudflare Stream (mejor streaming, costo mensual) | Costo y calidad de reproducción | Antes de R2 (2.02) |
| D3 | **Anticipos por cita** | Sí (activar 5.09 en R4) / No (pagos solo en cursos, 6.05) | Complejidad del flujo de reserva; caja anticipada | Antes de R4 |
| D4 | **Política de cancelación** | Anticipación mínima (24 h / 48 h / 72 h) + reprogramación permitida o no | Regla central de 5.07; afecta la percepción del paciente | Antes de R4 |
| D5 | **Área de alumnos en V1** | Sí / No / Postergar a V2 | 6.08 es XL; define si R6 existe | Antes de R5 |
| D6 | **Google Calendar** | En V1 / Después | 5.11 es L y P2 | En R7 |
| D7 | **Analítica** | Plausible (recomendado: sin cookies) / GA4 (requiere banner y cookies) | Interacciona con 9.06 y LFPDPPP | Antes de R7 |
| D8 | **Profesionales y horarios reales** | Cantidad de profesionales, turnos, servicios que atiende cada uno | Complejidad del motor de disponibilidad (5.03) | Antes de R4 |

---

## 6. Riesgos principales y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Doble reserva por concurrencia** | Media | Alto (confianza del cliente) | 5.04: transacción + row lock desde el diseño; tests paralelos obligatorios antes de R4; no parchar a último momento |
| **Admin que nadie puede usar** | Media | Alto (objeto de negocio #5) | Gate de Fase 3 con usuario real no técnico; principios de UX (8.13) desde el layout, no al final |
| **Contenido sin fuente real** | Alta | Medio (confianza, LFPDPPP) | Seed realista + `TODO:` visibles; testimonios/credenciales solo con consentimiento; 9.08 |
| **Videos pesados degradan LCP** | Media | Medio (metas de rendimiento) | D2: priorizar embed; nunca almacenar videos grandes en Postgres; lazy load de reproductores |
| **WhatsApp Business API** (Fase 2 del producto) | Baja en V1 | Medio | V1 usa `wa.me` con mensaje precargado (cero costo, sin aprobación); API solo si el volumen lo justifica |
| **Escopazo del admin** (13 ítems) | Alta | Medio | 8.09 (WYSIWYG) y 8.12 (auditoría) son P1: se pueden posponer a R7 sin bloquear el gate de R3 |
| **Cambio de paleta/tokens tarde** | Media | Bajo-Medio | 1.04 + 8.05: tokens desde el día 1; toda la UI consume variables, nada de hardcode |
| **LFPDPPP / datos sensibles** | Baja si se hace bien | Alto (legal) | 9.01–9.03 desde las primeras migraciones; cifrado del motivo de consulta; auditoría |
| **Dependencia de la base de datos local (Storage, Auth)** | Baja | Medio | Alternativa evaluada en Fase 0 si la justificación (costo/mantenimiento) lo pide (regla de `PROMPT.md` §7) |

---

## 7. Reglas de gestión del backlog

1. **Grooming por release:** antes de cada release se revisan los ítems de ese release (definición de ready, dependencias, tamaños). Lo que no está ready sale del sprint.
2. **Orden de trabajo dentro de un release:** infraestructura/esquema → lectura pública → escrituras → integraciones → polimento.
3. **P0 no se negocia** sin aprobación explícita del cliente (sobre todo 9.x y 5.04). P1/P2 son la válvula de presión si el plazo aprieta.
4. **Todo ítem XL se descompone** en ≤ 2 puntos antes de entrar a un sprint (aplica a 6.08).
5. **Cada gate de release incluye una demo** con el criterio de aceptación de `PROMPT.md` §11; el cliente aprueba antes de arrancar el siguiente (regla §12 del prompt).
6. **`CHANGELOG.md` + commits descriptivos** en todo momento; sin commits "fix stuff".
7. **No inventar datos:** testimonios, precios, horarios y credenciales solo reales o `TODO:` (regla 6 de `PROMPT.md` §12).




