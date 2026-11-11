# PLAN R4-B-AUDIT-1 — Ocultar la auditoría del panel y exportarla por día

**Tipo:** Orden del panel + herramienta de desarrollo
**Fecha:** 2026-11-11
**Solicitud del dueño:**
> "genera los pasos para eliminar la auditoría del panel de admin, no eliminarla completamente, sino ocultarla; no necesita el admin verla, solo le sirve al programador; déjala como una opción descargable en .md o .txt por día, se separen los logs de auditoría por día"

**Estado:** ✅ EJECUTADO (2026-11-11) — se eligió **botón de descarga en panel oculto**, no CLI.

## 1. Qué se conserva y qué se oculta

| Pieza | Acción |
|---|---|
| Tabla `audit_logs` y `logAudit()` | **Se conserva tal cual.** Cada acción del panel sigue registrando (162 registros hoy). |
| Ítem "Auditoría" del menú lateral | **Se elimina del menú** (`components/admin/AdminShell.tsx`). |
| Página `/admin/auditoria` | **Se conserva pero queda interna**: sin enlace en el panel; solo accesible por URL y con sesión de administrador. Opcional: si `AUDIT_UI=1` no está definido, redirige a `/admin` (la UI desaparece por completo). |
| Descarga | **Script de desarrollo** `scripts/export-audit.mjs` que exporta **por día** a `.md` y/o `.txt`. |

## 2. Pasos de ejecución

### Paso 1 — Quitar "Auditoría" del menú
En `components/admin/AdminShell.tsx`, borrar la línea del arreglo `NAV`:
```ts
{ id: "auditoria", label: "Auditoría", href: "/admin/auditoria", icon: "shield", roles: ["admin"] },
```
La ruta sigue existiendo (no se borra código ni datos). RBAC intacto (`canAdmin`).

### Paso 2 — Dejar la página como interna (opcional recomendado)
En `app/admin/auditoria/page.tsx`, al inicio del componente:
```ts
if (process.env.AUDIT_UI !== "1") redirect("/admin");
```
Así la UI solo se enciende para el programador con `AUDIT_UI=1 npm run dev`; en producción no es visible ni por URL. Los datos y `logAudit` no se tocan.

### Paso 3 — Script de exportación por día
Nuevo `scripts/export-audit.mjs` (Node 22, `node:sqlite`, sin dependencias):

- Lee `audit_logs` filtrando por **día local del sitio** (`site_settings.time_zone`, default `America/Mexico_City`) sobre `created_at` (epoch ms).
- Uso:
  ```bash
  npm run audit:export -- --date=2026-11-11            # un día → exports/auditoria/2026-11-11.md
  npm run audit:export -- --date=2026-11-11 --format=txt
  npm run audit:export -- --from=2026-11-01 --to=2026-11-11 --format=md
  npm run audit:export -- --all                        # un archivo por cada día con registros
  ```
- Salida por día: `exports/auditoria/YYYY-MM-DD.md` (o `.txt`) con:
  ```md
  # Auditoría — 2026-11-11 (America/Mexico_City)

  | Hora  | Actor | Rol | Acción | Entidad | Detalle |
  |-------|-------|-----|--------|---------|---------|
  | 17:57 | admin@raizviva.mx | Administrador | menu.crear | menu | facebook |
  ```
- Orden cronológico ascendente; sin filas = no genera archivo (o genera "sin registros" en `--all`).
- `--out=DIR` opcional. Crea el directorio si no existe.

### Paso 4 — `package.json`
```json
"audit:export": "node scripts/export-audit.mjs"
```

### Paso 5 — No versionar los exports
Añadir a `.gitignore`:
```
exports/
```
(Los logs no se suben al repo; se generan cuando el programador los pide.)

### Paso 6 — Documentación y verificación
- `docs/ESTRUCTURA-DEL-CODIGO.md`: fila de `scripts/export-audit.mjs` y nota "Auditoría oculta del menú".
- `docs/ORGANIZACION-DEL-PROYECTO.md`: ronda 21 con el cambio.
- Verificación:
  1. El menú lateral ya no muestra "Auditoría"; el resto de ítems sigue.
  2. `/admin/auditoria` con sesión admin: 307 sin sesión; con `AUDIT_UI!=1` → redirige a `/admin`.
  3. `npm run audit:export -- --date=<hoy>` genera el archivo con las filas del día y hora local correcta.
  4. `--all` crea un archivo por día; ninguno se sube a git.
  5. `tsc` + build limpios.

## 3. Alternativa (si prefieres botón en vez de script)
En lugar del script, un **enlace de descarga oculto** en `/admin/auditoria` (`?export=YYYY-MM-DD`): descarga `.md`/`.txt` con la misma lógica. Requiere mantener la página accesible por URL; no aparece en el menú. Es más cómodo para el dueño, menos para el programador.

## 4. Decisión (resuelta)
El dueño eligió **botón de descarga oculto** con selección de **días y horas**, en un panel que no estorbe al admin.

Con la respuesta ejecuto los pasos 1–6 completos (código, verificación, docs, commit y push a `r4-b`).
## 5. Implementado (2026-11-11)

- **Página de auditoría eliminada**: `app/admin/auditoria/page.tsx` borrada (la URL responde 404) y el ítem «Auditoría» fuera del menú lateral.
- **Panel oculto `/admin/registro`**: no aparece en el menú; se llega por un enlace discreto «registro» al pie de la barra lateral (solo rol admin). Formulario con **desde/hasta día**, **desde/hasta hora** (0–23, hora final inclusiva) y formato **.md / .txt**.
- **Descarga** `GET /api/audit/export?from=…&to=…&fromHour=…&toHour=…&format=md|txt`: RBAC admin (403 sin sesión), rango en la **zona horaria del sitio**, archivo `auditoria-<desde>_a_<hasta>_<hh>-<hh>.<ext>` con tabla (fecha/hora, actor, rol, acción, entidad, ID, detalle).
- **Datos intactos**: `audit_logs` y `logAudit()` siguen igual.
- **Verificado**: sin sesión 403; `/admin/auditoria` 404; menú sin auditoría; enlace discreto presente; export del 2026-11-10 = 53 filas; filtro 11–12 h = 35 filas solo de las horas 11 y 12; `tsc`+build limpios.
