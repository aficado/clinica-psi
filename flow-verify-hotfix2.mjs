// Verificación R4-B-HOTFIX-2: el calendario de /agendar ATRACIZA en el primer
// mes que la ventana permite reservar (aunque la cookie guardara una fecha del
// último mes o de un mes sin cupo), y las fechas restauradas se re-validan.
// NO toca los ajustes (usa la ventana que encontró, p. ej. 60) y limpia todo.
import puppeteer from "puppeteer";
import { DatabaseSync } from "node:sqlite";
import { execSync } from "node:child_process";

const base = "http://localhost:3000";
const db = new DatabaseSync("/home/aficado/clinica-bienestar/data/clinica-bienestar.db");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let browser, fails = 0;
const log = [];
const line = (s) => { log.push(s); console.log(s); };

// ---- datos del entorno ----------------------------------------------------
const isoOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoOf(d);
};
const dow = (iso) => new Date(`${iso}T12:00:00`).getDay();
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const etiquetaMes = (mesIso) => `${MESES[Number(mesIso.slice(5, 7)) - 1]} ${mesIso.slice(0, 4)}`;

const W = db.prepare("SELECT booking_window_days w FROM site_settings WHERE id='current'").get().w;
const today = isoOf(new Date());
const MIN = addDays(today, 1);
const MAX = addDays(MIN, W - 1);
const proId = (db.prepare("SELECT id FROM professionals WHERE name LIKE 'Dra.%' ORDER BY id").get() ?? {}).id;
const svcRow = db.prepare("SELECT slug FROM services WHERE name LIKE 'Terapia de pareja%'").get();
const SVC = svcRow.slug;
const rules = db
  .prepare("SELECT day_of_week d, open_hour o FROM availability_rules WHERE pro_id = ? AND active = 1")
  .all(proId);
const taken = new Set(
  db.prepare("SELECT date || ':' || hour k FROM appointments WHERE pro_id = ? AND status = 'confirmada'").all(proId).map((r) => r.k),
);
const openHourOf = (iso) => (rules.find((r) => r.d === dow(iso)) ?? {}).o ?? null;
const dayFree = (iso) => {
  const h = openHourOf(iso);
  return h !== null && !taken.has(`${iso}:${h}`) ? h : null;
};
function primerLibre(desde, hasta, bloqueada = () => false) {
  for (let cur = desde; cur <= hasta; cur = addDays(cur, 1)) {
    if (bloqueada(cur)) continue;
    const h = dayFree(cur);
    if (h !== null) return { iso: cur, hour: h };
  }
  return null;
}
// último día libre del mes de MAX (para la cookie "vieja" aún válida)
function ultimoLibre() {
  for (let cur = MAX; cur >= MIN; cur = addDays(cur, -1)) {
    const h = dayFree(cur);
    if (h !== null) return { iso: cur, hour: h };
  }
  return null;
}

const esperA = primerLibre(MIN, MAX); // primer día agendable real (landing esperado, ventana intacta)
const cookieB = ultimoLibre(); // fecha vieja DENTRO de ventana (última libre: "el último mes")
const landingD = (() => {
  // escenario D: todo el mes de MIN bloqueado → primer libre posterior
  const mesFin = `${MIN.slice(0, 7)}-31`;
  return primerLibre(MIN, MAX, (iso) => iso <= mesFin);
})();
const previewIso = addDays(MAX, 30); // mes mucho después del límite

try {
  try {
    execSync("curl -s -o /dev/null -w '' http://localhost:3000/");
  } catch {
    execSync("cd /home/aficado/clinica-bienestar && (nohup npm start > /tmp/opencode/serve.log 2>&1 &)", { stdio: "ignore" });
    for (let i = 0; i < 40; i++) {
      try { execSync("curl -s -o /dev/null -w '' http://localhost:3000/"); break; } catch { await sleep(750); }
    }
  }
  browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });

  const nuevo = async () => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1366, height: 950 });
    return {
      ctx,
      page,
      js: (fn, ...args) => page.evaluate(fn, ...args),
      clickBtn: async (txt) =>
        JSON.parse(
          await page.evaluate((t) => {
            const re = new RegExp(t);
            const b = [...document.querySelectorAll("button")].find((x) => re.test(x.textContent));
            if (b) { b.click(); return JSON.stringify(true); }
            return JSON.stringify(false);
          }, txt),
        ),
    };
  };

  // El mes visible deja de cambiar tras el anclaje: tómalo cuando se estabilice.
  const mesEstable = async (p) => {
    let prev = null, estable = 0;
    for (let i = 0; i < 24; i++) {
      const m = await p.js(() => document.querySelector('span[aria-live="polite"]')?.textContent.trim() ?? "(sin calendario)");
      if (m && m === prev) { if (++estable >= 3) return m; } else { estable = 0; prev = m; }
      await sleep(400);
    }
    return prev;
  };

  const hastaPaso3 = async (p) => {
    await p.page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
    await sleep(1400);
    await p.clickBtn("Terapia de pareja");
    await sleep(700);
    await p.clickBtn("Presencial");
    await sleep(700);
    await p.clickBtn("Dra\\.");
    await sleep(1200);
  };

  const sembrarCookie = async (p, state) => {
    await p.page.goto(`${base}/`, { waitUntil: "networkidle0" });
    await p.js((s) => {
      document.cookie = `booking_state=${JSON.stringify(s)}; path=/; SameSite=Lax`;
    }, state);
  };

  line(`entorno: ventana=${W} d → ${MIN}..${MAX} · pro=${proId} svc=${SVC}`);

  // --- A. paciente nuevo: aterriza en el PRIMER mes con cupo (no el último) ---
  const a = await nuevo();
  await hastaPaso3(a);
  const mesA = await mesEstable(a);
  const okA = mesA === etiquetaMes(esperA.iso.slice(0, 7));
  line(`A) aterrizaje nuevo: "${mesA}" (esperado "${etiquetaMes(esperA.iso.slice(0, 7))}") ${okA ? "✔" : "✘"}`);
  if (!okA) fails++;
  const geoA = JSON.parse(
    await a.js(() => {
      const n = [...document.querySelectorAll("button")].find((b) => /Siguiente/.test(b.textContent));
      return JSON.stringify({ siguienteDisabled: n?.disabled ?? null });
    }),
  );
  if (geoA.siguienteDisabled !== true) { line("A) ✘ Siguiente debería estar desactivado sin elegir nada"); fails++; }
  await a.ctx.close();

  // --- B. cookie vieja con fecha DENTRO de la ventana pero en el último mes ---
  // El mes de aterrizaje es el primero permitido; la selección sigue válida.
  const b = await nuevo();
  await sembrarCookie(b, {
    serviceSlug: SVC, modality: "presencial", proId,
    dateIso: cookieB.iso, hour: cookieB.hour,
    monthIso: cookieB.iso.slice(0, 7), step: 3,
  });
  await b.page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
  await sleep(1500);
  const mesB = await mesEstable(b);
  const esperadoB = etiquetaMes(esperA.iso.slice(0, 7));
  const okB = mesB === esperadoB;
  line(`B) cookie vieja (cita ${cookieB.iso} dentro de ventana): aterriza en "${mesB}" (esperado "${esperadoB}") ${okB ? "✔" : "✘"}`);
  if (!okB) fails++;
  if (cookieB.iso.slice(0, 7) === esperA.iso.slice(0, 7)) line("B) aviso: la fecha vieja caía en el mismo mes; caso degenerado");
  await b.ctx.close();

  // --- C. cookie VIEJA con fecha FUERA de la ventana: se descarta ---
  const c = await nuevo();
  const fuera = addDays(MAX, 60);
  await sembrarCookie(c, {
    serviceSlug: SVC, modality: "presencial", proId,
    dateIso: fuera, hour: 10, monthIso: fuera.slice(0, 7), step: 3,
  });
  await c.page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
  await sleep(2200); // deja actuar a la revalidación (fetchDaySlots → fuera_de_ventana)
  const mesC = await mesEstable(c);
  const estadoC = JSON.parse(
    await c.js(() => {
      const n = [...document.querySelectorAll("button")].find((b) => /Siguiente/.test(b.textContent));
      const ck = (document.cookie.split("; ").find((x) => x.startsWith("booking_state=")) || "").split("=").slice(1).join("=");
      let fechaEnCookie = null;
      try { fechaEnCookie = JSON.parse(decodeURIComponent(ck)).dateIso ?? null; } catch {}
      return JSON.stringify({
        siguienteDisabled: n?.disabled ?? null,
        fechaEnCookie,
        diasSeleccionados: [...document.querySelectorAll('[role="grid"] button[aria-pressed="true"]')].length,
      });
    }),
  );
  const okC = mesC === esperadoB && estadoC.siguienteDisabled === true && !estadoC.fechaEnCookie && estadoC.diasSeleccionados === 0;
  line(`C) cookie fuera de ventana (${fuera}): mes "${mesC}", Siguiente disabled=${estadoC.siguienteDisabled}, fechaCookie=${estadoC.fechaEnCookie}, días sel=${estadoC.diasSeleccionados} ${okC ? "✔" : "✘"}`);
  if (!okC) fails++;
  await c.ctx.close();

  // --- D. primer mes SIN cupo real (bloqueado por el admin) → avanza solo ---
  const now = Date.now();
  const ins = db
    .prepare(
      `INSERT INTO date_exceptions (pro_id, date_from, date_to, kind, note, active, created_at, updated_at)
       VALUES (?, ?, ?, 'vacaciones', 'PRUEBA-HOTFIX-2 (auto-limpia)', 1, ?, ?)`,
    )
    .run(proId, MIN, `${MIN.slice(0, 7)}-31`, now, now);
  const d = await nuevo();
  await hastaPaso3(d);
  const mesD = await mesEstable(d);
  const esperadoD = etiquetaMes(landingD.iso.slice(0, 7));
  const okD = mesD === esperadoD;
  line(`D) ${MIN.slice(0, 7)} bloqueado entero: aterriza en "${mesD}" (esperado "${esperadoD}", primer mes con cupo) ${okD ? "✔" : "✘"}`);
  if (!okD) fails++;
  await d.ctx.close();
  db.prepare("DELETE FROM date_exceptions WHERE id = ?").run(ins.lastInsertRowid);
  line(`D-limpieza: bloqueo PRUEBA-HOTFIX-2 eliminado (id ${ins.lastInsertRowid})`);

  // --- E. previsualización del panel (?dia=) NO se re-atraca ---
  const e = await nuevo();
  await e.page.goto(`${base}/agendar?service=${SVC}&mode=presencial&pro=${proId}&dia=${previewIso}`, { waitUntil: "networkidle0" });
  await sleep(1800);
  const mesE = JSON.parse(
    await e.js(() => {
      const m = document.querySelector('span[aria-live="polite"]')?.textContent.trim() ?? null;
      const n = [...document.querySelectorAll("button")].find((b) => /Siguiente/.test(b.textContent));
      return JSON.stringify({ mes: m, siguienteDisabled: n?.disabled ?? null });
    }),
  );
  const okE = mesE === null ? false : mesE.mes === etiquetaMes(previewIso.slice(0, 7)) && mesE.siguienteDisabled === true;
  line(`E) preview ?dia=${previewIso}: mes "${mesE.mes}" (esperado "${etiquetaMes(previewIso.slice(0, 7))}"), Siguiente disabled=${mesE.siguienteDisabled} ${okE ? "✔" : "✘"}`);
  if (!okE) fails++;
  await e.ctx.close();

  // --- Z. el estado quedó como lo encontró -----------------------------------
  const wAhora = db.prepare("SELECT booking_window_days w FROM site_settings WHERE id='current'").get().w;
  const pruebasRestantes = db.prepare("SELECT COUNT(*) n FROM date_exceptions WHERE note LIKE 'PRUEBA-HOTFIX-2%'").get().n;
  line(`Z) ventana sigue=${wAhora} (era ${W}) · bloqueos de prueba restantes=${pruebasRestantes}`);
  if (wAhora !== W || pruebasRestantes !== 0) fails++;

  line(`\nRESULTADO: ${fails === 0 ? "✔ TODAS las verificaciones R4-B-HOTFIX-2 pasaron" : "✘ " + fails + " fallaron"}`);
} catch (e) {
  line(`FATAL: ${e.message}`);
  fails++;
} finally {
  if (browser) await browser.close();
  const { writeFileSync } = await import("node:fs");
  writeFileSync("/tmp/opencode/flow-verify-hotfix2.txt", log.join("\n"), "utf8");
}
process.exit(fails === 0 ? 0 : 1);
