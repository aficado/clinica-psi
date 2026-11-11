// Verificación R4-B-UX-1: bloqueo por clic en el día, deshacer, partir rangos,
// previsualización "cómo lo ve el paciente". Limpia todo lo que crea.
import puppeteer from "puppeteer";
import { DatabaseSync } from "node:sqlite";
import { execSync } from "node:child_process";

const base = "http://localhost:3000";
const db = new DatabaseSync("/home/aficado/clinica-bienestar/data/clinica-bienestar.db");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let browser, fails = 0;
const log = [];
const line = (s) => { log.push(s); console.log(s); };

const pad = (n) => String(n).padStart(2, "0");
const isoIn = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

try {
  try {
    execSync("curl -s -o /dev/null -w '' http://localhost:3000/");
  } catch (e) {
    execSync("cd /home/aficado/clinica-bienestar && (nohup npm start > /tmp/opencode/serve.log 2>&1 &)", { stdio: "ignore" });
    for (let i = 0; i < 40; i++) {
      try { execSync("curl -s -o /dev/null -w '' http://localhost:3000/"); break; } catch (_) { await sleep(750); }
    }
  }
  browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });

  const mk = (page) => ({
    page,
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
  const setNative = (el, val) => {
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, String(val));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // --- login admin ---
  const ctx = await browser.createBrowserContext();
  const admin = mk(await ctx.newPage());
  await admin.page.setViewport({ width: 1500, height: 1000 });
  await admin.page.goto(`${base}/admin/login`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await admin.page.type("input[type='email']", "admin@raizviva.mx");
  await admin.page.type("input[type='password']", "demo123");
  await admin.clickBtn("Entrar");
  await sleep(2200);

  // Snapshot: la limpieza final solo borra los bloqueos creados POR ESTA ejecución.
  const beforeIds = new Set(db.prepare("SELECT id FROM date_exceptions").all().map((r) => r.id));
  const mineIds = () =>
    db.prepare("SELECT id FROM date_exceptions").all().map((r) => r.id).filter((id) => !beforeIds.has(id));

  // --- PB-1: un día con cupos, clic → panel → bloquear ---
  await admin.page.goto(`${base}/admin/horarios?tab=calendario`, { waitUntil: "networkidle0" });
  await sleep(1500);
  const target = await admin.js(() => {
    const today = new Date();
    const tIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const bs = [...document.querySelectorAll('[role="grid"] button')];
    for (const b of bs) {
      const title = b.getAttribute("title") || "";
      const iso = title.split(" ")[0];
      const m = /(\d+) libres/.exec(title);
      if (m && Number(m[1]) > 1 && iso > tIso) return iso;
    }
    return null;
  });
  line(`1) día objetivo (con cupos, futuro): ${target}`);
  if (!target) { fails++; throw new Error("no se encontró un día con cupos"); }

  await admin.js((iso) => {
    const b = [...document.querySelectorAll('[role="grid"] button')].find((x) => (x.getAttribute("title") || "").startsWith(iso));
    b.click();
  }, target);
  await sleep(1200);
  const panelOpen = await admin.js(() => {
    const d = document.querySelector('[role="dialog"]');
    return JSON.stringify({ open: !!d, text: d ? d.textContent.slice(0, 90) : "" });
  });
  line(`2) panel del día: ${panelOpen}`);
  if (!JSON.parse(panelOpen).open) fails++;

  await admin.js((iso) => {
    const d = document.querySelector('[role="dialog"]');
    const note = d.querySelector('input[type="text"]');
    const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    proto.call(note, "PRUEBA-UX1");
    note.dispatchEvent(new Event("input", { bubbles: true }));
    const fest = [...d.querySelectorAll('button[role="radio"]')].find((b) => /Festivo/i.test(b.textContent));
    if (fest) fest.click();
  }, target);
  await sleep(300);
  await admin.clickBtn("Bloquear el día");
  await sleep(3000);

  const banner1 = await admin.js(() => {
    const b = document.querySelector('[role="status"]');
    const link = b ? b.querySelector("a") : null;
    const undo = b ? [...b.querySelectorAll("button")].some((x) => /Deshacer/.test(x.textContent)) : false;
    return JSON.stringify({
      text: b ? b.textContent.replace(/\s+/g, " ").trim().slice(0, 130) : "",
      preview: link ? link.getAttribute("href") : null,
      undo,
    });
  });
  line(`3) banner: ${banner1}`);
  const b1 = JSON.parse(banner1);
  if (!/Día bloqueado/.test(b1.text) || !b1.undo || !/dia=/.test(b1.preview || "")) fails++;
  const dump1 = db.prepare("SELECT id,pro_id,date_from,date_to,kind,note,active FROM date_exceptions").all();
  line(`4) BD tras bloquear: ${JSON.stringify(dump1)}`);
  if (!dump1.some((r) => r.date_from === target && r.date_to === target && r.active === 1)) fails++;

  // casilla marcada en el calendario (sin recargar) + preview paciente
  const marked = await admin.js((iso) => {
    const b = [...document.querySelectorAll('[role="grid"] button')].find((x) => (x.getAttribute("title") || "").startsWith(iso));
    return JSON.stringify({ pressed: b?.getAttribute("aria-pressed"), title: b?.getAttribute("title") });
  }, target);
  const cell = JSON.parse(marked);
  line(`5) casilla: aria-pressed=${cell.pressed}, title="${cell.title}"`);
  if (cell.pressed !== "true" || !/Bloqueado/.test(cell.title)) fails++;

  // --- PB-3: la previsualización muestra el día bloqueado al paciente ---
  const pv = await browser.createBrowserContext().then(async (c) => {
    const p = await c.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(`${base}${b1.preview}`, { waitUntil: "networkidle0" });
    await sleep(2200);
    const info = await p.evaluate((iso) => {
      const step = document.querySelector('section[aria-labelledby]')?.getAttribute("aria-labelledby") ?? null;
      const monthHead = document.querySelector('[role="status"][aria-live]')?.textContent ?? "";
      const cell = [...document.querySelectorAll('[role="grid"] button')].find(
        (b) => b.textContent.trim().startsWith(iso.slice(8)),
      );
      return JSON.stringify({
        step,
        monthHead: monthHead.trim(),
        disabled: cell ? cell.disabled || cell.getAttribute("aria-disabled") === "true" : null,
        label: cell ? cell.getAttribute("aria-label") : null,
      });
    }, target);
    await c.close();
    return JSON.parse(info);
  });
  line(`6) preview paciente: paso=${pv.step} mes="${pv.monthHead}" día deshabilitado=${pv.disabled} label="${String(pv.label).slice(0, 90)}"`);
  if (
    pv.step !== "bk-paso4" ||
    !pv.monthHead.includes(target.slice(0, 4)) ||
    pv.disabled !== true ||
    !/Festivo|PRUEBA-UX1/.test(String(pv.label))
  )
    fails++;

  // --- PB-4: deshacer el bloqueo ---
  const undone = await admin.clickBtn("Deshacer");
  await sleep(3000);
  const exAfterUndo = db.prepare("SELECT COUNT(*) n FROM date_exceptions WHERE date_from=? AND date_to=?").get(target);
  const banner2 = await admin.js(() => document.querySelector('[role="status"]')?.textContent.replace(/\s+/g, " ").trim().slice(0, 90) ?? "");
  line(`7) clic Deshacer=${undone} → BD bloqueos del día=${exAfterUndo.n} → banner "${banner2}"`);
  if (!undone || exAfterUndo.n !== 0 || !/Deshecho/.test(banner2)) fails++;

  // --- PB-2: rango largo → liberar SOLO un día (partir) → deshacer ---
  const a = isoIn(40), mid = isoIn(43), b = isoIn(46);
  await admin.js(() => {
    const det = [...document.querySelectorAll("details summary")].find((s) => /rango/i.test(s.textContent));
    if (det) det.click();
  });
  await sleep(700);
  await admin.js((desde, hasta) => {
    const dates = [...document.querySelectorAll('input[type="date"]')];
    const sel = dates.length ? [...document.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "*")) : null;
    if (sel) {
      const dra = [...sel.options].find((o) => /Dra\./.test(o.textContent));
      const sp = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
      sp.call(sel, dra ? dra.value : "*");
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setNative(dates[0], desde);
    setNative(dates[1], hasta);
    const note = document.querySelector('input[type="text"][maxlength="200"]');
    if (note) setNative(note, "PRUEBA-UX1-RANGO");
    function setNative(el, val) {
      const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, String(val));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, a, b);
  await sleep(400);
  await admin.clickBtn("Bloquear el rango");
  await sleep(2500);
  const rango1 = db.prepare("SELECT id, date_from, date_to FROM date_exceptions WHERE note LIKE 'PRUEBA-UX1-RANGO%'").all();
  line(`8) rango creado (${a} → ${b}): ${JSON.stringify(rango1)}`);
  if (rango1.length !== 1 || rango1[0].date_from !== a || rango1[0].date_to !== b) fails++;

  // R4-B-CAL-1: el calendario muestra un mes a la vez → abrir el mes del día medio.
  await admin.js((iso) => {
    const sel = document.querySelector('select[aria-label="Mes del calendario"]');
    if (!sel) return;
    const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    proto.call(sel, String(Number(iso.slice(5, 7))));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }, mid);
  await sleep(1500);
  // el día del medio está dentro del rango: clic → "Liberar este día"
  await admin.js((iso) => {
    const b = [...document.querySelectorAll('[role="grid"] button')].find((x) => (x.getAttribute("title") || "").startsWith(iso));
    if (b) b.click();
  }, mid);
  await sleep(1200);
  const panelRango = await admin.js(() => {
    const d = document.querySelector('[role="dialog"]');
    if (!d) return JSON.stringify({ open: false });
    return JSON.stringify({
      open: true,
      hasRange: /rango/.test(d.textContent),
      freeBtn: [...d.querySelectorAll("button")].some((b) => /Liberar este día/i.test(b.textContent)),
    });
  });
  line(`9) panel del día en rango: ${panelRango}`);
  if (!JSON.parse(panelRango).freeBtn) fails++;

  await admin.clickBtn("Liberar este día");
  await sleep(3000);
  const partido = db
    .prepare("SELECT id, date_from, date_to FROM date_exceptions WHERE (date_from BETWEEN ? AND ?) OR (date_to BETWEEN ? AND ?) ORDER BY date_from")
    .all(a, b, a, b);
  line(`10) rango partido: ${JSON.stringify(partido)}`);
  const okSplit =
    partido.length === 2 &&
    partido[0].date_from === a && partido[0].date_to === isoIn(42) &&
    partido[1].date_from === isoIn(44) && partido[1].date_to === b;
  if (!okSplit) fails++;

  await admin.clickBtn("Deshacer");
  await sleep(3000);
  const restaurado = db
    .prepare("SELECT id, date_from, date_to FROM date_exceptions WHERE (date_from BETWEEN ? AND ?) OR (date_from=? OR date_to=?)")
    .all(a, b, a, b);
  line(`11) tras Deshacer (debe volver ${a}→${b} con el id original ${rango1[0].id}): ${JSON.stringify(restaurado)}`);
  const okUndoSplit =
    restaurado.length === 1 &&
    restaurado[0].id === rango1[0].id &&
    restaurado[0].date_from === a &&
    restaurado[0].date_to === b;
  if (!okUndoSplit) fails++;

  // --- limpieza ---
  await admin.page.goto(`${base}/admin/horarios?tab=calendario`, { waitUntil: "networkidle0" });
  await sleep(1400);
  for (let i = 0; i < 6; i++) {
    const has = await admin.js(() => {
      const li = [...document.querySelectorAll("li")].find((l) => /PRUEBA-UX1/.test(l.textContent));
      return JSON.stringify(!!li);
    });
    if (!JSON.parse(has)) break;
    // armar y confirmar el eliminado del bloqueo de prueba
    await admin.js(() => {
      const li = [...document.querySelectorAll("li")].find((l) => /PRUEBA-UX1/.test(l.textContent));
      const btn = [...li.querySelectorAll("button")].find((b) => /Eliminar/.test(b.textContent));
      if (btn) btn.click();
    });
    await sleep(500);
    await admin.clickBtn("Sí, eliminar");
    await sleep(1800);
  }
  const leftovers = mineIds();
  if (leftovers.length > 0) {
    line(`12a) barriendo restos de ESTA ejecución: ${JSON.stringify(leftovers)}`);
    const ins = db.prepare("DELETE FROM date_exceptions WHERE id = ?");
    for (const id of leftovers) ins.run(id);
  }
  const left = mineIds().length;
  line(`12) limpieza: bloqueos creados por la prueba restantes = ${left}`);
  if (left !== 0) fails++;

  line(`\nRESULTADO: ${fails === 0 ? "✔ TODAS las verificaciones R4-B-UX-1 pasaron" : "✘ " + fails + " fallaron"}`);
} catch (e) {
  console.error("FATAL:", e.message);
  fails++;
  line(`FATAL: ${e.message}`);
} finally {
  if (browser) await browser.close();
  const { writeFileSync } = await import("node:fs");
  writeFileSync("/tmp/opencode/flow-verify-ux1.txt", log.join("\n"), "utf8");
}
process.exit(fails === 0 ? 0 : 1);
