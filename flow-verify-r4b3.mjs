// Verificación R4-B-3: PB-1 Ajustes, PB-2 vista anual, PB-3 bloqueos por fecha.
// Simula a la dueña (panel) y a una persona agendando (contexto de navegador
// limpio por visita: el flujo /agendar restaura su paso desde cookies).
// Limpia todo lo que crea al final.
import puppeteer from "puppeteer";
import { DatabaseSync } from "node:sqlite";
import { execSync } from "node:child_process";

const base = "http://localhost:3000";
const dbPath = "/home/aficado/clinica-bienestar/data/clinica-bienestar.db";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
let fails = 0;
const log = [];
const line = (s) => { log.push(s); console.log(s); };

try {
  try {
    execSync("curl -s -o /dev/null -w '' http://localhost:3000/");
    console.log("servidor ya arriba");
  } catch (e) {
    execSync("cd /home/aficado/clinica-bienestar && (nohup npm start > /tmp/opencode/serve.log 2>&1 &)", { stdio: "ignore" });
    for (let i = 0; i < 40; i++) {
      try { execSync("curl -s -o /dev/null -w '' http://localhost:3000/"); break; } catch (_) { await sleep(750); }
    }
  }

  browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });

  // Helpers: todo se serializa con JSON dentro del navegador (page.evaluate
  // retorna undefined con Arrays/objetos en este contexto — lección R4-B-BUG-1).
  const mk = (page) => ({
    js: (fn, ...args) => page.evaluate(fn, ...args),
    clickBtn: async (matcher) =>
      JSON.parse(
        await page.evaluate((txt) => {
          const re = new RegExp(txt);
          const b = [...document.querySelectorAll("button")].find((x) => re.test(x.textContent));
          if (b) { b.click(); return JSON.stringify(true); }
          return JSON.stringify(false);
        }, matcher),
      ),
  });

  const newPage = async () => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    return { page, ctx, ...mk(page) };
  };

  // Visita /agendar en contexto limpio y llega al calendario de la Dra.
  const openAgendar = async () => {
    const v = await newPage();
    await v.page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
    await sleep(1500);
    await v.clickBtn("Terapia de pareja");
    await sleep(700);
    await v.clickBtn("Presencial");
    await sleep(700);
    await v.clickBtn("Dra.");
    await sleep(1300);
    return v;
  };

  const db = new DatabaseSync(dbPath);
  // Ajustes que encontró la suite: se restauran al final (NO pisar los de la dueña).
  const ANTES = db
    .prepare("SELECT cancel_cutoff_hours h, booking_window_days w, time_zone z FROM site_settings WHERE id='current'")
    .get();

  // --- 0. login admin ------------------------------------------------------
  const admin = await newPage();
  await admin.page.goto(`${base}/admin/login`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await admin.page.type("input[type='email']", "admin@raizviva.mx");
  await admin.page.type("input[type='password']", "demo123");
  await admin.clickBtn("Entrar");
  await sleep(2500);
  const path0 = await admin.js(() => window.location.pathname);
  line(`0) login admin → ${path0}`);
  if (!String(path0).startsWith("/admin")) fails++;

  // --- 1. PB-1 Ajustes: guardar ventana=15, cutoff=6, zona Monterrey -------
  await admin.page.goto(`${base}/admin/ajustes`, { waitUntil: "networkidle0" });
  await sleep(1200);
  const formOk = await admin.js(() => {
    const nums = [...document.querySelectorAll('input[type="number"]')];
    const sel = document.querySelector("select");
    if (nums.length < 2 || !sel) return JSON.stringify({ ok: false, nums: nums.length });
    const setNative = (el, val) => {
      const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, String(val));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    setNative(nums[0], 6); // cutoff
    setNative(nums[1], 15); // window
    setNative(sel, "America/Monterrey");
    return JSON.stringify({ ok: true });
  });
  line(`1a) formulario Ajustes: ${formOk}`);
  await admin.clickBtn("Guardar ajustes");
  await sleep(3000);
  const saved = await admin.js(() => document.querySelector('[role="status"]')?.textContent ?? "");
  line(`1b) mensaje guardado: "${saved}"`);
  if (!/guardados/i.test(saved)) fails++;

  const srow = db
    .prepare("SELECT cancel_cutoff_hours h, booking_window_days w, time_zone z FROM site_settings WHERE id='current'")
    .get();
  line(`1c) BD: cutoff=${srow.h} ventana=${srow.w} zona=${srow.z}`);
  if (srow.h !== 6 || srow.w !== 15 || srow.z !== "America/Monterrey") fails++;

  // --- 2. PB-2 vista anual ---------------------------------------------------
  await admin.page.goto(`${base}/admin/horarios?tab=calendario`, { waitUntil: "networkidle0" });
  await sleep(1500);
  const vi = JSON.parse(
    await admin.js(() => {
      const grids = [...document.querySelectorAll('[role="grid"][aria-label]')].filter((g) =>
        /\d{4}$/.test(g.getAttribute("aria-label") || ""),
      );
      const legend = !!document.querySelector('[aria-label="Leyenda del calendario"]');
      const h2 = [...document.querySelectorAll("h2")].map((x) => x.textContent.trim())[0] ?? "";
      return JSON.stringify({ months: grids.length, legend, h2 });
    }),
  );
  // R4-B-CAL-1: el calendario muestra UN mes a la vez (con selector de mes).
  const viMes = JSON.parse(
    await admin.js(() => {
      const sel = document.querySelector('select[aria-label="Mes del calendario"]');
      return JSON.stringify({ selector: !!sel, opciones: sel ? sel.options.length : 0 });
    }),
  );
  line(`2) calendario por mes: grillas=${vi.months}, leyenda=${vi.legend}, título="${vi.h2}", selectorMes=${viMes.selector} (${viMes.opciones} opciones)`);
  if (vi.months !== 1 || !vi.legend || !viMes.selector || viMes.opciones !== 12) fails++;

  // --- 3. PB-3 bloqueo sobre un día que HOY tiene cupo -----------------------
  // 3a) primer día con cupo en /agendar (contexto limpio)
  const v1 = await openAgendar();
  const dayIso = await v1.js(() => {
    const head = document.querySelector('[role="status"][aria-live]')?.textContent ?? "";
    const y = Number((head.match(/(\d{4})/) || [])[1]);
    const mo =
      ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].findIndex(
        (x) => head.includes(x),
      ) + 1;
    const bs = [...document.querySelectorAll('[role="grid"] button')].filter(
      (b) => !b.disabled && b.getAttribute("aria-disabled") !== "true",
    );
    if (!bs.length || !y || mo < 1) return null;
    const d = Number(bs[0].textContent.trim().slice(0, 2));
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  });
  line(`3a) día con cupo detectado en /agendar: ${dayIso}`);
  if (!dayIso) fails++;
  await v1.ctx.close();

  // 3b) crear el bloqueo para la Dra en ESE día
  await admin.page.goto(`${base}/admin/horarios?tab=calendario`, { waitUntil: "networkidle0" });
  await sleep(1300);
  // R4-B-UX-1 movió el formulario de rango dentro de un <details>: hay que abrirlo.
  await admin.js(() => {
    const det = [...document.querySelectorAll("details summary")].find((x) => /rango/i.test(x.textContent));
    if (det) det.click();
  });
  await sleep(600);
  const pre = await admin.js((iso) => {
    const sets = [...document.querySelectorAll("select")];
    const exSel = sets.find((s) => [...s.options].some((o) => o.value === "*"));
    const dates = [...document.querySelectorAll('input[type="date"]')];
    const note = document.querySelector('input[type="text"][maxlength="200"]');
    if (!exSel || dates.length < 2 || !note) return JSON.stringify({ ok: false, why: "faltan campos" });
    const setNative = (el, val) => {
      const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, String(val));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const dra = [...exSel.options].find((o) => /Dra\./.test(o.textContent));
    setNative(exSel, dra ? dra.value : "*");
    setNative(dates[0], iso);
    setNative(dates[1], iso);
    setNative(note, "PRUEBA-R4B-3 (borrar tras gate)");
    return JSON.stringify({ ok: true, pro: exSel.value });
  }, dayIso);
  line(`3b) prefill bloqueo: ${pre}`);
  await admin.clickBtn("Bloquear el rango");
  await sleep(2500);
  const blockMsg = await admin.js(() => document.querySelector('[role="status"]')?.textContent ?? "");
  line(`3c) creación: "${blockMsg}"`);
  if (!/Bloqueo creado/i.test(blockMsg)) fails++;
  const exCount = db.prepare("SELECT COUNT(*) n FROM date_exceptions WHERE note LIKE 'PRUEBA-R4B-3%'").get().n;
  line(`3d) BD: excepciones PRUEBA=${exCount}`);
  if (exCount < 1) fails++;

  // 3e) en /agendar ese día ya no es seleccionable y explica el motivo
  const v2 = await openAgendar();
  const blocked = JSON.parse(
    await v2.js((iso) => {
      const d = iso.slice(8, 10); // el grid pinta el día con 2 dígitos ("05")
      const bs = [...document.querySelectorAll('[role="grid"] button')].filter((b) =>
        b.textContent.trim().startsWith(d),
      );
      if (!bs.length) return JSON.stringify({ found: false });
      const b = bs[0];
      return JSON.stringify({
        found: true,
        disabled: b.disabled || b.getAttribute("aria-disabled") === "true",
        title: b.getAttribute("title") ?? "",
      });
    }, dayIso),
  );
  line(`3e) día ${dayIso} en /agendar: ${JSON.stringify(blocked)}`);
  if (!blocked.found || !blocked.disabled || !/Vacaciones|PRUEBA/i.test(blocked.title)) fails++;
  await v2.ctx.close();

  // --- 4. ventana (15 d): R4-B-HOTFIX-1 — los días fuera de ventana se grisan ---
  const v3 = await openAgendar();
  for (let i = 0; i < 2; i++) {
    await v3.js(() => {
      const next = [...document.querySelectorAll('button[aria-label="Mes siguiente"]')];
      next[0]?.click();
    });
    await sleep(1300);
  }
  const win = JSON.parse(
    await v3.js(() => {
      const bs = [...document.querySelectorAll('[role="grid"] button')];
      const enabled = bs.filter((b) => !b.disabled && b.getAttribute("aria-disabled") !== "true");
      const note = [...document.querySelectorAll('[role="note"]')].map((n) => n.textContent.replace(/\s+/g, " ").trim()).join(" | ");
      const vent = bs.find((b) => /ventana/i.test(b.getAttribute("title") || ""));
      return JSON.stringify({
        dias: bs.length,
        habilitados: enabled.length,
        note,
        titulo: vent ? vent.getAttribute("title") : null,
      });
    }),
  );
  line(`4) mes fuera de ventana (15 d): ${JSON.stringify(win)}`);
  if (win.habilitados !== 0 || !/hasta el/.test(win.note) || !/ventana/i.test(String(win.titulo))) fails++;
  await v3.ctx.close();

  // --- 5. limpieza: borrar el bloqueo y restaurar ajustes --------------------
  await admin.page.goto(`${base}/admin/horarios?tab=calendario`, { waitUntil: "networkidle0" });
  await sleep(1300);
  for (let i = 0; i < 4; i++) {
    const clicked = await admin.clickBtn("Eliminar");
    await sleep(400);
    if (!clicked) break;
    await admin.clickBtn("Sí, eliminar");
    await sleep(1600);
  }
  const left = db.prepare("SELECT COUNT(*) n FROM date_exceptions WHERE note LIKE 'PRUEBA-R4B-3%'").get().n;
  line(`5a) excepciones PRUEBA restantes: ${left}`);
  if (left !== 0) fails++;

  await admin.page.goto(`${base}/admin/ajustes`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await admin.js((a) => {
    const nums = [...document.querySelectorAll('input[type="number"]')];
    const sel = document.querySelector("select");
    const setNative = (el, val) => {
      const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, String(val));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    setNative(nums[0], a.h);
    setNative(nums[1], a.w);
    setNative(sel, a.z);
  }, ANTES);
  await sleep(300);
  await admin.clickBtn("Guardar ajustes");
  await sleep(2500);
  const srow2 = db
    .prepare("SELECT cancel_cutoff_hours h, booking_window_days w, time_zone z FROM site_settings WHERE id='current'")
    .get();
  line(`5b) ajustes restaurados en BD: cutoff=${srow2.h} ventana=${srow2.w} zona=${srow2.z} (encontrados: ${ANTES.h}/${ANTES.w}/${ANTES.z})`);
  if (srow2.w !== ANTES.w || srow2.h !== ANTES.h || srow2.z !== ANTES.z) fails++;

  // 5c) el día vuelve a tener cupo (otra persona, contexto limpio)
  const v4 = await openAgendar();
  const revived = JSON.parse(
    await v4.js((iso) => {
      const d = iso.slice(8, 10);
      const b = [...document.querySelectorAll('[role="grid"] button')].find((x) =>
        x.textContent.trim().startsWith(d),
      );
      if (!b) return JSON.stringify({ found: false });
      return JSON.stringify({ found: true, disabled: b.disabled || b.getAttribute("aria-disabled") === "true" });
    }, dayIso),
  );
  line(`5c) día ${dayIso} tras borrar el bloqueo: ${JSON.stringify(revived)} (esperado enabled)`);
  if (!revived.found || revived.disabled) fails++;
  await v4.ctx.close();

  await admin.ctx.close();

  line(`\nRESULTADO: ${fails === 0 ? "✔ TODAS las verificaciones R4-B-3 pasaron" : "✘ " + fails + " fallaron"}`);
} catch (e) {
  console.error("FATAL:", e.message);
  if (browser) await browser.close();
  const { writeFileSync } = await import("node:fs");
  writeFileSync("/tmp/opencode/flow-verify-r4b3.txt", log.join("\n") + `\nFATAL: ${e.message}\n`, "utf8");
  process.exit(1);
}
const { writeFileSync } = await import("node:fs");
writeFileSync("/tmp/opencode/flow-verify-r4b3.txt", log.join("\n"), "utf8");
await browser.close();
