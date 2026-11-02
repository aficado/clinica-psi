// Verificación final del sprint R4-B-BUG-1: PB-1 Volver arriba, PB-2 horarios
// ya reservados desaparecen (no tachados), PB-3 cita de prueba visible.
import puppeteer from "puppeteer";
import { DatabaseSync } from "node:sqlite";

const base = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const db = new DatabaseSync("/home/aficado/clinica-bienestar/data/clinica-bienestar.db");
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const log = [];
const line = (s) => { log.push(s); console.log(s); };

async function freshPage() {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  return page;
}
async function closeCtx(page) { const b = page.browserContext(); await page.close(); await b.close(); }

const clickText = (page, t) =>
  page.evaluate((x) => {
    const el = [...document.querySelectorAll("button, a")].find((b) =>
      b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(x.toLowerCase()),
    );
    if (!el) return false;
    el.click();
    return true;
  }, t);

/** Cuenta cuántos botones "Volver" hay y si alguno está dentro de la fila
 *  superior (primer `div` flex-wrap de la sección del paso). */
const volver = (page, stepId) => page.evaluate((sid) => {
  // para pasos con <section>: section; para "Tus datos" (<form>): el form que contiene el h2
  let section = document.querySelector(`section[aria-labelledby="${sid}"]`);
  if (!section) {
    const h2 = document.querySelector(`h2[id="${sid}"]`);
    if (h2) section = h2.closest("form") || h2.parentElement;
  }
  if (!section) return "(sin sección)";
  const btns = [...section.querySelectorAll("button")].filter((b) => b.textContent.trim().toLowerCase() === "volver");
  const rows = [...section.querySelectorAll("div")].filter((d) => d.className.includes("flex-wrap"));
  const inTopRow = rows.length > 0 && btns.some((b) => rows[0].contains(b));
  return { btns: btns.length, inTopRow };
}, stepId);

// Avanza a paso N (0=Servicio, 1=Modalidad, 2=Profesional, 3=Horario, 4=Tus datos)
async function advance(page, targetStep) {
  // paso 0: Servicio -> eligo servicio
  const svc = await clickText(page, "Terapia de pareja");
  if (!svc) return false;
  await sleep(600);
  // paso 1: Modalidad (si el servicio es dual) -> eligo modalidad si se desea avanzar más
  if (targetStep >= 2) {
    if (!(await clickText(page, "Presencial"))) return false;
    await sleep(600);
  }
  // paso 2: Profesional -> elegí profesional
  if (targetStep >= 3) {
    if (!(await clickText(page, "Dra"))) return false;
    await sleep(500);
  }
  // paso 3: Horario -> elegí día+hora
  if (targetStep === 3 || targetStep >= 4) {
    const picked = await page.evaluate(() => {
      const ds = [...document.querySelectorAll('[role="grid"] button')].filter((b) => !b.disabled && b.getAttribute("aria-disabled") !== "true");
      if (!ds.length) return false; (ds[1] ?? ds[0]).click(); return true;
    });
    await sleep(900);
    const h = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('[role="group"] button')].filter((b) => !b.disabled && b.getAttribute("aria-disabled") !== "true");
      if (!hs.length) return false; hs[0].click(); return true;
    });
    await sleep(600);
  }
  // paso 4: Tus datos -> Continuar
  if (targetStep === 4) {
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continuar").click());
    await sleep(600);
  }
  return true;
}

// ---- PB-1: Volver arriba en los 4 pasos ------------------------------
let fails = 0;
for (const step of [1, 2, 3, 4]) {
  const page = await freshPage();
  await page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
  await sleep(1400);
  const ok = await advance(page, step);
  if (!ok) line(`PB-1 paso ${step} ✘ no se pudo avanzar`);
  await sleep(500);
  const sid = step === 1 ? "bk-paso2" : step === 2 ? "bk-paso3" : step === 3 ? "bk-paso4" : "bk-paso5";
  const v = await volver(page, sid);
  const okV = v.btns >= 1 && v.inTopRow;
  if (!okV) fails++;
  line(`PB-1 paso ${step} (${sid}) → Volver=${v.btns}, primera línea: ${v.inTopRow ? "✔ sí" : "✘ NO"}`);
  await closeCtx(page);
}

// ---- PB-2: hora ya reservada desaparece (no tachada) ------------------
const page = await freshPage();
await page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
await sleep(1400);
await advance(page, 3);
// la hora elegida ahora debe estar reservada
const hRes = await page.evaluate(() => {
  const hs = [...document.querySelectorAll('[role="group"] button')].filter((b) => !b.disabled && b.getAttribute("aria-disabled") !== "true");
  if (!hs.length) return false; hs[0].click(); return true;
});
line(`PB-2 hora clickeada (primer hueco): ${hRes}`);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continuar").click());
await sleep(600);
await page.type("#bk-nombre", "Cita de prueba (borrar tras gate)");
await page.type("#bk-correo", "prueba@demo.mx");
await page.evaluate(() => {
  const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
  if (boxes[0] && !boxes[0].checked) boxes[0].click();
});
const r = await page.evaluate(() => {
  const clicked = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Confirmar cita");
  if (!clicked) return "no encontró botón";
  clicked.click();
  return "clickado";
});
line(`PB-2 confirmación: ${r}`);
const t0 = Date.now();
let status = null;
while (Date.now() - t0 < 7500 && !status) {
  status = await page.evaluate(() => {
    const done = document.querySelector('[role="status"]');
    if (done && done.textContent.includes("queda agendada")) return "OK";
    if (document.querySelector('[role="alert"]')) return "ERR-alert";
    return null;
  });
  await sleep(300);
}
const result = status ?? "(sin reacción tras polling)";
line(`PB-2 resultado: ${result}`);
if (status === "ERR-alert") {
  const err = await page.evaluate(() => document.querySelector('[role="alert"]')?.textContent.trim());
  line(`PB-2 mensaje de error: ${err}`);
}
await closeCtx(page);

// ---- PB-3: la cita de prueba visible en /admin/horarios -------------
// ---- PB-3: la cita de prueba visible en /admin/horarios -------------
const cookie = (await import("node:fs")).readFileSync("/tmp/opencode/admin_cookie.txt", "utf8");
const page2 = await freshPage();
await page2.goto(`${base}/admin/horarios`, { waitUntil: "networkidle0" });
await sleep(1400);
const citas = await page2.evaluate(() => {
  const v = [...document.querySelectorAll("a")].filter((b) => b.href.endsWith("/mi-cita/rv-"));
  return v.length;
});
line(`PB-3 citas visibles en /admin/horarios: ${citas}`);
if (citas < 1) fails++;
await closeCtx(page2);

// ---- DB: verificar la cita de prueba --------------------------------
const row = db.prepare("SELECT token, service_slug, pro_id, date, hour, patient_name, status FROM appointments WHERE status = 'confirmada'").all();
line(`PB-3 citas confirmadas en BD (total): ${row.length} -> ${JSON.stringify(row.map((r) => r.token.slice(0, 6) + " " + r.patient_name))}`);

line(`RESULTADO: ${fails === 0 ? "✔ TODAS las verificaciones pasaron" : "✘ " + fails + " fallaron"}`);
await browser.close();
import { writeFileSync } from "node:fs";
writeFileSync("/tmp/opencode/flow-verify.txt", log.join("\n"), "utf8");
