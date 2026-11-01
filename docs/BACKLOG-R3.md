# Product Backlog — R3: Panel de administración (Fase 3)

> **Release:** R3 (Fase 3) del `BACKLOG.md`.
> **Insumos:** `MAPA_IMPACTO.md` (epicas E7, E8, E9), `BACKLOG.md` §3 (E8, E7), `PROMPT.md` (regles de negocio y cierre legal, Fase 3).
> **Propósito:** que una **persona no técnica** pueda operar el sitio sin ayuda: autenticación, roles, edición de apariencia/contenido/multimedia, enlaces/DDDR y pulido de UX.
> **Estado (2026-10-23):** **R3 ejecutado en su totalidad** — **R3-A** (2026-10-16: 8.01 auth demo, 8.02 RBAC, 8.04 layout), **R3-B** (8.06 multimedia sobre BD local SQLite; 8.05 apariencia ejecutado y **retirado el 2026-10-22 a petición del dueño** — el sitio público sigue leyendo el tema de `theme_tokens`; Multimedia queda como almacén de assets, "opción B"), **R3-C** (2026-10-22: 8.07, 8.08, 7.01–7.04, 4.06), **R3-D** (2026-10-22: 8.10–8.13) y **R3-E** (2026-10-23: 8.14 modo oscuro, 8.15 mapa editable con tipo de URL configurable, 8.16 crédito «Generada por vegttech»). **Diferidos P1:** 8.03 (2FA) y 8.09 (WYSIWYG), sin bloquear el gate. **Pendiente:** visto bueno del gate (§9) por una persona no técnica. **2026-10-23:** el dueño autorizó pasar al siguiente sprint (R4) sin reportar bugs — el gate queda pendiente de visto bueno formal y puede pasar junto con el de R4-A. Este documento es la lista de trabajo del release.
>
> **💾 Almacenamiento.** El R3 se entrega en **dos etapas**: **(R3-A, demo, 2026-10-16)** almacenamiento experimental (memoria del servidor + `localStorage`), sin base de datos real; **(R3-B en adelante)** `base de datos local` (`Postgres`/`MySQL` propio). Todo lo que este backlog llama "BD", `profiles`, `media_assets`, `audit_logs`, `short_links`, "transaccional" o "service role" se resuelve contra la **base de datos local** (tablas reales, consultas parametrizadas) salvo en R3-A, donde es **lógica de almacenamiento experimental** (validaciones por rol en memoria, simulación de cupo y concurrencia, persistencia en `localStorage`). El **control por rol** (RBAC) se aplica en la capa de datos local y en la lógica del servidor.

---

## 1. Alcance del R3

Según el plan de releases (`BACKLOG.md` §4), el R3 incluye:

```
R3 — Admin → Fases 3: 8.01–8.13, 7.01–7.04, 4.06 (opcional) · **R3-E: 8.14–8.16 (ampliación 2026-10-22)**
```

| Epica | Ítems al R3 | Qué aporta |
|---|---|---|
| **E8** Panel de administración | 8.01–8.13 | Auth, RBAC, layout, apariencia, multimedia, CRUD, auditoría, UX |
| **E7** Enlace único y difusión | 7.01–7.04 | URL corta, QR, `/links`, OG para compartir |
| **E4** Catálogo de servicios | 4.06 (opcional) | Schema `Service` por ficha |
| **E1/E8** Ampliación R3-E (nueva, 2026-10-22) | 8.14–8.16 (nuevos) | Modo oscuro en todo el sitio, mapa editable con tipo de URL configurable, crédito «Generada por vegttech» |

> **Fuera del R3 (siguen en sus releases):** 8.09 (WYSIWYG) y 8.12 (auditoría) son P1 → se pueden posponer a R7 sin bloquear el gate (regla del "escopazo del admin", `BACKLOG.md` §6). Se **incluyen aquí** porque habilitan el gate de Fase 3, pero son la válvula de presión del release.

**Gate de salida (Fase 3):** una persona no técnica (probado con alguien real) edita un artículo, ~~cambia un color del tema~~ (paso **retirado el 2026-10-22**, a petición del dueño, junto con el módulo Apariencia), sube una imagen y publica, **sin ayuda, en menos de 15 minutos**.

---

## 2. Convenciones

**Prioridad**

- **P0 — Must:** sin este ítem el release está comprometido o se viola un requisito regulatorio.
- **P1 — Should:** importante; el release puede salir sin él si hay un trade-off consciente y documentado.
- **P2 — Nice:** diferible; se evalúa por sprint.

**Tamaño (t-shirt / story points)**

| Tamaño | SP | Criterio práctico |
|---|---|---|
| S | 1–2 | < 1 día persona; un archivo o una query |
| M | 3–5 | 1–3 días persona; 1 feature o 3–5 archivos |
| L | 8 | 4–8 días persona; flujo completo o módulo |
| XL | 13+ | > 1 semana persona; **descomponer antes de planificar** |

**Supuesto de capacidad:** equipo de 1–2 personas (full-stack + diseño). La secuencia de dependencias se mantiene; si hay más capacidad, los sprints se comprimen.

**Ítem:** `<Epica>.<n>`, alineado con `MAPA_IMPACTO.md` y `BACKLOG.md`.

---

## 3. Backlog detallado

### E8 — Panel de administración

| ID | Ítem | Prioridad | Tamaño | Dep. | Criterios de aceptación (resumen) |
|---|---|---|---|---|---|
| 8.01 | Auth (almacenamiento experimental): email/password + recuperación | P0 | M | 1.03 | Login con email/password; recuperación (demo); bloqueo temporal tras intentos fallidos. |
| 8.02 | **RBAC:** roles Administrador/Terapeuta/Asistente en el perfil (almacenamiento experimental) + control por rol | P0 | L | 8.01 | Cada rol ve solo los módulos que le competen; control por rol en UI y en el almacenamiento experimental. |
| 8.03 | 2FA opcional (TOTP) por usuario | P1 | M | 8.01 | 2FA activable por usuario; no bloquea el login base. |
| 8.04 | Layout del admin: sidebar, responsive, ayuda contextual por pantalla | P0 | M | 8.01 | Sidebar colapsable, mobile-first, ayuda contextual; navegable por teclado. |
| 8.05 | ~~**Módulo Apariencia:** logo, paleta (tokens), tipografías curadas, imágenes del hero → aplica tokens en vivo~~ | P0 | L | 8.04, 1.04 | ❌ **RETIRADO (2026-10-22, a petición del dueño)** — se eliminó el módulo del panel; el sitio público sigue leyendo el tema guardado en la BD (`theme_tokens`) |
| 8.06 | **Multimedia:** subir/reemplazar/eliminar con barra de progreso; enlazar YouTube/Vimeo; gestión de medios (base de datos local) | P0 | L | 8.04, 2.01 | Drag & drop; progreso de carga; reemplazo sin romper referencias; confirmación antes de eliminar. |
| 8.07 | CRUD de artículos y recursos: borrador, programación de publicación, vista previa | P0 | M | 8.04, 3.01, 2.01 | Estados borrador/programado/publicado; programar fechas; preview idéntico a la publicación. |
| 8.08 | CRUD de servicios y cursos: campos específicos, drag-and-drop de orden, visible/oculto | P0 | M | 8.04, 4.01 | CRUD con campos por entidad; reorden drag & drop; estado visible/oculto; preview. |
| 8.09 | Editor WYSIWYG para páginas y secciones + activar/desactivar bloques | P1 | L | 8.04 | Editor visual; secciones con toggle visible/oculto; guardado sin pérdida de trabajo. |
| 8.10 | Testimonios: cola de aprobación (solo se publica aprobado; consentimiento registrado) | P1 | S | 8.04 | Cola de aprobación; publicación solo tras aprobación; consentimiento registrado. |
| 8.11 | Enlaces: menú de navegación, botones, redes sociales, enlaces cortos (con 7.01/7.02) | P1 | M | 8.04, 7.01 | Menú editable con drag & drop; campos de redes; gestión de enlaces cortos. |
| 8.12 | **Bitácora de auditoría** (base de datos local): quién cambió qué y cuándo | P1 | M | 8.02 | Bitácora con actor, acción y timestamp en la base de datos local; consultable en el panel. |
| 8.13 | UX de errores: confirmación antes de borrar, deshacer de última acción, mensajes claros | P0 | M | 8.04 | Confirmación antes de borrar; deshacer de última acción cuando sea posible; errores en lenguaje claro. |

### E7 — Enlace único y difusión (parte del R3)

| ID | Ítem | Prioridad | Tamaño | Dep. | Criterios de aceptación (resumen) |
|---|---|---|---|---|---|
| 7.01 | **URL corta** personalizable `/c/<slug>` con redirect configurable desde el admin | P0 | M | 1.03, 8.04 | `/c/<nombre>` redirigible; reasignar el destino del enlace desde el panel. |
| 7.02 | **Generador de QR** (PNG y SVG) desde el panel, descargables | P0 | S | 7.01 | QR generado desde el admin; descargas PNG/SVG. |
| 7.03 | **Página `/links`** tipo "link in bio": botones grandes a cada área, orden y textos editables desde el admin | P0 | M | 7.01, 8.04 | `/links` optimizado para móvil; botones configurables; orden editable. |
| 7.04 | **Open Graph** completo en todas las páginas públicas (título, descripción, imagen, URL) | P1 | S | 1.05 | OG completo en todas las páginas públicas; vista previa profesional al compartir. |

### E4 — Catálogo de servicios (opcional al R3)

| ID | Ítem | Prioridad | Tamaño | Dep. | Criterios de aceptación (resumen) |
|---|---|---|---|---|---|
| 4.06 | Schema `Service` por ficha | P2 | S | 4.03 | Datos estructurados `Service` en cada ficha de servicio. |

### R3-E — Ampliación (nuevos ítems, petición del dueño el 2026-10-22)

> La Fase 3 **no se cierra sin estos tres ítems** ("tenemos que arreglar primero la fase 3").

| ID | Ítem | Prioridad | Tamaño | Dep. | Criterios de aceptación |
|---|---|---|---|---|---|
| 8.14 | **Botón de modo oscuro** (toggle sol/luna) | P0 | M | 8.04, tokens (`theme_tokens`) | (a) El botón aparece en el header (desktop y menú móvil) y en el panel, y funciona en **todas las páginas**. (b) Primera visita: respeta `prefers-color-scheme` del sistema; la elección del usuario se persiste (`localStorage`) y se aplica **antes del paint** (script inline, sin flash de fondo claro). (c) Paleta oscura derivada de los tokens en `globals.css` (variante `dark`), **manteniendo contraste AA en ambos modos** (textos, chips, hero, FAQ, formularios). (d) El tema claro actual no cambia; animaciones y `has-js` intactos. |
| 8.15 | **Mapa editable con tipo de URL configurable** | P0 | M | 8.11 (`site_settings`) | (a) Nueva sección "Mapa" en el panel (propuesta: `/admin/menu`) con **tipo de fuente** — (i) *embed de Google Maps* generado desde una consulta (dirección o nombre del lugar), (ii) *iframe genérico* (URL de embed de cualquier proveedor), (iii) *solo enlace* "Cómo llegar" (sin iframe) — y el **campo de URL/consulta**. (b) Inicio y `/contacto` leen el mapa de la BD; si está vacío, mantienen el placeholder actual con su nota `TODO:`. (c) Como la dirección/domain reales aún no están definidos (D1–D8), el panel debe poder cambiar tipo y URL **sin tocar código**. (d) Solo admin, con registro en auditoría; iframe con `title` accesible. |
| 8.16 | **Crédito «Generada por vegttech»** | P0 | S | — | (a) Línea visible en la barra inferior del pie de **todas las páginas públicas**: «Generada por vegttech». (b) Si el dueño aporta URL, es enlace (`target=_blank`, `rel=noopener`); si no, texto plano. (c) Discreta (no más prominente que el NAP), contraste AA y legible también en modo oscuro (8.14). |

---

## 4. Dependencias y secuencia dentro del R3

**Regla general de orden (ver `BACKLOG.md` §7.2):** infraestructura/esquema → lectura → escrituras → integraciones → polimento.

1. **Auth y gobernanza primero** (8.01, 8.02): sin login y el control por rol en la base de datos local no hay panel que valga.
2. **Layout base** (8.04): el esqueleto por donde se apoya todo lo demás.
3. **Apariencia y multimedia** (8.05, 8.06): el "wow" del no-técnico (color + imagen).
4. **CRUD de contenido** (8.07, 8.08): el núcleo de autogestión.
5. **Difusión** (7.01, 7.02, 7.03, 7.04): enlace único, QR, `/links`, OG.
6. **Pulido y gobierno** (8.13, 8.10, 8.11, 8.12, 8.09): UX, aprobaciones, menú, auditoría, WYSIWYG.
7. **Ampliación R3-E** (8.14, 8.15, 8.16): modo oscuro, mapa editable con tipo de URL configurable y crédito del sitio — añadidos por el dueño el 2026-10-22; **bloquean el cierre de la Fase 3**.

> **Nota transversal (E9):** el **control por rol** (RBAC) se aplica al construir el R3 contra la **base de datos local**; es **dependencia directa de 8.02**. No se acumula al final.

---

## 5. Desglose por sprints

El R3 tiene **~27 puntos P0/P1** (supuesto de equipo 1–2 personas → **2–3 sprints** de ~1 semana).

### Sprint R3-A — Auth, gobernanza y layout (base)

| Ítem | Prioridad | Tamaño | Dep. | Estado |
|---|---|---|---|---|
| 8.01 Auth (experimental) | P0 | M | 1.03 | ✅ demo (2026-10-16): login + recuperación |
| 8.03 2FA opcional (TOTP) | P1 | M | 8.01 | ⚠️ pendiente (P1, diferible; decisión D6) |
| 8.02 **RBAC** + control por rol (experimental) | P0 | L | 8.01 | ✅ demo (2026-10-16): 3 roles + control en UI y acciones |
| Control por rol (transversal) | P0 | L | 8.02 | ✅ demo (2026-10-16): validación por rol en server actions |
| 8.04 Layout del admin | P0 | M | 8.01 | ✅ demo (2026-10-16): `AdminShell` + dashboard |

**Entrega:** alguien entra al panel autenticado, ve solo lo de su rol y navega el layout. **Estado (2026-10-16):** R3-A ejecutado — todo entregado como demo (almacenamiento experimental, sin BD real) salvo 8.03 (2FA), que queda diferido; verificable en el sitio (`/admin`, credenciales de demo).

### Sprint R3-B — Apariencia y multimedia (el "no-técnico" empieza a jugar)

| Ítem | Prioridad | Tamaño | Dep. | Estado |
|---|---|---|---|---|
| 8.05 **Módulo Apariencia** | P0 | L | 8.04, 1.04 | ❌ **retirado (2026-10-22, a petición del dueño)** — se ejecutó en R3-B (tema en BD local, colores al vuelo, hero con medio) y luego se eliminó del panel; el tema público sigue leyendo `theme_tokens` |
| 8.06 **Multimedia** | P0 | L | 8.04, 2.01 | ✅ ejecutado: subida con progreso, videos enlazados, referencias. *(2026-10-22: tras retirarse 8.05, queda como almacén de assets — portadas de recursos sí; hero sin UI de asignación y videos sin consumo, decisión del dueño "opción B", uso justo diferido)* |

**Entrega:** ~~se cambia la paleta en vivo~~ (el módulo **Apariencia se retiró el 2026-10-22, a petición del dueño**; el sitio público sigue leyendo el tema de la BD) y se sube/reemplaza una imagen sin tocar código. **Estado:** R3-B ejecutado — base de datos local (`node:sqlite`, `lib/db.ts` + `lib/media.ts` + `lib/themes.ts`); ~~verificable en `/admin/apariencia`~~ (retirado 2026-10-22) y `/admin/multimedia`.

### Sprint R3-C — CRUD de contenido y difusión (autogestión real)

| Ítem | Prioridad | Tamaño | Dep. | Estado |
|---|---|---|---|---|
| 8.07 CRUD de artículos y recursos | P0 | M | 8.04, 3.01, 2.01 | ✅ ejecutado (2026-10-22): `/admin/contenido` (borrador/programado/publicado + `?preview=1`) |
| 8.08 CRUD de servicios y cursos | P0 | M | 8.04, 4.01 | ✅ ejecutado (2026-10-22): mismo hub; orden con ↑/↓; visible/oculto |
| 7.01 URL corta `/c/<slug>` | P0 | M | 1.03, 8.04 | ✅ ejecutado (2026-10-22): redirect 301 + reasignación desde `/admin/enlaces` |
| 7.02 Generador de QR | P0 | S | 7.01 | ✅ ejecutado (2026-10-22): QR por enlace corto en `/admin/enlaces` (PNG/SVG descargables) |
| 7.03 `/links` tipo link-in-bio | P0 | M | 7.01, 8.04 | ✅ ejecutado (2026-10-22): botones desde `link_items`, orden editable |
| 7.04 Open Graph completo | P1 | S | 1.05 | ✅ ejecutado (2026-10-22): OG + Twitter card + `public/images/og.png` (1200×630) |
| 4.06 Schema `Service` (opc.) | P2 | S | 4.03 | ✅ ejecutado (2026-10-22): JSON-LD `Service` en cada ficha |

**Entrega:** se crean/editan artículos, servicios y cursos; se genera un enlace corto + QR y la vista previa al compartir se ve profesional. **Estado (2026-10-22):** R3-C ejecutado — todo el contenido público se sirve de la BD local; RBAC: crear/editar/estados = admin + terapeuta; borrar/restaurar y enlaces = solo admin. Nota: el "drag-and-drop" de 8.08/8.11 se implementó con botones ↑/↓ (más simple y accesible; teclado-independiente).

### Sprint R3-D — Pulido, UX y gobierno (cierre del release)

| Ítem | Prioridad | Tamaño | Dep. | Estado |
|---|---|---|---|---|
| 8.13 UX de errores (confirmar borrar, deshacer) | P0 | M | 8.04 | ✅ ejecutado (2026-10-22): confirmación + borrado blando + "Deshacer" (contenido y multimedia), mensajes claros |
| 8.10 Testimonios (cola de aprobación) | P1 | S | 8.04 | ✅ ejecutado (2026-10-22): `/admin/testimonios`; publicar exige consentimiento + aprobación |
| 8.11 Enlaces (menú, botones, redes) | P1 | M | 8.04, 7.01 | ✅ ejecutado (2026-10-22): `/admin/menu` (nav + redes) y `/admin/enlaces` (botones + cortos) |
| 8.12 Bitácora de auditoría | P1 | M | 8.02 | ✅ ejecutado (2026-10-22): `audit_logs` + `/admin/auditoria` con filtros; toda acción mutante registra |
| 8.09 Editor WYSIWYG | P1 | L | 8.04 | ⚠️ diferido (válvula de presión; no bloquea el gate) — el editor de secciones usa texto con «# » y párrafos |

**Entrega:** flujo pulido (deshacer/confirmar), aprobaciones de testimonios, gestión de menú/redes, auditoría y (si aplica) WYSIWYG. **Estado (2026-10-22):** R3-D ejecutado salvo 8.09 (WYSIWYG), diferido como primera válvula de presión del release.

> **Válvula de presión:** si el plazo aprieta, se recorta en este orden: 8.09 (WYSIWYG) → 8.12 (auditoría) → 8.10 (testimonios) → 7.04 (OG). Ninguno bloquea el gate de Fase 3 salvo 8.13.

### Sprint R3-E — Ampliación: modo oscuro, mapa editable y crédito (nueva, 2026-10-22)

| Ítem | Prioridad | Tamaño | Dep. |
|---|---|---|---|
| 8.14 Modo oscuro (toggle en todas las páginas, persistencia, AA) | P0 | M | 8.04 |
| 8.15 Mapa editable con tipo de URL configurable | P0 | M | 8.11 |
| 8.16 Crédito «Generada por vegttech» en el pie | P0 | S | — |

**Entrega:** la persona que prueba el gate activa el modo oscuro y comprueba que funciona en todo el sitio; cambia el mapa (tipo + URL) desde el panel sin tocar código; y el pie muestra el crédito. **Estado (2026-10-22):** ✅ R3-E ejecutado — 8.14: `ThemeToggle` (sol/luna) en header, menú móvil y `AdminShell`; script inline anti-flash en `layout.tsx` (`localStorage.rv_theme` → `prefers-color-scheme`); paleta oscura en `globals.css` con overrides AA (15.2:1 texto sobre fondo; 9.7:1 blanco sobre verde). 8.15: columnas `map_type/map_query/map_url` en `site_settings` (migración ALTER), `saveMapSettings` + action `saveMap` (admin, audit «sitio.mapa»), `MapBlock` en home y `/contacto` (ahora dinámica), sección «Mapa» en `/admin/menu` con los 4 tipos. 8.16: «Generada por vegttech» en la barra inferior del pie de todas las páginas públicas. Verificado: `tsc` + build 30 rutas; crédito/toggle/script/paleta presentes en el HTML/CSS servidos; migración aplicada; placeholder del mapa intacto con la consulta del seed.

---

## 6. Decisiones abiertas que afectan al R3

| # | Decisión | Opciones | Impacto | Cuándo decidir |
|---|---|---|---|---|
| D1 | ¿Admin mínimo en la Fase 2? | (a) contenido por seed → admin completo en R3 (recomendado); (b) adelantar auth + 3 CRUDs a R2 | (b) retrasa el contenido público ~1–2 semanas | Antes de R2 (ya resuelta: (a)) |
| D5 | ¿Incluir WYSIWYG en R3? | Sí (8.09) / Postergar a R7 | 8.09 es L y P1; no bloquea el gate | Al planificar R3-D |
| D6 | 2FA desde el inicio? | Sí (8.03) / Solo en R7 | 8.03 es P1 y M; habilita cumplimiento | Antes de R3-A |
| D9 (R3-E) | ¿Qué URL usa el mapa y de qué tipo? | (i) embed de Google Maps por consulta (dirección o nombre del lugar), (ii) iframe genérico de cualquier proveedor, (iii) solo enlace "Cómo llegar" sin iframe | La dirección/domain reales aún no están definidos (D1–D8): 8.15 debe soportar los tres tipos y permitir cambiarlos desde el panel sin tocar código; el tipo por defecto propuesto es (i) con una consulta provisional | Durante R3-E (el panel lo hace cambiable en cualquier momento) |

---

## 7. Riesgos del R3 y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Admin que nadie puede usar** | Media | Alto (objeto de negocio #5) | Gate de Fase 3 con usuario real no técnico; principios de UX (8.13) desde el layout, no al final |
| **Escopazo del admin** (8.09, 8.12) | Alta | Medio | Son P1: se posponen a R7 sin bloquear el gate de R3 |
| **Control por rol roto** | Media | Alto (legal) | Acceso cruzado por rol probado antes de cerrar R3-A |
| **Tokens cambiados tarde rompen la UI** | Media | Bajo-Medio | 1.04 + 8.05: tokens desde el día 1; toda la UI consume variables, nada de hardcode |
| **Testimonios sin consentimiento** | Media | Alto (legal) | 8.10: solo se publica aprobado con consentimiento registrado |

---

## 8. Carga estimada del R3 (solo P0, equipo 1–2 personas)

| Sprint | Ítems P0 | Puntos P0 (aprox.) | Duración estimada |
|---|---|---|---|
| R3-A (Auth + gobernanza + layout) ✅ (2026-10-16, sin 8.03) | 8.01, 8.02, 8.04 | ~13 | ~1 semana |
| R3-B (Apariencia + multimedia) | 8.05, 8.06 | ~16 | ~1.5 semanas |
| R3-C (CRUD + difusión) | 8.07, 8.08, 7.01, 7.02, 7.03 | ~18 | ~2 semanas |
| R3-D (Pulido/UX, P0 solo 8.13) | 8.13 | ~5 | ~1 semana |
| R3-E (Ampliación 2026-10-22: modo oscuro, mapa, crédito) ✅ (2026-10-22) | 8.14, 8.15, 8.16 | ~8 | ~1–1.5 semanas |
| **Total R3** | — | **~60 P0** | **~6–7 semanas** |

> El R3 es amplio porque concentra la autogestión. Si el plazo aprieta, se entrega en dos fases parciales: **(i)** R3-core (R3-A + R3-B + 8.07) para cumplir el gate de "editar artículo + color + imagen en <15 min", y **(ii)** R3-completo (R3-C + R3-D) después.

---

## 9. Gate de aceptación (Fase 3)

El R3 está listo cuando, probado con una **persona no técnica**:

1. Inicia sesión y entra al panel sin ayuda.
2. Edita un artículo (título/cuerpo), la pone en borrador y la publica.
3. ~~Cambia un color del tema y ve el cambio aplicado en vivo.~~ (Paso **retirado el 2026-10-22**, a petición del dueño, junto con el módulo Apariencia; el sitio público sigue leyendo el tema de la BD.)
4. Sube/reemplaza una imagen con barra de progreso.
5. Genera un enlace corto + QR y una página `/links`.
6. Lo hace **todo sin ayuda, en menos de 15 minutos**.
7. Cada rol ve solo lo que le corresponde (control por rol / RBAC probado en la base de datos local).
8. Activa y desactiva el **modo oscuro** y comprueba que funciona en **todas las páginas** (públicas y panel), que persiste al recargar y que el texto sigue siendo legible (AA) en ambos modos (8.14).
9. Cambia el **mapa** desde el panel — eligiendo tipo de URL (embed de Google Maps / iframe genérico / solo enlace) y la URL o consulta — y lo ve reflejado en Inicio y Contacto sin tocar código (8.15).
10. Comprueba que el pie muestra el crédito **«Generada por vegttech»** en todas las páginas públicas (8.16).

> Los pasos 8–10 (R3-E) cuentan para el "menos de 15 minutos" del paso 6: la persona de prueba los hace en la misma sesión.
