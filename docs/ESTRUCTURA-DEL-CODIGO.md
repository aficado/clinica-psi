# Estructura del código — `clinica-bienestar`

> Inventario de archivos, arquitectura y trazabilidad historias ↔ archivos.
> Última revisión: 2026-10-23 (R4-A ejecutado — agenda real). **Dónde vive cada cosa:** estado del release en curso → `BACKLOG-R4.md` (R3 quedó en `BACKLOG-R3.md`); historia/crónica y decisiones → `ORGANIZACION-DEL-PROYECTO.md`; cómo arrancar → `README.md`. Este doc NO duplica estados ni historia: describe qué es cada archivo hoy.

---

## 1. Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 15.5** (App Router) | 31 rutas; las de contenido son `force-dynamic` (leen de la BD) |
| Lenguaje | **TypeScript 5.8** (strict) | `tsc --noEmit` limpio |
| UI | **React 19.1** | Componentes propios (`components/ui.tsx`); sin librerías de componentes |
| Estilos | **Tailwind CSS 4.1** | Tokens en `@theme` de `globals.css`, sobreescritos en runtime por `theme_tokens` (BD) y por la paleta oscura (8.14) |
| Fuentes | `next/font`: Fraunces + Inter | `display: swap`, variables CSS |
| **BD local** | **`node:sqlite`** (Node ≥ 22) | `data/clinica-bienestar.db`, 15 tablas (12 + agenda R4-A), seed idempotente desde `lib/data.ts`; Supabase/RLS aplazados al despliegue (D-R4-1, `docs/BACKLOG-R4.md`) |
| Sesión | HMAC-SHA256 stateless (`node:crypto`) | Cookie `rv_admin_session` (12 h); perfiles demo en `lib/admin/store.ts` (usuarios reales: Fase 4) |
| QR | `qrcode` 1.5 | PNG/SVG en `QrWidget` (público y admin) |
| Imagen OG | `sharp` (herramienta) | `scripts/make-og.mjs` → `public/images/og.png` |

**Reservado (marcado `TODO:` en código y `.env.example`):** Supabase (despliegue/D-R4-1: usuarios, RLS), Resend (cola lista; falta R4-D: clave + remitente verificado), Mercado Pago (Fase 5), Plausible (7).

**Decisiones clave del R3:** BD local SQLite como etapa intermedia; `lib/data.ts` queda solo como fuente del seed; RBAC validado SIEMPRE en server actions; el público solo ve contenido `publicado`/`visible` (preview con `?preview=1` + sesión); borrado blando con "Deshacer"; modo oscuro por encima de los tokens del admin (ver §4.5).

---

## 2. Inventario de archivos (125: 34 `app/` + 38 `components/` + 20 `lib/` + 3 `scripts/` + 11 `public/` + 10 raíz + 9 `docs/` + BD en `data/`)

> Sin conteo de líneas por archivo: caducan cada ronda. El total ronda las ~14 000 líneas de código fuente.

### 2.1 `app/` — páginas, rutas y configuración

| Archivo | Qué hace |
|---|---|
| `layout.tsx` | Layout raíz: `lang="es-MX"`, fuentes, metadata + OG/Twitter con `og.png`, scripts inline (`has-js` y **anti-flash de modo oscuro** — aplica `dark` desde `localStorage.rv_theme` o `prefers-color-scheme`), `SiteChrome` con tema/menú/redes leídos de la BD |
| `page.tsx` | Inicio: hero (imagen de `theme_tokens.hero_image_id` si existe), accesos rápidos, destacados desde BD, testimonios aprobados con consentimiento (empty state con 3 tarjetas placeholder + `TodoChip`), **mapa con `MapBlock`** |
| `globals.css` | Tokens `@theme` + base + **bloque `html.dark`** (8.14: variables con `!important` + overrides de utilidades por rol) |
| `animations.css` | Sistema de movimiento (reveals, float, menú móvil, fallback `has-js`) |
| `gratis/page.tsx` · `gratis/[slug]/page.tsx` | Catálogo (filtros, items de BD) y detalle con video, beneficios, precauciones, CTA a servicio visible, preview `?preview=1` |
| `aprende/page.tsx` · `aprende/[slug]/page.tsx` | Blog (buscador + filtros) y artículo (TOC, tags, relacionados, disclaimer), preview |
| `servicios/page.tsx` · `servicios/[slug]/page.tsx` | Catálogo (orden `position`) y ficha con FAQ, CTA deep-link, **JSON-LD `Service`** (4.06), preview de ocultos |
| `cursos/page.tsx` · `cursos/[slug]/page.tsx` | Catálogo y ficha de curso con `EnrollmentForm`, preview de ocultos |
| `agendar/page.tsx` | Flujo de reserva (4 pasos) con servicios de BD + profesionales de `lib/data`; disponibilidad REAL consultada por action (R4-A) |
| `mi-cita/[token]/page.tsx` | Página server: lee la cita de la BD por token (`getAppointmentByToken`, R4-A) → `MiCitaClient` (ver/cancelar/reprogramar) |
| `nosotros/page.tsx` · `contacto/page.tsx` · `privacidad/page.tsx` | Estáticas de identidad/contacto (contacto: dinámica, mapa desde BD) y aviso LFPDPPP |
| `links/page.tsx` | Link-in-bio (7.03): botones de `link_items` + QR con URL absoluta (`siteUrl()/links`) |
| `c/[slug]/route.ts` | Enlace corto (7.01): 301 al destino de `short_links` (interno → absoluto), 404 si no existe |
| `api/media/upload/route.ts` | POST de subida multipart (8.06): RBAC admin, disco + `media_assets` + auditoría |
| `uploads/[name]/route.ts` | **Sirve subidas en runtime** (ronda 9): `next start` congela `public/` al arrancar; esta ruta lee el disco por request (guarda anti path-traversal + MIME) |
| `admin/layout.tsx` | Valida sesión; sin sesión renderiza sin shell; con sesión `AdminProvider`+`AdminShell`+`ProfileProvider`; `noindex` |
| `admin/page.tsx` | Dashboard: estado (citas próximas), accesos a los 8 módulos, bloque RBAC |
| `admin/login/page.tsx` · `admin/login/[action]/page.tsx` | Login demo (8.01) y recuperación demo (`confirm`/`verify`) |
| `admin/contenido/page.tsx` | Hub CRUD (8.07/8.08): 4 pestañas, deep-link `?tab=&edit=`; RBAC `canEditContent`; sin permiso → mensaje claro |
| `admin/multimedia/page.tsx` | Biblioteca (8.06) → `MediaLibrary` |
| `admin/enlaces/page.tsx` | Botones `/links` + enlaces cortos con QR (7.01–7.03); solo admin |
| `admin/menu/page.tsx` | Menú, redes y **mapa** (8.11 + 8.15); solo admin |
| `admin/testimonios/page.tsx` | Cola de aprobación (8.10); solo admin |
| `admin/auditoria/page.tsx` | Bitácora server-rendered con filtros GET (8.12); solo admin |
| `admin/horarios/page.tsx` | **Agenda (R4-A, 5.10 parcial)**: citas + horarios por día; `getRules()`/`listAppointments()` server-rendered; RBAC `canManageSchedule` (admin+terapeuta) |
| `robots.ts` · `sitemap.ts` | Robots (bloquea `/admin`, `/mi-cita`) y sitemap **desde la BD** (solo publicado/visible, `lastmod` real); dominio `TODO:` |

### 2.2 `components/` — UI pública (22)

| Archivo | Qué hace |
|---|---|
| `SiteChrome.tsx` | Skip link + Header + Footer + WhatsAppFloat, SOLO rutas públicas (`usePathname`); recibe `nav`/`social` por props |
| `Header.tsx` | Logo, navegación desde `nav_items` (props), **`ThemeToggle`**, CTA, menú móvil (overlay fuera del `<header>` — criterio F6) |
| `Footer.tsx` | NAP, enlaces del menú (props), redes (`site_settings`), nota de demo, aviso de privacidad, **crédito «Generada por vegttech» (8.16)** |
| `ThemeToggle.tsx` | Toggle sol/luna (8.14): alterna `dark` en `<html>` + `localStorage.rv_theme` |
| `MapBlock.tsx` | Mapa (8.15): placeholder (consulta del seed) / embed Google por consulta / iframe genérico / botón «Cómo llegar» |
| `Reveal.tsx` | Movimiento: IntersectionObserver + variantes `up`/`card` + red de seguridad (rAF + chequeo 1.2 s) |
| `ui.tsx` | Primitivas (`Button`, `Card`, `Chip`, `SectionTitle`, `TodoChip`, `Icon` con 23 iconos incl. sol/luna) |
| `cards.tsx` | Tarjetas de contenido + `categoryLabel` + `posterSrc` |
| `AprendeCatalog` · `FreeCatalog` · `ServicesCatalog` · `CoursesCatalog` | Catálogos con filtros; reciben `items` de BD por props (taxonomías de `lib/data`) |
| `Filters.tsx` | Píldoras de filtro reutilizables |
| `BookingFlow.tsx` | Reserva 4 pasos (R4-A): disponibilidad real vía `fetchAvailability`, alta vía `bookAppointment` (BD, anti-doble-reserva); consentimiento; sin `localStorage` |
| `MiCitaClient.tsx` | Ver/cancelar/reprogramar la cita desde el enlace único (acciones de BD; cutoff 24 h provisional) |
| `EnrollmentForm.tsx` · `ContactForm.tsx` · `ShareButtons.tsx` | Formularios demo (WhatsApp) y compartir/copiar |
| `VideoEmbed.tsx` · `WhatsAppFloat.tsx` | Embed YouTube/Vimeo; botón flotante |
| `QrWidget.tsx` | QR PNG/SVG descargable de cualquier URL (7.02) |
| `LinksClient.tsx` | Botones de `/links` (props) + QR del propio enlace |

### 2.2b `components/admin/` — panel (16)

| Archivo | Qué hace |
|---|---|
| `AdminShell.tsx` | Sidebar filtrada por rol + `ThemeToggle` (sidebar y barra móvil); "Próximamente": Usuarios/Ajustes |
| `AdminProvider.tsx` · `ProfileProvider.tsx` · `RoleGuard.tsx` | Contextos de sesión/perfil (SSR + `localStorage`) y guard de UI por rol (defensa débil) |
| `ContentHub.tsx` | Hub de 4 pestañas: estados, mostrar/ocultar, reordenar ↑↓, "Ver" con preview, borrar (admin) con **"Deshacer"** |
| `content/ui.tsx` | Helpers de formularios: `Field`/`T`/`Sel`/`Chk`/`SaveBar`, `ytId`, `parseSections`/`sectionsToText` (cuerpo con `# ` y párrafos), `parseFaq`, `msToLocal`/`localToMs` |
| `content/ArticleForm` · `content/ResourceForm` · `content/ServiceForm` · `content/CourseForm` | Formularios por colección (slug inmutable tras crear; validación final en el servidor) |
| `MediaLibrary.tsx` | Subida XHR con progreso, drag & drop, videos, confirmación + "Deshacer" *(uso de assets: portadas de recursos; hero sin UI y videos sin consumo — decisión B, ver §4.5)* |
| `MediaEmbed.tsx` | Embebido de video en la biblioteca |
| `LinksManager.tsx` | Botones de `/links` (↑↓/destacado/visible) + enlaces cortos con QR desplegable; "Deshacer" |
| `MenuManager.tsx` | CRUD de `nav_items` + redes (`site_settings`) + **sección «Mapa»** (tipo + consulta/URL, acción `saveMap`) |
| `TestimonialsManager.tsx` | Cola de aprobación; aprobar exige consentimiento; "Deshacer" |
| `ScheduleManager.tsx` | **R4-A**: pestañas Citas (upcoming por día, cancelación admin con arm, historial) y Horarios (edición open/close/activo por regla, quitar/añadir día); acciones RBAC en servidor |

### 2.3 `lib/` — lógica (20)

| Archivo | Qué hace |
|---|---|
| `db.ts` | Conexión y esquema (`node:sqlite`; `LOCAL_DB_PATH` sobreescribe): 15 tablas + migraciones `ALTER` comprobadas (`media_assets.deleted_at`; `site_settings.map_type/map_query/map_url`; `site_settings.cancel_cutoff_hours`) + índices únicos parciales de agenda; `references` entre comillas |
| `content.ts` | Capa de datos (SOLO servidor): tipos fila/vista, `seedIfEmpty()`, lectores públicos y `...All`, mutadores validados que devuelven `SaveResult` (contenido, testimonios, enlaces, menú, redes, **`saveMapSettings`**), utilidades (`isLiveStatus`, `validSlug`, `validVideo`, `validHref`) |
| `content/actions.ts` | Server actions: `currentProfile()` + RBAC por acción + `logAudit` + `invalidate(...)`; incluye `saveMap` |
| `schedule.ts` | **Agenda real (R4-A)**, solo servidor: reglas por pro/día (`seedRulesIfEmpty` desde `lib/data`), `openSlotsFor` (reglas − ocupación real), `createAppointment`/`rescheduleAppointment` (BEGIN IMMEDIATE + `ux_appt_slot` = 5.04), `cancelAppointment` (cutoff `cancel_cutoff_hours`, D-R4-3), `getAppointmentByToken`/`listAppointments`/`countUpcoming`, cola `notifications`, `saveRule`/`deleteRule` |
| `schedule/actions.ts` | Server actions de agenda: públicas (`fetchAvailability`, `bookAppointment`, `cancelMyAppointment`, `rescheduleMyAppointment` — credencial = token del enlace) y de panel (`saveAvailabilityRule`, `deleteAvailabilityRule`, `adminCancelAppointment` — sesión + `canManageSchedule` + auditoría) |
| `audit.ts` | `logAudit` + `getAuditLogs` (filtros, máx. 300) |
| `rbac.ts` | `canAdmin` / `canEditContent` (admin+therapist) / `canManageSchedule` (admin+therapist, R4-A) / `canEditAppearance` / `canManageMedia` |
| `themes.ts` · `themes-core.ts` · `fonts.ts` | Tema en BD (`theme_tokens`; `getThemeTokens` devuelve copia PLANA), valores por defecto client-safe, fuentes curadas |
| `contrast.ts` | Contraste WCAG (helper reutilizable; hoy sin consumidor directo en UI) |
| `media.ts` · `media-core.ts` | Assets: alta/listado (excluye borrados), borrado blando + restore, referencias (bloquean borrar en uso), `validateVideoUrl`, `mediaToView` (objeto plano) |
| `multimedia/actions.ts` | Acciones de multimedia (subida/videos/borrado/restore) con RBAC+auditoría. *(El módulo Apariencia fue retirado: `lib/apariencia/` y el editor ya no existen; `saveThemeTokens` queda sin consumidor de UI — el tema se lee de `theme_tokens` con los valores del seed)* |
| `slots.ts` | Motor demo histórico (FNV-1a). Desde R4-A solo se usa `professionalsFor`; la disponibilidad real viene de `schedule.ts` (el resto se conserva marcado `TODO:` como referencia) |
| `data.ts` | **Fuente del seed** + interfaces + taxonomías + `clinic` + `professionals` (lo que el público ya no lee) |
| `utils.ts` | `cn`, `waLink`, `siteUrl()`, `slugify`, `formatDateMX`/`formatDateLongMX` (esperan `yyyy-mm-dd`), `timeLabel`, `readingTime`, `slotKey`, `asString` |
| `admin/session.ts` · `admin/store.ts` · `admin/actions.ts` · `admin/storage.ts` | Sesión firmada stateless, perfiles demo, `signIn`/`signOut`, espejo `localStorage` del perfil |

### 2.4 Raíz, `scripts/` y `public/`

| Archivo | Qué hace |
|---|---|
| `middleware.ts` | `Cache-Control: no-store` en todo lo que no sea `/_next/*` (criterio F7) |
| `scripts/make-og.mjs` | Genera `public/images/og.png` (1200×630) con `sharp` desde el SVG de marca |
| `scripts/process-notifications.mjs` | **R4-A**: procesa la cola `notifications` vencida (confirmación/recordatorio/cancelación). Hoy STUB (`provider='stub'`); con `RESEND_API_KEY` se niega a marcar nada y avisa: TODO (R4-D) implementar el envío. `npm run notifications` |
| `scripts/check-double-booking.mjs` | **R4-A**: prueba 5.04 sobre la BD real (1.ª entra, 2.ª UNIQUE, tras cancelar se libera); sale PASS/FAIL y limpia sus filas. `npm run check:agenda` |
| `.env.example` | Variables por fase + `LOCAL_DB_PATH` + `SITE_BASE_URL` |
| `public/images/` | `og.png` + ilustraciones SVG (hero, avatar, 5 posters) |
| `public/uploads/` | Imágenes subidas del panel (servidas por `app/uploads/[name]/route.ts`) |
| config | `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `next-env.d.ts`, `package-lock.json`, `.gitignore`, `README.md` |

### 2.5 `docs/` (9)

`PROMPT.md` (contrato) · `MAPA_IMPACTO.md` (estrategia/epicas) · `BACKLOG.md` (maestro R0–R7) · `BACKLOG-R3.md` (release R3 + estado) · `BACKLOG-R4.md` (release en curso: agenda real, D-R4, sprints, gate) · `DEFINITION_OF_DONE.md` (R0–R2 sellado, histórico) · `ESTRUCTURA-DEL-CODIGO.md` (este) · `ORGANIZACION-DEL-PROYECTO.md` (crónica, decisiones, metodología) · `INVENTARIO.md` (máquina + §7 proyecto).

---

## 3. Rutas (31)

| Ruta | Tipo | Epica |
|---|---|---|
| `/` · `/gratis` · `/gratis/[slug]` · `/aprende` · `/aprende/[slug]` · `/servicios` · `/servicios/[slug]` (+JSON-LD) · `/cursos` · `/cursos/[slug]` · `/agendar` · `/mi-cita/[token]` · `/links` | ƒ (BD) | E1–E7 |
| `/nosotros` · `/privacidad` · `/contacto` (ƒ: mapa BD) · `/c/[slug]` (301/404) | ○/ƒ | E1, E7, E9 |
| `/admin` + `login` + `login/[action]` + `contenido` + `horarios` + `multimedia` + `enlaces` + `menu` + `testimonios` + `auditoria` | ƒ `noindex` | E8, E5 (R4-A) |
| `/api/media/upload` · `/uploads/[name]` | ƒ | E8 (8.06) |
| `_not-found` · `/robots.txt` · `/sitemap.xml` (ƒ, desde BD) | ○/ƒ | E10 |

---

## 4. Arquitectura

### 4.1 Flujo de datos

```
lib/data.ts (seed) ─seedIfEmpty()→ lib/db.ts (SQLite 15 tablas) ─┬→ lib/content.ts (lectores)  → app/*/page.tsx (RSC) → HTML
                                                                 ├→ lib/content/actions.ts
                                                                 └→ lib/schedule.ts (agenda: reglas − ocupación) → /agendar, /mi-cita, /admin/horarios
   components/* ──(acciones)──▶ [público: token del enlace | panel: RBAC(currentProfile)] → mutador validado (TX) → logAudit → invalidate(paths)
        └── router.refresh() → el RSC relee la BD
```

- Una sola fuente de verdad: la BD; páginas públicas con lectores "vivos", admin con `...All`/`includeHidden`.
- Escrituras SOLO por server actions (nunca SQL desde la UI); toda mutación audita.
- Citas: **reales en la BD desde R4-A** (`appointments`; el antiguo `localStorage.rv_bookings` quedó sin uso — no migrar: la demo anterior no generaba citas válidas persistentes). Supabase + RLS: al decidir despliegue (D-R4-1).
- **Filas de `node:sqlite` con prototipo nulo** → siempre mapear a objeto plano antes de pasar a un cliente (`rowTo*`, `mediaToView`, `{ ...row }`).
- **`public/` se congela al arrancar `next start`** → las subidas se sirven del disco vía `app/uploads/[name]/route.ts`.

### 4.2 Movimiento (ronda 5; intacto)

Animación CSS + IO · 40 px / 650 ms / `cubic-bezier(0.22,1,0.36,1)` · `rootMargin -8%` · variantes `up`/`card` (escala 0.96→1) · stagger `Math.min(i,4)*70` ms · red de seguridad (rAF + 1.2 s) · 0 anidamientos · `float-soft`/`float-slow` · **forzado** (sin override de `prefers-reduced-motion`, decisión del dueño 2026-10-16) + fallback `has-js`.

### 4.3 Accesibilidad (WCAG 2.2 AA)

`lang="es-MX"`, skip link, `:focus-visible` 3 px, `aria-*` en 22+ archivos (`role="status"`/`alert`, `aria-expanded`, `aria-selected`, `aria-current`), targets ≥44 px, nada depende solo del color. **El modo oscuro mantiene AA** (contrastes calculados: texto/fondo 15.2:1 · blanco/botón 9.7:1 · texto/CTA 5.8:1) y el `ThemeEditor` histórico validaba AA antes de guardar paletas.

### 4.4 SEO

Metadata + OG + Twitter card con `og.png`; `metadataBase` dominio `TODO:`; `sitemap.xml` desde BD con `lastmod` real; `robots.txt`; JSON-LD `Service`; URLs semánticas con slug inmutable.

### 4.5 Panel admin y RBAC

```
login → cookie rv_admin_session → layout valida sesión → AdminShell (nav por rol)
  /admin            dashboard          /admin/contenido   ContentHub      (canEditContent; borrar canAdmin)
  /admin/horarios   ScheduleManager    (canManageSchedule: admin+terapeuta)
  /admin/multimedia MediaLibrary       (canAdmin)         /admin/enlaces  LinksManager (canAdmin)
  /admin/menu       MenuManager (nav + redes + mapa)      (canAdmin)
  /admin/testimonios TestimonialsManager (consentimiento) (canAdmin)
  /admin/auditoria  bitácora (canAdmin)
```

| Módulo | admin | therapist | assistant |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| Contenido: crear/editar/estados/reordenar | ✅ | ✅ | ❌ |
| **Agenda: ver/cancelar citas + horarios (R4-A)** | ✅ | ✅ | ❌ (D-R4-5) |
| Contenido: borrar/restaurar · Multimedia · Enlaces · Testimonios · Menú/redes/mapa · Auditoría | ✅ | ❌ |  |
| Apariencia (8.05) | ❌ **retirado 2026-10-22** (a petición del dueño; el tema público sigue leyendo `theme_tokens`) | ❌ |  |
| Usuarios / Ajustes | 🔜 Fase 4 (8.02 real, 8.03 2FA) | 🔜 | 🔜 |

**Decisiones de alcance vigentes (detalle e historia en `ORGANIZACION` §4):**
- **Opción B (2026-10-22):** Multimedia queda como almacén de assets (uso activo: portadas de recursos); el hero no tiene UI de asignación y los videos enlazados no se consumen — uso "justo" diferido a Fase 4+. No retirar el módulo: es el único medio de subir imágenes.
- **Modo oscuro (8.14):** `html.dark` sobreescribe los tokens con `!important` (ganan a los inline del admin) + overrides de utilidades por ROL (`.bg-white`, `.bg-sage`, `.bg-terracotta`, `.text-mist*`, hovers) porque un token es superficie en unos componentes y texto en otros.
- **Mapa (8.15):** los 4 tipos (placeholder/embed/iframe/enlace) existen porque la dirección real sigue sin definir (D1–D8).

### 4.6 Modelo de datos (15 tablas)

| Tabla | Claves/notas |
|---|---|
| `articles` / `free_resources` | PK `slug`; `status` (borrador/programado/publicado) + `scheduled_at`; `content` JSON; borrado blando |
| `services` / `courses` | PK `slug`; `position` (orden público), `visible`; `content` JSON |
| `testimonials` | `status` pendiente/aprobado; `consent` 0/1 — aprobar exige consentimiento |
| `nav_items` / `link_items` | `position`, `visible` (+`is_primary` en link_items) |
| `short_links` | PK `slug`, `target` (interno o URL) |
| `site_settings` | Fila única: `instagram`, `facebook`, `map_type`/`map_query`/`map_url` (8.15), `cancel_cutoff_hours` (R4-A, D-R4-3: default 24) |
| `theme_tokens` | Fila única: colores hex + fuentes curadas + `hero_image_id` |
| `media_assets` | `kind`, `source`, `file_url`, `references` JSON (bloquean borrado en uso), `deleted_at` |
| `audit_logs` | actor_email/actor_role/action/entity/entity_id/detail/created_at |
| **`appointments`** (R4-A) | PK autonum; `token` UNIQUE (`rv-<16 hex>`); snapshot `duration`; `status` confirmada/cancelada (+completada); **`ux_appt_slot` único parcial `(pro_id, date, hour) WHERE status='confirmada'` = garantía 5.04**; canceladas liberan el slot |
| **`availability_rules`** (R4-A) | Una fila por `(pro_id, day_of_week)` (UNIQUE); `open_hour`/`close_hour`/`active`; semilla demo desde `lib/data` (TODO D8) |
| **`notifications`** (R4-A) | Cola de correos: `kind` (confirmacion/recordatorio/cancelacion…), `due_at`, `sent_at`, `provider` ('stub' hasta Resend) |

Reglas: `created_at`/`updated_at`/`deleted_at` epoch ms; slug inmutable tras crear; `position` = max+1 si no se pasa; reordenar exige el set completo; `isLiveStatus = publicado O (programado Y fecha vencida)`; citas: ventana 1–21 días, cutoff de auto-gestión `cancel_cutoff_hours`, alta/movimiento SIEMPRE en `BEGIN IMMEDIATE`.

---

## 5. Historias ↔ archivos (trazabilidad)

Estado detallado del release: `BACKLOG-R4.md` (R4-A) y `BACKLOG-R3.md` (R3-A–E). Leyenda: ✅ hecho (incl. demo) · ⚠️ pendiente de fase indicada · ❌ retirado/diferido.

| ID | Historia | Archivos clave | Estado |
|---|---|---|---|
| E1.1–E1.3, E1.5–E1.7 | Portada, nosotros, a11y, CTAs, ubicación, privacidad | `page.tsx`, `nosotros`, `contacto`, `privacidad`, `ui.tsx`, `globals.css` | ✅ (NAP/credenciales `TODO:`) |
| E1.4 | Editar paleta/tipografías desde el panel | ~~`admin/apariencia`, `ThemeEditor`~~; `themes.ts`+`layout.tsx` (tema público) | ❌ retirado 2026-10-22 (fue ✅ R3-B) |
| E2.1–E2.5 | Zona gratuita: filtros, video, detalle, compartir, CTA | `gratis/*`, `FreeCatalog`, `VideoEmbed`, `ShareButtons` | ✅ |
| E2.6 | CRUD de recursos | `ContentHub` + `ResourceForm` | ✅ R3-C (8.07) |
| E3.1–E3.4, E3.6 | Blog: categorías, TOC/tags, buscador, disclaimer, relacionados | `aprende/*`, `AprendeCatalog` | ✅ |
| E3.5 | Editor con borradores/programación/preview | `ArticleForm` + estados + `?preview=1` | ✅ R3-C (8.07); WYSIWYG 8.09 diferido |
| E4.1–E4.3 | Catálogo, ficha, deep-link a agenda | `servicios/*`, `ServicesCatalog` | ✅ |
| E4.4 | CRUD servicios/cursos | `ServiceForm`/`CourseForm`, `reorder*` | ✅ R3-C (8.08) |
| E4.6 | Schema `Service` | JSON-LD en `servicios/[slug]` | ✅ R3-C (4.06) |
| E5.1 | Reservar ≤4 pasos | `BookingFlow`, `schedule/actions.ts` | ✅ **real** (R4-A; persiste en BD) |
| E5.2–E5.4, E5.6–E5.7, E5.10 | Disponibilidad real, anti-doble-reserva, `/mi-cita` por token, cancelar/reprogramar, agenda admin | `lib/schedule.ts(+actions)`, `MiCitaClient`, `/admin/horarios`, `ScheduleManager` | ✅ 🔶 **R4-A ejecutado** (correos = cola stub; cutoff 24 h provisional; ⬜ excepciones/calendario en R4-B; ⚠️ entrega correo + E2E en R4-D) |
| E5.5, E5.8–E5.9 | Zona horaria configurable, cron real, recordatorios email, pagos | `notifications`, `process-notifications.mjs` | 🔶 encolado (stub); ⚠️ R4-D (Resend/cron/pagos según D3) |
| E6.1–E6.3 | Catálogo, ficha, inscripción demo | `cursos/*`, `EnrollmentForm` | ✅ (pago ⚠️ Fase 5) |
| E6.4/E6.6 | Cupo atómico / área alumnos | — | ⚠️ Fase 5 / 6 (D5) |
| E6.5 | Cursos editables en admin | `ContentHub` pestaña Cursos | ✅ R3-C (8.08) |
| E7.1–E7.3 | URL corta + QR, `/links` editable, OG completo | `c/[slug]`, `LinksManager`, `links/*`, `og.png`, `layout.tsx` | ✅ R3-C (7.01–7.04) |
| E8.1–E8.2, 8.04 | Auth, RBAC, layout | `admin/*`, `lib/admin/*`, `AdminShell` | ✅ (usuarios reales ⚠️ Fase 4) |
| 8.05 | Apariencia | ~~módulo completo~~ | ❌ retirado 2026-10-22 |
| 8.06 | Multimedia | `MediaLibrary`, `lib/media.ts`, `uploads/[name]` | ✅ (R3-B; alcance actual: decisión B en §4.5) |
| 8.07–8.08 | CRUD contenido | `ContentHub` + 4 forms | ✅ R3-C |
| 8.09 | WYSIWYG | — | ❌ diferido (editor de texto con `# `/párrafos lo cubre) |
| 8.10–8.13 | Testimonios, menú/redes, auditoría, deshacer | `TestimonialsManager`, `MenuManager`, `audit.ts`+`/admin/auditoria`, borrado blando | ✅ R3-D |
| 8.14 | Modo oscuro en todo el sitio | `ThemeToggle`, `layout.tsx` (script), `globals.css` (`html.dark`) | ✅ R3-E |
| 8.15 | Mapa editable con tipo de URL configurable | `MapBlock`, `site_settings.map_*`, `saveMap`, sección en `MenuManager` | ✅ R3-E |
| 8.16 | Crédito «Generada por vegttech» | `Footer.tsx` (barra inferior) | ✅ R3-E |
| E9.1/E9.5 | Privacidad, consentimiento, sin cookies de terceros | `privacidad`, `BookingFlow`, `TestimonialsManager` | ✅ demo |
| E9.2–E9.4, E9.6 | Cifrado, RLS, respaldos, rate limiting | `audit_logs` ✅ (bitácora); resto — | ⚠️ Fase 4/7 |
| E10.1–E10.4 | Rendimiento, sitemap/robots, SEO local, analítica | `sitemap.ts` (BD) ✅; medición Lighthouse — | ⚠️ Fase 7 |

**Resumen:** 43 historias completas (incl. demo, R3-E) **+ núcleo de agenda real R4-A** (E5.1–E5.4, E5.6–E5.7 y E5.10 parciales); 1 retirada (E1.4/8.05); el resto ⚠️: correo real + cron + E2E (R4-D), usuarios reales (R4-C), pagos (Fase 5), alumnos (Fase 6), cierre (Fase 7).

---

## 6. Contenido de ejemplo y marcadores `TODO:`

- **Semilla en BD:** 6 servicios · 10 recursos · 8 artículos · 4 cursos · 3 testimonios (pendientes, sin consentimiento) · 7 ítems de menú · 7 botones `/links` · 5 enlaces cortos demo · 2 profesionales (aún de `lib/data`, Fase 4) · **11 reglas de horario** (semilla demo `seedRulesIfEmpty`, TODO D8). `appointments` arranca vacía: las citas las crea la gente desde `/agendar`.
- **118 marcadores `TODO:` en 31 archivos de código** (medido 2026-10-23 con `grep -roE 'TODO' app components lib middleware.ts | wc -l`: los 103 de R3 íntegros + 15 nuevos honestos de agenda/correo/zona horaria; de `/mi-cita` solo se reescribieron 2 chips existentes para reflejar el estado real). Grueso por tema: `lib/data.ts` (54: NAP, psicóloga, testimonios, precios, videos, autores) · legales/identidad (`privacidad` 6, `nosotros` 5, home 4) · precios/cupos en fichas (5) · Supabase/Resend/MP (7 + cola R4-A) · dominio real (`layout`/`sitemap`/`robots`/`c/[slug]`, 4) · autores y stats (4) · agenda nueva (`schedule.ts`, `process-notifications.mjs`, cutoff/D4, D-R4-5, ~15) · resto: notas de demo y D2.

**Regla (PROMPT §12.7):** nada se inventa — testimonios, cifras y credenciales reales llegan con las respuestas D1–D8; desde R3-D el panel tampoco puede publicar testimonios sin consentimiento (8.10).

---

## 7. Sistema de diseño

### 7.1 Paleta

Tokens `@theme` (valores DEFAULT, verificados AA): `sage #3f5e52` (+dark/light), `mist #dce7e0` (+deep), `sand #f5efe6`, `terracotta #c97b5a` (+dark), `ink #1f2a27` (+soft). En runtime: (1) `theme_tokens` de la BD se inyecta inline en `<html>` (lo que el admin defina); (2) el **modo oscuro** (8.14) lo sobreescribe con `!important` a una paleta oscura AA (fondo `#131a17`, texto `#e9efea`, verde de botón profundo `#2f4a40`, terracotta CTA `#8a4a2f`) con overrides por rol de utilidad. `color-scheme: dark` activa controles nativos oscuros.

### 7.2 Tipografía, radios y movimiento

Fraunces (display) + Inter (16 px/1.6); `--radius-card 1.25rem`, `--radius-btn 0.75rem`; fuentes curadas en `lib/fonts.ts`. Movimiento y microinteracciones: §4.2 (40 px/650 ms, stagger ≤280 ms, forzado + fallback `has-js`); botones con elevación/`scale(0.98)`, chips con relleno, menú con `menu-rise-in`, acordeones 200 ms.
