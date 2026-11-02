# PLAN DE ACCIÓN — Sprint R4-B-2: Profesional(es) configurables + cambios de agenda en el panel

> **Release intermedio:** R4-B (agenda completa). **Objetivo del sprint:** los profesionales ya no viven fijos en `lib/data.ts`; se crean, editan, activan/desactivan y se les toma la baja lógica desde `/admin/profesionales`. Los servicios ya eran editables desde Contenido (R3-C) y ganan su propia entrada de panel.
> **Estado:** 2026-11-02 — **EJECUTADO** (acciones 1–6 ejecutadas; ver "Ejecutado" al final). `tsc` + build limpios (33 rutas), RBAC verificado, `check:agenda` PASS.
> **Largo:** 1–2 días. **Gate (R4-B-2):** desde el panel se crea/edita/desactiva un profesional y la agenda (`/agendar` y `/admin/horarios`) lo refleja; los servicios de agenda se administran desde `/admin/servicios`.

---

## Decisión de diseño (D-R4-B-2, ajustada 2026-11-02)

- **NO se crea una tabla `service_catalog` nueva.** La tabla `services` de R3-C ya existe, ya es la única fuente, y su editor en `/admin/contenido` ya edita los campos que la agenda consume (duración, buffer, modalidades `presencial`/`enlinea` activables, visible). Duplicarla rompería la regla "cada dato de contenido documental vive en un solo sitio". `/admin/servicios` será una **vista dedicada de agenda** con enlaces profundos (`/admin/contenido?tab=servicios&edit=<slug>`), sobre las MISMAS server actions (`saveService`, `deleteService`, `reorderServices`). El acceso ya validado con RBAC (`canManageContent` = admin+terapeuta).
- **Sí se crea la tabla `professionals`** (identidad del profesional). El horario operativo REAL sigue siendo `availability_rules` (motor de R4-A); las columnas de días/horario del profesional son su "perfil" que el panel replica en reglas al guardar (coherencia garantizada en la escritura, no a posteriori).
- **Consumo:** se crea `lib/professionals.ts` que mapea la BD al MISMO tipo `Professional` de `lib/data.ts` (días/horarios derivados de sus columnas), así todos los consumidores (`/agendar`, `/admin/horarios`, `/servicios/[slug]`, `/nosotros`, `lib/schedule*`) se cambian de `import { professionals }` a `getProfessionals()` sin cambiar firmas.
- `lib/data.ts` queda como **semilla demo** (TODO D8: profesionales reales del dueño) — la BD se siembra idempotentemente desde ahí si está vacía.

## Acción 1 — `lib/db.ts`: tabla `professionals`

```sql
CREATE TABLE IF NOT EXISTS professionals (
  id           TEXT PRIMARY KEY,          -- 'dra', 'lic', nuevo
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT '',
  services_json TEXT NOT NULL DEFAULT '[]',  -- array de slugs de servicio
  days_json    TEXT NOT NULL DEFAULT '[]',   -- array de 1=lunes … 6=sábado
  open_hour    INTEGER NOT NULL DEFAULT 9,
  close_hour   INTEGER NOT NULL DEFAULT 17,
  sat_open     INTEGER,                      -- solo si atiende el sábado (6)
  sat_close    INTEGER,
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER
);
```

Borrado blando (`deleted_at`) + desactivación (`active`), como el resto de las tablas.

## Acción 2 — `lib/professionals.ts`: capa de lectura + semilla

- `seedProfessionalsIfEmpty()` — siembra desde `lib/data` (demo; TODO D8).
- `getProfessionals(): Professional[]` — activos y no borrados; parsea los JSON.
- `getProfessionalsAll(): ProfessionalAdminView[]` — para el panel (incluye `active`).
- `getProfessionalById(id)`.
- `upsertRulesForPro(prof)` — INSERT OR REPLACE en `availability_rules` según días/horario del profesional (índice único `ux_rule_pro_day`); camina con `sqlite` nativo.

## Acción 3 — `lib/professionals/actions.ts`: server actions con RBAC

- `saveProfessional(input)` — crear (id desde el nombre, único) / editar (nombre, rol, servicios, días indicados, horario), `canManageSchedule` (admin+terapeuta), auditoría, `revalidatePath`.
- `setProfessionalActive(id, active)` — alta/baja lógica visible en `/agendar`.
- `deleteProfessional(id)` — baja blanda + desactiva sus reglas (las citas históricas se quedan).

## Acción 4 — `components/admin/ProfessionalsManager.tsx` + `app/admin/profesionales/page.tsx`

- Listado con estado (activo/inactivo), edición en formulario (nombre, rol, casillas de servicios desde `services` de la BD, casillas de días con horario de apertura/cierre, sábado opcional), cambiar estado, dar de baja con confirmación.
- La página replica el patrón de `/admin/horarios`: sesión → RBAC → `AdminShell` (se añade el ítem "Profesionales" al nav, roles admin+terapeuta).

## Acción 5 — `app/admin/servicios/page.tsx` (vista dedicada de agenda)

- Listado de TODOS los servicios (visibles y ocultos) con los campos de agenda: duración, buffer, modalidades activas, visible; enlaces profundos: "Editar en Contenido" → `/admin/contenido?tab=servicios&edit=<slug>` y "Nuevo servicio" → `/admin/contenido?tab=servicios`.
- Nav "Servicios" con los mismos roles de contenido.

## Acción 6 — Cambio de consumidores + verificación

- `lib/schedule.ts`, `lib/schedule/actions.ts`, `app/agendar/`, `app/admin/horarios/`, `app/servicios/[slug]`, `app/nosotros/` → `getProfessionals()`.
- Verificación: `tsc` limpio; build; smoke: crear/editar/desactivar un pro en el panel y verlo en `/agendar` y en `/admin/horarios`; `check:agenda` sigue PASS; `/admin/servicios` y `/admin/profesionales` dejan de dar 404.

---

## Notas técnicas

- **Anti-doble-reserva (BD)** y motor de R4-A no se tocan: solo la capa de identidad de profesionales.
- Los campos `saturday` solo se aplican si el profesional atiende el día 6; el guardado escribe la regla correspondiente.
- `lib/data.ts` sigue siendo semilla demo — TODO D8 sigue vivo.

---

## Ejecutado (2026-11-02)

- ✅ Acción 1: tabla `professionals` en `lib/db.ts` (16 tablas en total).
- ✅ Acción 2: `lib/professionals.ts` — `getProfessionals()` (activos), `getProfessionalsAll()` (panel), `getProfessionalById()`, semilla demo idempotente, `upsertRulesForPro()` (UPSERT contra `ux_rule_pro_day`).
- ✅ Acción 3: `lib/professionals/actions.ts` — `saveProfessional` (alta con id derivado del nombre, único; edición), `setProfessionalActive`, `deleteProfessional` (baja blanda + reglas inactivas); RBAC `canManageSchedule`, auditoría, `revalidatePath` ×3.
- ✅ Acción 4: `components/admin/ProfessionalsManager.tsx` (listado + alta/editar/activar/desactivar/dar de baja con confirmación) + `app/admin/profesionales/page.tsx` (RBAC igual que `/admin/horarios`).
- ✅ Acción 5: `app/admin/servicios/page.tsx` (vista dedicada + deep-links `?tab=servicios&edit=<slug>`).
- ✅ Acción 6: consumidores migrados a `getProfessionals()` — `lib/schedule.ts` (semilla de reglas, `proFor` y validaciones), `lib/schedule/actions.ts`, `app/agendar`, `app/admin/horarios`, `app/servicios/[slug]`, `app/nosotros`; nav del panel con los 2 ítems nuevos.

**Verificación:** `tsc` limpio; build 33 rutas; RBAC 307 sin sesión / 200 con cookie firmada admin; semilla BD (2 pros demo con sábado); UPSERT de reglas probado contra SQLite real (insert + conflicto → gana el último); `/agendar` y `/admin/horarios` muestran los pros desde la BD; `check:agenda` PASS; sin errores en el log del servidor.
