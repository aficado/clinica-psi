# PLAN R4-B-ADMIN-1 — Auditoría y limpieza del panel

**Tipo:** SPRINT DE ORDEN (auditoría de todo el panel: qué se queda, qué se corrige, qué se oculta)
**Fecha:** 2026-11-08
**Solicitud del dueño (literal):**
> "explícame primero que nada qué se supone que haga con este menú de navegación… verifica y genera un sprint donde corregirás todo el panel de administrador, dejando únicamente lo que es funcional y lo que sí aporta valor, evalúa todos los menús"

**Estado:** 🔶 PLAN — esperando 3 decisiones del dueño (§4) para ejecutar.

## 1. Qué hace hoy el panel "Menú y redes" (verificado en vivo)

**Sí se puede mover.** Es intencional: el sitio lee la navegación de la tabla `nav_items`, no del código. Lo comprobé en vivo (2026-11-08):

```
BD antes:        Inicio(0) | Gratis(1) | Aprende(2) | Servicios(3) | Cursos(4) | Nosotros(5) | Contacto(6)
Clic "Subir Gratis" → BD: Gratis(0) | Inicio(1) | …
Header de "/":   ["Gratis","Inicio","Aprende","Servicios","Cursos","Nosotros","Contacto"]   ← cambia al instante
Restaurado:      Inicio(0) | Gratis(1) | …
```

El módulo hace 3 cosas y está bien protegido:
- **Menú**: crear/editar/borrar (borrado blando con **Deshacer**) y **reordenar** con flechas; `visible` on/off. Valida etiqueta obligatoria y enlace interno (`/…`) o `http(s)`.
- **Redes**: Instagram y Facebook del sitio (pie de página / contacto).
- **Mapa**: tipo de URL (`query` de Google Maps o embed) — se usa en la portada y en `/contacto`.

Lo que **no** puede hacer: romper el sitio (solo cambia orden/etiqueta/visibilidad), pero **sí** puede dejar un enlace a una ruta inexistente (404) porque valida el formato, no que la ruta exista.

## 2. Auditoría de los 12 módulos (verificado 2026-11-08)

| Módulo | Estado real | Valor | Acción propuesta |
|---|---|---|---|
| **Inicio** (dashboard) | Funciona, pero 2 de 3 tarjetas dicen literal **"Fase 3"** (dato de relleno, `TODO` en el código) | Medio | **PA-2**: estadísticas reales (citas próximas, contenido publicado, enlaces, bloqueos) |
| **Contenido** (4 pestañas) | Funciona: artículos, recursos, cursos y servicios con estados, preview, reordenar y deshacer | Alto | Mantener |
| **Agenda** (horarios) | Funciona: citas, horarios y calendario anual con bloqueo por clic | Alto | Mantener |
| **Servicios** | **Solo lectura**: vista de lo que consume la agenda + enlaces a Contenido. No edita ahí | Medio (confunde) | **PA-3**: dejarlo claro en la pantalla o fusionarlo con Agenda |
| **Profesionales** | Funciona: CRUD, activo/inactivo, reglas por día | Alto | Mantener |
| **Multimedia** | Funciona: subir imagen (con progreso), enlazar video, eliminar/restaurar | Medio | Mantener (falta probar subida en la suite) |
| **Enlaces** | Funciona: botones de `/links`, cortos `/c/<slug>` (probado: 301) + QR; valida slug y destino | Alto | Mantener |
| **Testimonios** | Funciona: CRUD con consentimiento; portada lee de BD | Medio | Mantener |
| **Menú y redes** | Funciona (ver §1) | Alto | **PA-4**: avisar si la ruta interna no existe; separar visualmente Menú / Redes / Mapa |
| **Auditoría** | Funciona (109 registros); lista plana, sin filtros | Bajo | **PA-5**: filtro por módulo/acción y paginación |
| **Usuarios y roles** | **No existe**: aparece "Próximamente" (deshabilitado; la página no está) | Nulo hoy | **PA-6**: ocultarlo hasta R4-C, o dejarlo con etiqueta "R4-C" |
| **Ajustes** | Funciona: cutoff, ventana de reserva y zona horaria | Alto | Mantener |

**Menú lateral (12 ítems)**: el orden actual pone Contenido antes que Agenda. Ningún otro elemento es huérfano ni apunta a 404 (salvo Usuarios, que está deshabilitado).

## 3. Product backlog del sprint

| ID | Historia | Criterios de aceptación | Estado |
|---|---|---|---|
| **PA-1** | *Como admin, quiero que el menú lateral esté ordenado por uso real y sin promesas vacías.* | Orden: Inicio · **Agenda** · Contenido · Profesionales · Servicios · Testimonios · Multimedia · Enlaces · Menú y redes · Ajustes · Auditoría. Sin ítems "Próximamente". RBAC por rol intacto. | ⬜ |
| **PA-2** | *Como admin, quiero que el Inicio muestre datos reales, no "Fase 3".* | Tarjetas: citas próximas (hoy/semana), contenido publicado (artículos+recursos+cursos+servicios), enlaces activos (botones+cortos) y bloqueos vigentes; accesos directos a Agenda y Ajustes. Cero textos de relleno. | ⬜ |
| **PA-3** | *Como admin, quiero entender qué es "Servicios" y no perder tiempo buscando dónde se edita.* | Encabezado explícito "Vista de la agenda: la edición está en Contenido"; botón "Editar en Contenido" por fila; sin acciones falsas. | ⬜ |
| **PA-4** | *Como admin, quiero que el editor de menú no me deje publicar un enlace roto.* | Al guardar un enlace interno, se valida contra las rutas reales del sitio (lista estática de rutas públicas + aviso "esa ruta no existe, ¿seguro?"), destino externo exige `http(s)`; el resto (mover, ocultar, borrar+deshacer) sigue igual. | ⬜ |
| **PA-5** | *Como admin, quiero encontrar rápido en Auditoría.* | Filtros por módulo y acción + paginación (50); contador de resultados. | ⬜ |
| **PA-6** | *Como dueño, no quiero ver módulos que no existen.* | "Usuarios y roles" fuera del menú hasta R4-C (la ruta no se publica); se reactiva en R4-C. | ⬜ |
| **PA-7** | *QA del panel completo.* | Suite `flow-verify-admin1.mjs`: login, los 11 módulos abren 200 con sesión y 307 sin ella, reordenar menú y ver el cambio en `/`, guardar redes/mapa, slot de auditoría, crear/editar un testimonio de prueba y borrarlo, **subida real de una imagen** y borrado, dashboard con cifras reales (no "Fase 3"), sin "Próximamente". `tsc`+build+`check:agenda` + suites de agenda en verde. Docs + commit + push `r4-b`. | ⬜ |

**Decisiones del dueño (bloquean PA-1/PA-3/PA-4):**
1. ¿El menú del sitio debe seguir siendo **editable y reordenable** por ti (hoy funciona), o lo congelamos y dejas solo los textos?
2. "Servicios": ¿lo dejamos como **vista de solo lectura** con enlace a Contenido, o lo quitamos del menú?
3. "Usuarios y roles": ¿lo **ocultamos** hasta R4-C o lo dejamos visible con la etiqueta "en R4-C"?

## 4. Lo que NO se toca
Motor de agenda, bloqueo de días, flujo público, RBAC y auditoría de datos. Este sprint es de panel: orden, textos reales y rutas inexistentes.
## 5. Ejecutado antes del sprint (2026-11-10)

**R4-B-ADMIN-2 — `/links` sin material de administración (a petición del dueño).**
- `app/links/page.tsx` y `LinksClient.tsx`: se retiró la sección "Tu enlace único" (URL, "Copiar enlace" y **QR**) de la página pública;
  `/links` queda solo con los botones de `link_items`.
- El QR del enlace único ahora se genera en **`/admin/enlaces`** (botón "QR del enlace único (/links)" + el QR por corto `/c/<slug>`).
- Metadatos de la página sin la mención al QR. Verificado: `/links` 200 sin rastro de QR/URL; botones intactos.

**R4-B-ADMIN-3 — Los QR apuntaban a un dominio inexistente (2026-11-10).**
- Causa: `siteUrl()` devolvía `SITE_BASE_URL` o el ejemplo `https://www.raizviva.mx`; ese dominio no resuelve en la demo, así que **todos** los QR (y la URL mostrada) morían.
- Fix: `/admin/enlaces` calcula la base con `SITE_BASE_URL` si existe (dominio público en producción) y, si no, con el **host real de la petición** (`x-forwarded-host`/`host` + proto). Verificado abriendo el panel por LAN: QR de `/links` → `http://192.168.1.8:3000/links` y cortos → `http://192.168.1.8:3000/c/<slug>`; `/c/ornith` → 301 al destino.
- `QrWidget`: título genérico "Tu enlace" y se quitó la nota obsoleta de "en producción se personaliza…".
- Nota de diseño: el QR apunta al **corto**, que redirige al destino; así el material impreso no se rehace si cambia la URL final. Si se prefiere QR directo al destino, es un cambio de una línea.

**R4-B-ADMIN-4 — El QR de un corto apunta directo al destino (2026-11-10, criterio del dueño).**
- Antes: el QR codificaba `${siteBase}/c/<slug>` (el corto), así que al escanearlo fuera de la LAN no abría.
- Ahora: el QR codifica **la URL de destino** que escribiste. Si el destino es externo (`http(s)`) va tal cual (p. ej. `https://huggingface.co/…`); si es interno (`/agendar`) se completa con la base del sitio.
- El enlace corto `/c/<slug>` sigue existiendo para texto/redes, pero el QR ya no depende de él. Verificado en el panel: QR de `ornith` → `https://huggingface.co/ornith-ai/Ornith-1.5-35B-A3B-GGUF/tree/main`; QR de `agendar` → `http://<host>/agendar`.

**R4-B-ADMIN-5 — Refactor de enlaces cortos: nombre visible y URL completa (2026-11-10).**
- **Por qué "no aparecían"**: el formulario rechazaba destinos sin esquema (`100.69.186.68:3000/cursos`) y rutas sueltas, así que el alta fallaba sin crear fila.
- **Validación nueva** (`saveShortLink`): el destino es siempre una **URL completa**. Con esquema se usa tal cual; sin esquema pero con host (`100.69.186.68:3000/cursos`) se normaliza a `http://…`; una ruta suelta (`/cursos`) se rechaza con mensaje claro (el QR no sabría en qué sitio abrir). El **nombre es obligatorio**.
- **Lista**: el título de cada fila es el **nombre**; debajo, el destino completo y, en pequeño, `/c/<slug>`.
- **Orden**: los cortos más recientes aparecen primero (`ORDER BY rowid DESC`).
- **QR**: codifica el destino exacto (sin prefijos ni `/c/`).
- **`/c/<slug>`**: los destinos antiguos internos ahora se completan con el **origen real** de la petición (antes usaban `siteUrl()` y morían en la LAN).
- Verificado: alta `100.69.186.68:3000/cursos` → guardado como `http://100.69.186.68:3000/cursos`, nombre en la lista y QR con esa URL; `/cursos` → rechazado con el mensaje; `/c/ornith` sigue 301 a su destino.

**R4-B-ADMIN-6 — El elemento del menú "desaparecía" según la página (2026-11-10).**
- Diagnóstico: el elemento **nunca se borró** (seguía en `nav_items`, visible y renderizado). El problema era la **caché por ruta**: las acciones de menú llamaban `revalidatePath("/")`, que solo invalidaba la portada; las demás rutas estáticas (`/aprende`, `/cursos`, `/links`, `/contacto`…) seguían sirviendo el layout viejo. Por eso se veía en una página y "desaparecía" al navegar.
- Fix: `invalidateLayout()` = `revalidatePath("/", "layout")` en `saveNavItem`, `deleteNavItem`, `restoreNavItem`, `moveNavItem` y `saveSocials` (el layout raíz se purga en **todas** las rutas).
- UX: al guardar, banner de confirmación («Guardado «X». Ya se ve en el menú del sitio, en todas las páginas»), fila resaltada y autocierre a los 8 s.
- Verificado sin rebuild: mover «facebook» arriba se refleja al instante en `/aprende` y `/cursos`; crear «Zz Prueba» aparece en `/` al momento y el banner sale; borrarlo lo quita de todas las rutas.
