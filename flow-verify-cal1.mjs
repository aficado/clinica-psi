// Verificación R4-B-CAL-1: un profesional y un mes a la vez; bloqueo multi-pro
// por franja horaria; nota privada; horas inclusivas. Limpia lo que crea.
import puppeteer from "puppeteer";
import { DatabaseSync } from "node:sqlite";
import { execSync } from "node:child_process";

const db = new DatabaseSync("/home/aficado/clinica-bienestar/data/clinica-bienestar.db");
const base = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let browser;
let fails = 0;
const log = [];
const line = (s) => { log.push(s); console.log(s); };
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hoy = new Date();

try {
  try { execSync("curl -s -o /dev/null -w '' http://localhost:3000/"); } catch {
    execSync("cd /home/aficado/clinica-bienestar && (nohup npm start > /tmp/opencode/serve.log 2>&1 &)", { stdio: "ignore" });
    for (let i = 0; i < 40; i++) { try { execSync("curl -s -o /dev/null -w '' http://localhost:3000/"); break; } catch { await sleep(750); } }
  }
  browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const p = await browser.newPage();
  await p.setViewport({ width: 1366, height: 1000 });
  const js = (f, ...a) => p.evaluate(f, ...a);
  const click = (t) => js((x) => [...document.querySelectorAll("button")].find((b) => new RegExp(x).test(b.textContent))?.click(), t);

  await p.goto(`${base}/admin/login`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await p.type("input[type='email']", "admin@raizviva.mx");
  await p.type("input[type='password']", "demo123");
  await js(() => [...document.querySelectorAll("button")].find((b) => /Entrar/.test(b.textContent))?.click());
  await sleep(2500);

  // ---------- 1) Horarios: un profesional a la vez ----------
  await p.goto(`${base}/admin/horarios?tab=horarios`, { waitUntil: "networkidle0" });
  await sleep(1300);
  const h = JSON.parse(await js(() => JSON.stringify({
    selector: !!document.querySelector('select[aria-label="Profesional del horario semanal"]'),
    tarjetas: [...document.querySelectorAll("h2")].filter((x) => /Dra\.|Lic\./.test(x.textContent)).length,
    nombres: [...document.querySelectorAll("h2")].map((x) => x.textContent.trim()).filter((t) => /Dra\.|Lic\./.test(t)),
  })));
  line(`1) Horarios: selector=${h.selector} · tarjetas=${h.tarjetas} · ${JSON.stringify(h.nombres)}`);
  if (!h.selector || h.tarjetas !== 1) fails++;
  // cambiar de profesional con el selector
  await js(() => {
    const sel = document.querySelector('select[aria-label="Profesional del horario semanal"]');
    const opts = [...sel.options];
    const otro = opts[opts.length - 1];
    const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    proto.call(sel, otro.value);
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await sleep(800);
  const h2 = JSON.parse(await js(() => JSON.stringify({
    tarjetas: [...document.querySelectorAll("h2")].filter((x) => /Dra\.|Lic\./.test(x.textContent)).length,
    nombre: [...document.querySelectorAll("h2")].map((x) => x.textContent.trim()).find((t) => /Dra\.|Lic\./.test(t)) ?? null,
  })));
  line(`2) tras cambiar: tarjetas=${h2.tarjetas} · "${h2.nombre}"`);
  if (h2.tarjetas !== 1) fails++;

  // ---------- 2) Calendario: un mes a la vez + selector ----------
  await p.goto(`${base}/admin/horarios?tab=calendario`, { waitUntil: "networkidle0" });
  await sleep(1300);
  const cal = JSON.parse(await js(() => JSON.stringify({
    grids: document.querySelectorAll('[role="grid"]').length,
    mesSelect: !!document.querySelector('select[aria-label="Mes del calendario"]'),
    etiqueta: document.querySelector('[role="grid"]')?.getAttribute("aria-label") ?? null,
    ancho: Math.max(...[...document.querySelectorAll('[role="grid"]')].map((g) => g.getBoundingClientRect().width)),
  })));
  line(`3) Calendario: grids=${cal.grids} · mesSelect=${cal.mesSelect} · "${cal.etiqueta}" · ancho=${Math.round(cal.ancho)}px`);
  if (cal.grids !== 1 || !cal.mesSelect) fails++;
  await js(() => {
    const sel = document.querySelector('select[aria-label="Mes del calendario"]');
    const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    proto.call(sel, "12");
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await sleep(800);
  const etiquetaDic = await js(() => document.querySelector('[role="grid"]')?.getAttribute("aria-label") ?? "");
  line(`4) mes cambiado: "${etiquetaDic}"`);
  if (!/diciembre/i.test(etiquetaDic)) fails++;

  // ---------- 3) Bloqueo para 2 profesionales, franja 9–12, nota privada ----------
  // volver al mes actual y elegir un día futuro con cupo
  const mesActual = hoy.getMonth() + 1;
  await js((m) => {
    const sel = document.querySelector('select[aria-label="Mes del calendario"]');
    const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    proto.call(sel, String(m));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }, mesActual);
  await sleep(900);
  const hoyIso = isoOf(hoy);
  const target = await js((hoyIsoS) => {
    const b = [...document.querySelectorAll('[role="grid"] button')].find((x) => {
      const t = x.getAttribute("title") || "";
      const iso = t.slice(0, 10);
      return iso > hoyIsoS && /libres/.test(t);
    });
    if (!b) return null;
    b.click();
    return b.getAttribute("title").slice(0, 10);
  }, hoyIso);
  line(`5) día elegido: ${target}`);
  if (!target) { fails++; throw new Error("no hay día futuro con cupo en el mes actual"); }
  await sleep(900);

  // nombres de los dos primeros profesionales
  const pros = db.prepare("SELECT id, name FROM professionals WHERE deleted_at IS NULL AND active = 1 ORDER BY rowid LIMIT 2").all();
  const ids = pros.map((x) => x.id);
  const nombres = pros.map((x) => x.name);

  await js((nombres) => {
    const d = document.querySelector('[role="dialog"]');
    // marcar exactamente los dos primeros (el primero suele venir marcado)
    const checks = [...d.querySelectorAll('input[type="checkbox"]')].filter((c) => {
      const label = c.closest("label")?.textContent ?? "";
      return nombres.some((n) => label.includes(n));
    });
    for (const c of checks) if (!c.checked) c.click();
    // franja 9–12
    const radio = [...d.querySelectorAll('input[type="radio"]')].find((r) => /franja/i.test(r.closest("label")?.textContent ?? ""));
    if (radio && !radio.checked) radio.click();
    const setSel = (aria, v) => {
      const s = d.querySelector(`select[aria-label="${aria}"]`);
      if (!s) return;
      const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
      proto.call(s, String(v));
      s.dispatchEvent(new Event("change", { bubbles: true }));
    };
    setTimeout(() => setSel("Hora de inicio del bloqueo", 9), 150);
    setTimeout(() => setSel("Hora de fin del bloqueo", 12), 300);
    // motivo + nota
    const fest = [...d.querySelectorAll('button[role="radio"]')].find((b) => /Festivo/i.test(b.textContent));
    if (fest) fest.click();
    const note = d.querySelector('input[type="text"]');
    const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    proto.call(note, "PRUEBA-CAL1");
    note.dispatchEvent(new Event("input", { bubbles: true }));
  }, nombres);
  await sleep(900);
  await click("Bloquear el día");
  await sleep(2800);
  const rows = db.prepare("SELECT pro_id,start_hour,end_hour,note,date_from,date_to FROM date_exceptions WHERE note='PRUEBA-CAL1'").all();
  line(`6) BD tras bloquear: ${JSON.stringify(rows)}`);
  const okBlock =
    rows.length === 2 &&
    rows.every((r) => r.start_hour === 9 && r.end_hour === 12 && r.date_from === target && r.date_to === target) &&
    ids.every((id) => rows.some((r) => r.pro_id === id));
  if (!okBlock) fails++;

  // ---------- 4) Público: horas 9–12 cerradas, resto abierto; nota NO visible ----------
  const proId = ids[0];
  const svc = db.prepare("SELECT slug FROM services WHERE visible=1 ORDER BY position LIMIT 1").get().slug;
  const url = `${base}/agendar?service=${svc}&mode=presencial&pro=${proId}&dia=${target}`;
  const pv = await browser.createBrowserContext().then(async (c) => {
    const pp = await c.newPage();
    await pp.setViewport({ width: 1280, height: 900 });
    await pp.goto(url, { waitUntil: "networkidle0" });
    await sleep(2200);
    const out = await pp.evaluate((iso) => {
      // El calendario público no pone la fecha en el title: se busca por el número del día.
      const dia = String(Number(iso.slice(8, 10)));
      const cell = [...document.querySelectorAll('[role="grid"] button')].find((b) => b.textContent.trim() === dia && !b.disabled);
      const horas = [...document.querySelectorAll('[role="group"] button')].map((b) => b.textContent.trim());
      return JSON.stringify({ label: cell?.getAttribute("title") ?? "", horas, texto: document.body.innerText.includes("PRUEBA-CAL1") });
    }, target);
    await c.close();
    return JSON.parse(out);
  });
  line(`7) público: horas=${JSON.stringify(pv.horas)} · nota visible=${pv.texto} · label="${String(pv.label).slice(0, 60)}"`);
  const bloqueadas = ["9:00", "10:00", "11:00", "12:00"].filter((x) => !pv.horas.includes(x));
  const okPriv = !pv.texto;
  const okHoras = bloqueadas.length === 4 && pv.horas.includes("13:00");
  if (!okPriv || !okHoras) fails++;

  // ---------- 5) móvil: sin desbordes ----------
  await p.setViewport({ width: 390, height: 844 });
  await p.goto(`${base}/admin/horarios?tab=calendario`, { waitUntil: "networkidle0" });
  await sleep(1600);
  const m = JSON.parse(await p.evaluate(() => JSON.stringify({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    grid: !!document.querySelector('[role="grid"]'),
  })));
  await p.setViewport({ width: 1366, height: 1000 });
  line(`8) móvil (390): grid=${m.grid} · desborde=${m.overflow}`);
  if (!m.grid || m.overflow) fails++;

  // ---------- limpieza ----------
  db.prepare("DELETE FROM date_exceptions WHERE note='PRUEBA-CAL1'").run();
  line(`9) limpieza: bloqueos PRUEBA-CAL1 restantes=${db.prepare("SELECT COUNT(*) n FROM date_exceptions WHERE note='PRUEBA-CAL1'").get().n}`);

  line(`\nRESULTADO: ${fails === 0 ? "✔ TODAS las verificaciones R4-B-CAL-1 pasaron" : "✘ " + fails + " fallaron"}`);
} catch (e) {
  line(`FATAL: ${e.message}`);
  fails++;
} finally {
  if (browser) await browser.close();
  const { writeFileSync } = await import("node:fs");
  writeFileSync("/tmp/opencode/flow-verify-cal1.txt", log.join("\n"), "utf8");
}
process.exit(fails === 0 ? 0 : 1);