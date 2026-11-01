# Raíz Viva — Plataforma web de clínica de bienestar integral

> **Estado (2026-10-23):** R0–R2 certificadas; **Fase 3 (R3) ejecutada** (panel con BD local SQLite, modo oscuro, mapa editable, crédito — el gate sigue pendiente del visto bueno formal del dueño, sin bugs reportados). **Fase 4 (R4) en curso: R4-A EJECUTADO — agenda REAL**: citas persistentes en SQLite con anti-doble-reserva garantizada por la BD, `/mi-cita` por token desde cualquier dispositivo, módulo `/admin/horarios` y cola de correos (entrega Resend pendiente de credenciales). Diferidos: 8.03/8.09; retirado: 8.05 (Apariencia).
> Corriendo en **http://100.69.186.68:3000/** (Tailscale) y `http://localhost:3000/`.

## 1. Qué es

Sitio móvil-primero en español (MX) para una clínica de bienestar: terapia psicológica, masajes, medicina china y nutrición. Catálogos con filtros (zona gratuita, blog, servicios, cursos), reserva en 4 pasos sobre agenda real (BD, con anti-doble-reserva), inscripción por WhatsApp, enlace único `/links` + cortos `/c/<slug>` con QR, aviso LFPDPPP y **panel de autogestión** para una persona no técnica. Datos de ejemplo coherentes marcados `TODO:` (nunca inventados como reales).

## 2. Qué hay funcionando hoy

- **31 rutas** (build limpio) sobre **BD local SQLite** (`data/clinica-bienestar.db`, `node:sqlite`, 15 tablas, seed idempotente desde `lib/data.ts`).
- Público: home, `/gratis`+detalle, `/aprende`+detalle, `/servicios`+detalle (JSON-LD `Service`), `/cursos`+detalle, **`/agendar` (4 pasos, agenda REAL: la cita se registra en la BD con anti-doble-reserva transaccional)**, **`/mi-cita/[token]`** (ver/cancelar/reprogramar desde cualquier dispositivo; cutoff provisional 24 h), `/nosotros`, `/contacto` (mapa desde BD), `/privacidad`, `/links`, `/c/<slug>` (301/404), sitemap/robots desde BD.
- **Modo oscuro** (8.14): toggle en header/panel, persiste, sin flash, AA en ambos modos. **Crédito** «Generada por vegttech» en el pie (8.16).
- **Panel `/admin`** (`noindex`): login demo + recuperación, 3 roles con **RBAC validado en cada server action** y menú filtrado por rol; sesión HMAC (cookie `rv_admin_session`, 12 h). Módulos: **Contenido** (4 colecciones con borrador/programado/publicado, `?preview=1`, reordenar, borrar con "Deshacer"), **Agenda** (`/admin/horarios`: citas próximas con cancelación administrativa + historial; horarios por día/profesional), **Multimedia** (subida con progreso; assets usados hoy en portadas de recursos — decisión B), **Enlaces** (botones `/links` + cortos con QR PNG/SVG), **Testimonios** (aprobar exige consentimiento), **Menú, redes y mapa** (tipos placeholder/embed/iframe/enlace), **Auditoría** (toda mutación queda registrada).
- Accesibilidad AA, animaciones de scroll (forzadas por decisión del dueño), `Cache-Control: no-store` en HTML, OG/Twitter con `og.png`.

## 3. Mapa de documentación (quién manda a quién)

| Doc | Responde a | Vive en |
|---|---|---|
| `PROMPT.md` | Contrato: requisitos y reglas de trabajo | `docs/` |
| `MAPA_IMPACTO.md` | Estrategia: objetivos, actores, epicas E1–E10 | `docs/` |
| `BACKLOG.md` | Backlog maestro: ítems 1.01–10.06, releases R0–R7 | `docs/` |
| **`BACKLOG-R3.md`** | **Estado del release R3** (A–E ejecutados, gate, D9) | `docs/` |
| **`BACKLOG-R4.md`** | **Release en curso (Fase 4, agenda real)**: alcance, D-R4-1…5, sprints R4-A✅/B/C/D, gate propuesto | `docs/` |
| `DEFINITION_OF_DONE.md` | Cierre certificado de R0–R2 (histórico, no tocar) | `docs/` |
| `ESTRUCTURA-DEL-CODIGO.md` | Qué hace cada archivo, arquitectura, RBAC, trazabilidad | `docs/` |
| `ORGANIZACION-DEL-PROYECTO.md` | **Crónica de rondas (0–10)**, fases, decisiones, metodología | `docs/` |
| `INVENTARIO.md` | Máquina (discos, modelos) + §7 resumen del proyecto | `docs/` |
| `README.md` | Este: puerta de entrada | raíz |

## 4. Estado por epica

| Epica | Estado | Pendiente (fase) |
|---|---|---|
| **E1** Fundamentos y diseño | ✅ (Apariencia en panel retirada 2026-10-22; tema público en BD) | Dominio + SSL (Fase 7) |
| **E2** Zona gratuita | ✅ con CRUD (8.07) | Videos propios (D2) |
| **E3** Blog | ✅ con editor por secciones (8.07) | WYSIWYG (8.09, diferido) |
| **E4** Servicios | ✅ con CRUD (8.08) + JSON-LD (4.06) | Precios reales (`TODO:`) |
| **E5** Agenda | ✅ **REAL (R4-A)**: citas en BD, anti-doble-reserva, `/mi-cita` por token, `/admin/horarios` | Correo Resend + calendario admin + excepciones (R4-B/D) |
| **E6** Cursos | ✅ catálogo/ficha/CRUD; inscripción demo | Pagos/cupos/alumnos (Fase 5–6) |
| **E7** Enlace único y difusión | ✅ `/c/` + QR + `/links` editable + OG (7.01–7.04) | Dominio real (`SITE_BASE_URL`) |
| **E8** Panel admin | ✅ R3-A–E + **Agenda R4-A** (8 módulos; 8.05 retirado; 8.03/8.09 diferidos) | Usuarios reales (R4-C) |
| **E9** Datos y privacidad | ✅ aviso, consentimientos, auditoría | RLS/cifrado/respaldos (Fase 4/7) |
| **E10** Rendimiento y SEO | ✅ sitemap BD, OG, JSON-LD | Lighthouse, SEO local, Plausible (Fase 7) |

## 5. Estructura (resumen)

```
clinica-bienestar/
├── app/            34: 15 páginas públicas + 11 admin (incl. horarios) + /c/ +
│                      api/upload + /uploads/[name] (runtime) + layout/css/robots/sitemap
├── components/     38: 22 públicos (incl. ThemeToggle, MapBlock) + 16 admin
├── lib/            20: db.ts + content.ts (+actions) + schedule.ts (+actions) +
│                      themes/media/audit/rbac/slots + data.ts (seed) + admin/
├── scripts/        3: make-og.mjs, process-notifications.mjs, check-double-booking.mjs
├── data/           clinica-bienestar.db (fuera de git; se siembra sola)
├── public/         favicon, images (og.png + SVG), uploads (subidas del panel)
├── middleware.ts   Cache-Control: no-store
└── docs/           9 documentos (ver §3)
```
Inventario archivo a archivo: `docs/ESTRUCTURA-DEL-CODIGO.md` §2.

## 6. Fases y rondas

**Fases:** 0–2 ✅ (certificadas) · 3 🔶 ejecutada R3-A–E (gate pendiente del visto bueno formal, sin bugs reportados) · **4 🔶 R4-A ejecutado (agenda real sobre SQLite)** — siguen R4-B/C/D · 5–7 ⬜ (pagos, alumnos opcional, cierre).
**Rondas de trabajo (0–11):** crónica completa con evidencia en `docs/ORGANIZACION-DEL-PROYECTO.md` §3. Las últimas: **10** — R3-E (modo oscuro, mapa editable, crédito); **11** — **R4-A agenda real**: `appointments` + `availability_rules` + `notifications`, anti-doble-reserva garantizada por índice único, flujo `/agendar` y `/mi-cita` por token sobre BD, módulo `/admin/horarios`, cola de correos (stub hasta Resend).

## 7. Cómo ejecutar

> Node 22 en el PATH (requisito: `node:sqlite` necesita ≥ 22).

```bash
cd /home/aficado/clinica-bienestar
npm run build        # producción (31 rutas)
npm start            # 0.0.0.0:3000 — sirve el ÚLTIMO build
npm run dev          # desarrollo
node scripts/make-og.mjs   # regenera public/images/og.png
npm run check:agenda # prueba anti-doble-reserva 5.04 (debe salir PASS)
npm run notifications # procesa la cola de correos vencidos (stub hasta Resend)
```

- **IMPORTANTE:** los cambios en código NO se ven hasta `npm run build` + reiniciar (matar el `next-server` del `:3000` vía `ss -tlnp` y relanzar; log en `/tmp/opencode/serve.log`).
- **BD:** se crea y siembra sola al primer arranque; `LOCAL_DB_PATH` la sobreescribe. "Reset demo": borrar `data/*.db` y reiniciar (se pierden subidas y ediciones del panel).
- **Credenciales demo** (`demo123`): `admin@raizviva.mx` · `terapista@raizviva.mx` · `asistente@raizviva.mx`.
- **URL pública:** http://100.69.186.68:3000/ (Tailscale).

## 8. Siguientes pasos

1. **Gate de Fase 3** (persona no técnica, <15 min): editar+publicar artículo, subir imagen, enlace corto+QR, `/links`, RBAC, modo oscuro, cambiar el mapa, ver el crédito → visto bueno y cierre de la fase. (R4 no lo bloquea; se puede pasar junto con el gate de R4.)
2. **Gate de R4-A / seguir Fase 4** (`docs/BACKLOG-R4.md` §5): agendar, ver `/mi-cita` en otro dispositivo, reprogramar, prueba de doble reserva. Luego **R4-B** (excepciones por fecha + calendario admin + Ajustes) y **R4-C** (usuarios reales, `/admin/usuarios`, evaluar 2FA).
3. **R4-D** (necesita insumos): Resend + cron, E2E Playwright, pagos según D3.
4. **QA manual + Lighthouse** (a11y/perf ≥ 90) — DoD §4.
5. **Datos reales del cliente** (D1–D8) → reemplazo de los 118 `TODO:` (gran parte en `lib/data.ts`, fuente del seed; lo operativo entra desde el panel).
6. **Fases 5–7**: pagos (Mercado Pago), alumnos (D5), cierre (SEO local, seguridad, dominio, despliegue).
7. Opcional: `git init` (no hay versionado aún), favicon PNG.

## 9. Reglas que no deben revertirse

- **Movimiento:** animación CSS + IO (40 px/650 ms, stagger ≤280 ms, 0 anidamientos, red de seguridad); overlay del menú móvil FUERA del `<header>` (bug F6); `no-store` en HTML (bug F7); animaciones **forzadas** (sin override de `prefers-reduced-motion`, decisión del dueño 2026-10-16); fallback `has-js`.
- **BD local:** filas de `node:sqlite` SIEMPRE a objeto plano antes de llegar a un cliente (crash real: prototipo nulo en Apariencia); escrituras solo por server actions con RBAC + `logAudit`; borrado blando con "Deshacer" (nunca `DELETE` físico desde la UI); slug inmutable tras crear; `seedIfEmpty()` idempotente y `lib/data.ts` es solo el seed; `references` entre comillas (keyword SQL).
- **Subidas en runtime:** `next start` congela `public/` al arrancar → `/uploads/<archivo>` se sirve del disco vía `app/uploads/[name]/route.ts`; no mover sin ajustar subida + ruta + `mediaToView`.
- **Modo oscuro:** gana con `!important` sobre los tokens inline del admin + overrides de utilidades por ROL (`.bg-white/.bg-sage/.bg-terracotta/.text-mist*`); AA debe verificarse en AMBOS modos al tocar la paleta.
- **Datos demo siempre con `TODO:` visible** (PROMPT §12.7): nada inventado; testimonios sin consentimiento no se pueden publicar (8.10).
- **Agenda real (R4-A):** la garantía anti-doble-reserva es el índice único parcial `ux_appt_slot` + `BEGIN IMMEDIATE` en `lib/schedule.ts` — no quitarlos ni cambiar `status` a otro vocabulario sin ajustar el índice; prueba `npm run check:agenda`. Los correos se **encolan** (`notifications`), no se envían aún: la entrega real vive en `scripts/process-notifications.mjs` (TODO Resend). El cutoff de cancelación (24 h provisional, D-R4-3) vive en `site_settings.cancel_cutoff_hours`.
- **Retirados/diferidos por decisión del dueño:** 8.05 Apariencia (2026-10-22; el tema público sigue leyendo `theme_tokens`), Multimedia en modo almacén (opción B), 8.03 2FA y 8.09 WYSIWYG (P1 diferidos).
