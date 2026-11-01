# PROMPT — Plataforma web para clínica de bienestar integral

> **Destino:** OpenCode (agente de código) con skills de UX/UI instaladas.
> **Uso:** completa la sección 0, instala las skills de la sección 1 y pega desde la sección 2 en adelante como prompt inicial. Guárdalo también en la raíz del proyecto como `PROMPT.md` o `AGENTS.md` para que el agente lo consulte en cada sesión.

---

## 0. Datos del cliente (completar antes de enviar)

| Campo | Valor |
|---|---|
| Nombre de la clínica | `[COMPLETAR]` |
| Lema / propuesta de valor | `[COMPLETAR]` |
| Nombre y título del psicólogo titular | `[COMPLETAR]` |
| Ciudad / dirección | `[COMPLETAR]` |
| WhatsApp / teléfono / correo | `[COMPLETAR]` |
| Redes sociales | `[COMPLETAR]` |
| Horario de atención | `[COMPLETAR]` |
| Logo y fotos (sí/no) | `[COMPLETAR]` |
| Servicios y precios | `[COMPLETAR o "usar datos de ejemplo"]` |
| Dominio deseado | `[COMPLETAR]` |

Si algún dato no está completado, **usa contenido de ejemplo realista en español de México, márcalo con `TODO:` en el código y deja todo editable desde el panel admin.**

---

## 1. Skills de UX/UI a instalar antes de empezar

OpenCode carga las skills desde `.opencode/skill/` (por proyecto) o `~/.config/opencode/skill/` (global). Cada una es una carpeta con un `SKILL.md`. Verifica el método de instalación en el README de cada repositorio, porque puede variar.

| Prioridad | Skill | Para qué sirve en este proyecto | Origen |
|---|---|---|---|
| Alta | `frontend-design` | Interfaces distintivas y de calidad de producción; evita el aspecto genérico de IA | `anthropics/frontend-design` |
| Alta | `ui-ux-pro-max` | Estilos, paletas, tipografías y lineamientos UI/UX para web y móvil | `nextlevelbuilder/ui-ux-pro-max-skill` |
| Alta | `visual-design-foundations` | Tipografía, teoría del color y espaciado coherentes | `wshobson/visual-design-foundations` |
| Alta | Accesibilidad WCAG 2.2 | Interfaces inclusivas, contraste, foco, lectores de pantalla | `wshobson` (skill de accesibilidad) |
| Media | `responsive-design` | Mobile-first real, breakpoints y layouts fluidos | `wshobson/responsive-design` |
| Media | `design-system-patterns` | Design tokens y theming editable (clave para el panel admin) | `wshobson/design-system-patterns` |
| Media | `interaction-design` | Microinteracciones, transiciones y estados de feedback | `wshobson/interaction-design` |

> **Instrucción al agente:** antes de escribir cualquier componente visual, lee las skills instaladas y aplícalas. Si alguna no está disponible, dímelo y continúa con las mejores prácticas equivalentes.

---

## 2. Rol y objetivo

Actúa como **equipo senior de producto**: arquitecto full-stack, diseñador UX/UI y especialista en accesibilidad. Construye una **plataforma web dinámica** para una **clínica de bienestar integral dirigida por un psicólogo**, con panel de administración autogestionable.

**Objetivo de negocio**

1. Que los clientes accedan desde **un solo enlace** (URL corta + QR) a todo el ecosistema de la clínica.
2. Captar pacientes mediante **contenido gratuito** y **contenido educativo preventivo**.
3. Convertir visitas en **citas agendadas**.
4. Generar ingresos adicionales con **cursos y talleres**.
5. Permitir que una persona **no técnica** administre todo sin tocar código.

**Idioma:** español (México). **Dispositivo principal:** celular (≥ 80 % del tráfico esperado).

---

## 3. Pilares del sitio (áreas principales)

| # | Área | Propósito | Ruta |
|---|---|---|---|
| 1 | **Zona gratuita** | Actividades para asistir: yoga, deporte, respiración, meditación, estiramientos | `/gratis` |
| 2 | **Información de valor** | Prevención en psicología, medicina china, masajes, nutrición, etc. | `/aprende` |
| 3 | **Servicios y citas** | Terapias profesionales y masajes, con agenda en línea | `/servicios`, `/agendar` |
| 4 | **Cursos y clases** | Formación para quienes quieran aprender lo que hace la clínica | `/cursos` |

Además: **Inicio** (`/`), **Sobre nosotros** (`/nosotros`), **Contacto** (`/contacto`) y **Aviso de privacidad** (`/privacidad`).

---

## 4. Requerimientos funcionales

### 4.1 Inicio

- Hero con propuesta de valor, imagen cálida y CTA primario **"Agendar cita"** y secundario **"Explorar contenido gratis"**.
- Bloque de **4 accesos rápidos** a los pilares.
- Presentación del psicólogo: foto, biografía, formación, cédula profesional.
- Testimonios (con consentimiento; editables).
- Servicios destacados, próximos cursos y últimas publicaciones (contenido dinámico).
- Ubicación con mapa, horarios, WhatsApp y botón flotante de contacto.

### 4.2 Zona gratuita

- Biblioteca de videos y recursos con **filtros** por categoría, duración y nivel.
- Reproductor integrado (archivo propio o YouTube/Vimeo).
- Detalle del recurso: video, descripción, beneficios, precauciones y recursos relacionados.
- Botón **compartir** (WhatsApp, copiar enlace).
- CTA contextual hacia un servicio relacionado (por ejemplo, tras un video de respiración, ofrecer terapia de ansiedad).

### 4.3 Información de valor

- Blog con categorías: Psicología, Medicina china, Masajes, Nutrición, Salud física, Salud emocional.
- Artículo: título, portada, tiempo de lectura, autor, fecha, etiquetas, video opcional, índice de contenido.
- Buscador y filtros; artículos relacionados.
- Aviso breve de que el contenido es informativo y no sustituye una consulta.

### 4.4 Servicios y terapias

- Catálogo por categoría: Terapia psicológica (individual, pareja, familiar), masajes terapéuticos, medicina china, nutrición, otros.
- Ficha de servicio: descripción, a quién va dirigido, qué esperar de la sesión, duración, modalidad (presencial / en línea), precio opcional, preguntas frecuentes.
- CTA **"Agendar"** que precarga el servicio en el flujo de citas.

### 4.5 Agenda de citas

**Flujo del cliente (máximo 4 pasos, sin crear cuenta):**

1. Elegir servicio y modalidad.
2. Elegir profesional (opcional) y ver disponibilidad.
3. Elegir fecha y hora.
4. Capturar datos (nombre, teléfono, correo, motivo opcional) + consentimiento de privacidad.

**Reglas y automatizaciones**

- Disponibilidad en tiempo real; evitar doble reserva (control de concurrencia en base de datos).
- Duración y tiempo de descanso configurables por servicio.
- Bloqueos por vacaciones, festivos y excepciones.
- Zona horaria de México configurable.
- Confirmación por correo y enlace de WhatsApp; recordatorio automático previo.
- Cancelar o reprogramar mediante enlace único firmado, con política de anticipación configurable.
- Sincronización con Google Calendar (fase posterior si es necesario).
- Pago o anticipo en línea **opcional** con **Mercado Pago** (activable desde el admin).

### 4.6 Cursos y clases

- Catálogo con filtros por tema y modalidad.
- Ficha del curso: descripción, a quién va dirigido, temario, instructor, fechas, duración, modalidad (presencial / en línea / grabado), precio, cupo disponible, requisitos.
- Inscripción con formulario y pago opcional; control de cupo.
- **Fase 2:** área privada de alumnos con lecciones en video, material descargable y avance.

### 4.7 Enlace de acceso y compartir

- URL corta personalizable (ejemplo: `/c/clinica`) y **código QR descargable** (PNG y SVG) generado desde el admin.
- Página de enlaces tipo **"link in bio"** (`/links`) con botones personalizables, pensada para compartir por WhatsApp e Instagram.
- Metadatos Open Graph para que el enlace se vea bien al compartirse.

---

## 5. Panel de administración

Debe ser **visual, guiado y a prueba de errores**, pensado para alguien sin conocimientos técnicos.

| Módulo | Capacidades |
|---|---|
| **Apariencia** | Logo, paleta de colores, tipografías (de una lista curada), imágenes del hero |
| **Contenido** | Editor visual (WYSIWYG) para páginas, textos y secciones; activar/desactivar secciones |
| **Multimedia** | Subir, reemplazar y eliminar videos, imágenes y documentos; enlazar YouTube/Vimeo; barra de progreso de carga |
| **Artículos / Recursos** | CRUD con borrador, programación de publicación y vista previa |
| **Servicios / Cursos** | CRUD con campos específicos, orden por arrastre y estado visible/oculto |
| **Testimonios** | CRUD con aprobación |
| **Enlaces** | Menú de navegación, botones, redes sociales, enlaces cortos y QR |
| **Agenda** | Horarios por profesional, bloqueos, citas (ver, confirmar, cancelar, reprogramar), lista de clientes |
| **Inscripciones** | Lista por curso, estado de pago, exportación a CSV |
| **Estadísticas** | Visitas, citas, conversión y contenido más visto |
| **Usuarios y roles** | Administrador, Terapeuta, Asistente, con permisos distintos |
| **Ajustes** | Datos de contacto, correo remitente, políticas, integraciones |

**Principios de UX del admin:** vista previa antes de publicar, confirmación antes de borrar, mensajes de error en lenguaje claro, deshacer cuando sea posible y ayuda contextual breve en cada pantalla.

**Seguridad de acceso:** autenticación con recuperación de contraseña, 2FA opcional, control de acceso por rol (RBAC) aplicado también a nivel de base de datos.

---

## 6. Dirección de diseño UX/UI

> **Regla central:** el resultado debe sentirse como **una marca de salud con identidad propia**, no como una plantilla genérica. Evita el aspecto típico de landing generada por IA.

### 6.1 Concepto

**"Calma cálida y profesional."** Un espacio que baja la ansiedad apenas se abre la página: mucho aire, ritmo pausado, jerarquía clara y cercanía humana. Debe transmitir **confianza clínica sin frialdad hospitalaria**.

### 6.2 Lineamientos obligatorios

- **Paleta propuesta (editable vía tokens):**
  - Salvia profundo `#3F5E52` (primario)
  - Verde niebla `#DCE7E0` (superficies)
  - Arena cálida `#F5EFE6` (fondo)
  - Terracota suave `#C97B5A` (acento y CTA)
  - Tinta `#1F2A27` (texto)
  - Verifica contraste **WCAG AA** como mínimo en cada combinación.
- **Tipografía:** par con carácter. Titulares con serif humanista (por ejemplo *Fraunces* o *Newsreader*) y cuerpo con sans legible (por ejemplo *Inter* o *Plus Jakarta Sans*). Cuerpo ≥ 16 px, interlineado 1.6.
- **Imágenes:** fotografía real y cálida, evitando bancos de imágenes genéricos de personas sonriendo. Si faltan fotos, usar ilustración orgánica o texturas suaves, no placeholders grises.
- **Formas y layout:** bordes redondeados amplios, composición asimétrica en el hero, secciones con ritmo variado (no la misma tarjeta repetida), fondos con formas orgánicas sutiles.
- **Espaciado:** escala de 4/8 px consistente, abundante espacio en blanco.
- **Movimiento:** microinteracciones suaves (150–300 ms), entrada escalonada de secciones, respeto de `prefers-reduced-motion`. Nada de animaciones llamativas.
- **Componentes de confianza:** credenciales visibles, cédula profesional, testimonios, aviso de confidencialidad, mensaje claro de "qué pasa después de agendar".
- **Móvil primero:** objetivos táctiles ≥ 44 px, navegación inferior o menú simple, CTA siempre alcanzable con el pulgar, formularios de un solo campo por pantalla donde convenga.

### 6.3 Qué evitar

- Gradientes morados o azul neón, tarjetas idénticas en cuadrícula infinita, iconos genéricos sin intención, textos tipo "Soluciones innovadoras para tu bienestar".
- Copys vacíos. Redacta con voz **cercana, empática y profesional**, sin promesas médicas de curación.

### 6.4 Sistema de diseño

- Define **design tokens** (color, tipografía, radio, sombra, espaciado) en variables CSS, **conectados al panel de Apariencia** para que cambien sin código.
- Soporta **modo claro** como principal; modo oscuro opcional.
- Documenta componentes en una página interna `/design-system` o en Storybook.

### 6.5 Accesibilidad (WCAG 2.2 AA)

- Navegación completa por teclado, foco visible, orden lógico.
- Etiquetas y errores asociados en formularios, mensajes `aria-live`.
- Texto alternativo en imágenes, **subtítulos en videos** y transcripción cuando sea posible.
- No depender solo del color para transmitir información.

---

## 7. Arquitectura técnica recomendada

> Puedes proponer una alternativa si la justificas por **costo, mantenimiento y facilidad de administración**.

| Capa | Propuesta |
|---|---|
| Framework | **Next.js** (App Router) + **TypeScript** |
| Estilos | **Tailwind CSS** + **shadcn/ui** + tokens CSS |
| Backend y datos | **Supabase** (PostgreSQL, Auth, Storage, Row Level Security) |
| Videos | Enlaces a YouTube/Vimeo (no listado) y, para videos propios, servicio especializado (Cloudflare Stream o Mux) en lugar de almacenar archivos pesados en base de datos |
| Pagos | **Mercado Pago** (México), activable por configuración |
| Correo | **Resend** (confirmaciones y recordatorios) |
| Recordatorios | Tareas programadas (cron) |
| WhatsApp | Fase 1: enlaces `wa.me` con mensaje precargado. Fase 2: WhatsApp Business API |
| Mapa | Google Maps embebido |
| Hosting | **Vercel** + dominio propio con SSL |
| Analítica | Analítica respetuosa de privacidad (Plausible o similar) |

---

## 8. Modelo de datos (punto de partida)

Entrega el esquema SQL completo con **migraciones**, **índices** y **políticas RLS**. Entidades mínimas:

- `users`, `roles`, `profiles` (profesionales con biografía y foto)
- `site_settings`, `theme_tokens`, `nav_items`, `short_links`
- `services`, `service_categories`
- `availability_rules`, `availability_exceptions`, `appointments`, `clients`
- `articles`, `article_categories`, `tags`, `article_tags`
- `free_resources` (videos y recursos gratuitos), `resource_categories`
- `courses`, `course_sessions`, `enrollments`, `lessons` (fase 2)
- `testimonials`, `media_assets`, `payments`, `audit_logs`

---

## 9. Seguridad, privacidad y cumplimiento

- Cumplimiento de la **LFPDPPP (México)**: aviso de privacidad integral, consentimiento expreso y derechos ARCO.
- **Datos de salud = datos sensibles**: recolectar solo lo necesario; el "motivo de consulta" es opcional y se almacena **cifrado**.
- HTTPS obligatorio, cabeceras de seguridad, protección contra CSRF/XSS, validación en servidor, **rate limiting** en formularios y anti-spam (captcha invisible).
- RLS en todas las tablas, mínimo privilegio por rol y **bitácora de auditoría**.
- Copias de seguridad automáticas y plan de restauración documentado.
- Banner de cookies solo si se usan cookies no esenciales.
- **No** publicar historiales clínicos ni datos identificables en contenido público.

---

## 10. Rendimiento y SEO

- Metas: **LCP < 2.5 s**, **CLS < 0.1**, **INP < 200 ms**, Lighthouse ≥ 90 en móvil.
- Imágenes optimizadas (WebP/AVIF, carga diferida), fuentes con `font-display: swap`.
- SEO técnico: metadatos por página, `sitemap.xml`, `robots.txt`, datos estructurados (`LocalBusiness`, `Article`, `Course`, `Service`), URLs semánticas en español.
- SEO local: ficha de negocio de Google enlazada y datos NAP consistentes.

---

## 11. Plan de trabajo por fases

Trabaja **fase por fase** y **detente al terminar cada una** para que yo apruebe antes de continuar.

| Fase | Contenido | Criterio de aceptación |
|---|---|---|
| **0. Descubrimiento** | Haz las preguntas necesarias, propón stack, mapa del sitio y wireframes | Yo apruebo la propuesta |
| **1. Base y diseño** | Proyecto, sistema de diseño, layout, Inicio, páginas estáticas | Se ve profesional en móvil y escritorio; pasa AA de contraste |
| **2. Contenido** | Zona gratuita, blog, servicios y cursos (lectura) | Filtros, buscador y reproductor funcionando |
| **3. Panel admin** | Auth, roles, CRUD de contenido, multimedia, apariencia, enlaces y QR | Una persona no técnica edita todo sin ayuda |
| **4. Agenda** | Disponibilidad, reserva, correos, recordatorios, cancelación | Cero dobles reservas en pruebas de concurrencia |
| **5. Cursos y pagos** | Inscripción, cupos, Mercado Pago | Flujo de inscripción y pago de extremo a extremo |
| **6. Alumnos (opcional)** | Área privada con lecciones | Acceso restringido por inscripción |
| **7. Cierre** | SEO, rendimiento, seguridad, pruebas, documentación y despliegue | Checklist completo entregado |

---

## 12. Reglas de trabajo para el agente

1. **Pregunta antes de asumir** en decisiones de negocio (precios, políticas de cancelación, servicios exactos).
2. **Lee y aplica las skills de UX/UI** antes de crear interfaces; menciona cuáles usaste.
3. Código **tipado, modular y comentado donde aporte**, con variables de entorno documentadas en `.env.example`.
4. **Pruebas:** unitarias para reglas de agenda, e2e (Playwright) para los flujos críticos: reservar cita, cancelar, inscribirse y login admin.
5. Haz **commits pequeños y descriptivos** y mantén un `CHANGELOG.md`.
6. No inventes testimonios, credenciales ni cifras: usa marcadores `TODO:` visibles.
7. Al final de cada fase entrega: resumen de lo hecho, cómo probarlo, pendientes y riesgos.

---

## 13. Entregables finales

- [ ] Repositorio con código, migraciones y `README.md` de instalación.
- [ ] Sitio desplegado con dominio y SSL.
- [ ] **Manual del administrador** en español, con capturas, paso a paso y lenguaje sencillo.
- [ ] Guía para **generar el enlace corto y el QR** y compartirlos con clientes.
- [ ] Documentación del sistema de diseño y de los tokens.
- [ ] Checklist de cumplimiento (privacidad, accesibilidad, seguridad).
- [ ] Plan de respaldo y recuperación.

---

## 14. Primera instrucción

Empieza por la **Fase 0**. Confirma qué skills de UX/UI detectaste, hazme **como máximo 10 preguntas clave** (agrupadas), y presenta:

1. Propuesta de identidad visual (2 direcciones de diseño con paleta y tipografía).
2. Mapa del sitio y flujo de usuario.
3. Wireframes en texto o descripción de las pantallas clave (Inicio, Agendar, Admin).

**No escribas código de producción hasta que yo apruebe la Fase 0.**
