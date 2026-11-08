// Verificación R4-B-HOTFIX-1: la ventana grisa días fuera de rango + botones
// (Regresar arriba / Siguiente y Confirmar abajo-derecha, difuminados hasta
// cumplir requisitos). Deja la BD y los ajustes como los encontró.
import puppeteer from "puppeteer";
import { DatabaseSync } from "node:sqlite";
import { execSync } from "node:child_process";

const base = "http://localhost:3000";
const db = new DatabaseSync("/home/aficado/clinica-bienestar/data/clinica-bienestar.db");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let browser, fails = 0;
const log = [];
const line = (s) => { log.push(s); console.log(s); };

const apptIdsAntes = new Set(db.prepare("SELECT id FROM appointments").all().map((r) => r.id));
// Ventana que encontró la suite (el valor de la dueña): se restaura al final.
const VENTANA_ANTES = db.prepare("SELECT booking_window_days d FROM site_settings WHERE id='current'").get().d;

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
  const nuevo = async () => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1366, height: 950 });
    return { ctx, ...mk(page) };
  };

  // --- 0. admin: ventana = 15 días ------------------------------------------
  const ad = await nuevo();
  await ad.page.goto(`${base}/admin/login`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await ad.page.type("input[type='email']", "admin@raizviva.mx");
  await ad.page.type("input[type='password']", "demo123");
  await ad.clickBtn("Entrar");
  await sleep(2200);
  await ad.page.goto(`${base}/admin/ajustes`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await ad.js(() => {
    const nums = [...document.querySelectorAll('input[type="number"]')];
    const set = (el, val) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(val));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set(nums[1], 15); // booking_window_days
  });
  await ad.clickBtn("Guardar ajustes");
  await sleep(2500);
  const w = db.prepare("SELECT booking_window_days d FROM site_settings WHERE id='current'").get().d;
  line(`0) ventana en BD = ${w} (esperado 15)`);
  if (w !== 15) fails++;

  // --- 1. /agendar hasta ¿Cuándo? ------------------------------------------
  const v = await nuevo();
  await v.page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
  await sleep(1500);
  await v.clickBtn("Terapia de pareja");
  await sleep(700);
  await v.clickBtn("Presencial");
  await sleep(700);
  await v.clickBtn("Dra.");
  await sleep(1400);

  // HF-2/HF-3 antes de elegir nada: Regresar arriba, Siguiente abajo-derecha y DESACTIVADO
  const geo0 = JSON.parse(
    await v.js(() => {
      const root = document.querySelector("section[aria-labelledby='bk-paso4']");
      const hy = root.querySelector("h2").getBoundingClientRect().top;
      const back = [...root.querySelectorAll("button")].find((b) => /regresar/i.test(b.textContent));
      const next = [...root.querySelectorAll("button")].find((b) => /Siguiente/.test(b.textContent));
      const note = [...root.querySelectorAll('[role="note"]')].map((n) => n.textContent.trim())[0] ?? "";
      return JSON.stringify({
        back: !!back,
        backAboveH2: back ? back.getBoundingClientRect().top < hy : false,
        next: !!next,
        nextDisabled: next ? next.disabled : null,
        nextBelowH2: next ? next.getBoundingClientRect().top > hy : false,
        nextRightSide: next ? next.getBoundingClientRect().right > window.innerWidth * 0.55 : false,
        note,
      });
    }),
  );
  line(`1) sin elección: ${JSON.stringify(geo0)}`);
  if (!geo0.back || !geo0.backAboveH2 || !geo0.next || !geo0.nextDisabled || !geo0.nextBelowH2 || !geo0.nextRightSide)
    fails++;

  // HF-1: mes fuera de ventana (2 meses adelante) → todos los días grises
  for (let i = 0; i < 2; i++) {
    await v.js(() => document.querySelector('button[aria-label="Mes siguiente"]')?.click());
    await sleep(1300);
  }
  const win = JSON.parse(
    await v.js(() => {
      const bs = [...document.querySelectorAll('[role="grid"] button')];
      const enabled = bs.filter((b) => !b.disabled);
      const note = [...document.querySelectorAll('[role="note"]')].map((n) => n.textContent.replace(/\s+/g, " ").trim());
      return JSON.stringify({
        dias: bs.length,
        habilitados: enabled.length,
        nota: note.find((t) => /ventana de reserva/i.test(t)) ?? "",
        unTitulo: bs[5]?.getAttribute("title") ?? "",
      });
    }),
  );
  line(`2) mes fuera de ventana: días=${win.dias} habilitados=${win.habilitados} nota="${win.nota}"`);
  if (win.habilitados !== 0 || !/Puedes agendar hasta el/i.test(win.nota) || !/ventana/i.test(win.unTitulo)) fails++;

  // volver al mes actual y elegir día (clic = día + primera hora libre)
  for (let i = 0; i < 2; i++) {
    await v.js(() => document.querySelector('button[aria-label="Mes anterior"]')?.click());
    await sleep(1300);
  }
  const pick = JSON.parse(
    await v.js(() => {
      const b = [...document.querySelectorAll('[role="grid"] button')].find((x) => !x.disabled);
      if (!b) return JSON.stringify(null);
      b.click();
      return JSON.stringify(b.getAttribute("aria-label"));
    }),
  );
  await sleep(1200);
  line(`3) día elegido dentro de la ventana: ${pick}`);
  if (!pick) fails++;

  const geo1 = JSON.parse(
    await v.js(() => {
      const next = [...document.querySelectorAll("button")].find((b) => /Siguiente/.test(b.textContent));
      return JSON.stringify({ disabled: next ? next.disabled : null });
    }),
  );
  line(`4) Siguiente tras elegir día+hora: disabled=${geo1.disabled} (esperado false)`);
  if (geo1.disabled !== false) fails++;

  // --- 2. Tus datos: Confirmar desactivado hasta cumplir los campos ---------
  await v.clickBtn("Siguiente");
  await sleep(900);
  const form0 = JSON.parse(
    await v.js(() => {
      const root = document.querySelector("form");
      const hy = root.querySelector("h2").getBoundingClientRect().top;
      const back = [...root.querySelectorAll("button")].find((b) => /regresar/i.test(b.textContent));
      const c = [...root.querySelectorAll("button")].find((b) => /Confirmar cita/.test(b.textContent));
      const note = [...root.querySelectorAll('[role="note"]')].map((n) => n.textContent.trim())[0] ?? "";
      return JSON.stringify({
        backAboveH2: back ? back.getBoundingClientRect().top < hy : false,
        disabled: c?.disabled,
        right: c ? c.getBoundingClientRect().right > window.innerWidth * 0.55 : false,
        note,
      });
    }),
  );
  line(`5) Tus datos vacío: ${JSON.stringify(form0)}`);
  if (!form0.backAboveH2 || form0.disabled !== true || !form0.right || !/nombre/i.test(form0.note)) fails++;

  // nombre corto -> sigue desactivado
  await v.page.type("#bk-nombre", "Al");
  await sleep(400);
  const short = JSON.parse(
    await v.js(() => {
      const c = [...document.querySelectorAll("button")].find((b) => /Confirmar cita/.test(b.textContent));
      const note = [...document.querySelectorAll('[role="note"]')].map((n) => n.textContent.trim())[0] ?? "";
      return JSON.stringify({ disabled: c?.disabled, note });
    }),
  );
  line(`6) nombre de 2 letras: disabled=${short.disabled} nota="${short.note}"`);
  if (short.disabled !== true) fails++;

  // completar: nombre, correo, teléfono inválido -> desactivado (regla del servidor)
  await v.js(() => {
    const n = document.querySelector("#bk-nombre");
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(n, "Ana Prueba Hotfix");
    n.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await sleep(200);
  await v.page.type("#bk-correo", "ana@demo.mx");
  await v.page.type("#bk-tel", "123");
  await sleep(400);
  const badPhone = JSON.parse(
    await v.js(() => {
      const c = [...document.querySelectorAll("button")].find((b) => /Confirmar cita/.test(b.textContent));
      const note = [...document.querySelectorAll('[role="note"]')].map((n) => n.textContent.trim())[0] ?? "";
      return JSON.stringify({ disabled: c?.disabled, note });
    }),
  );
  line(`7) teléfono de 3 dígitos: disabled=${badPhone.disabled} nota="${badPhone.note}"`);
  if (badPhone.disabled !== true) fails++;

  // teléfono vacío + consentimiento -> habilitado
  await v.js(() => {
    const t = document.querySelector("#bk-tel");
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(t, "");
    t.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await sleep(300);
  const ok = JSON.parse(
    await v.js(() => {
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb && !cb.checked) cb.click();
      const c = [...document.querySelectorAll("button")].find((b) => /Confirmar cita/.test(b.textContent));
      return JSON.stringify({ disabled: c?.disabled });
    }),
  );
  line(`8) con consentimiento: disabled=${ok.disabled} (esperado false)`);
  if (ok.disabled !== false) fails++;

  await v.clickBtn("Confirmar cita");
  await sleep(6000);
  const created = JSON.parse(
    await v.js(() => {
      const done = document.querySelector('[role="status"]');
      return JSON.stringify(done && /quedó agendada/.test(done.textContent) ? done.textContent.match(/rv-[a-f0-9]{16}/)?.[0] ?? null : null);
    }),
  );
  line(`9) cita creada: ${created}`);
  if (!created) fails++;
  await v.ctx.close();

  // --- 3. restaurar ventana y limpiar la cita de prueba ---------------------
  await ad.page.goto(`${base}/admin/ajustes`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await ad.js((v) => {
    const nums = [...document.querySelectorAll('input[type="number"]')];
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(nums[1], String(v));
    nums[1].dispatchEvent(new Event("input", { bubbles: true }));
  }, VENTANA_ANTES);
  await ad.clickBtn("Guardar ajustes");
  await sleep(2200);
  const w2 = db.prepare("SELECT booking_window_days d FROM site_settings WHERE id='current'").get().d;
  const nuevos = db.prepare("SELECT id, token FROM appointments").all().filter((r) => !apptIdsAntes.has(r.id));
  for (const r of nuevos) db.prepare("DELETE FROM appointments WHERE id = ?").run(r.id);
  line(`10) ventana restaurada=${w2} (esperado ${VENTANA_ANTES}, la que encontró la suite); citas de prueba borradas=${nuevos.length}`);
  if (w2 !== VENTANA_ANTES || nuevos.length !== 1) fails++;
  await ad.ctx.close();

  line(`\nRESULTADO: ${fails === 0 ? "✔ TODAS las verificaciones del hotfix pasaron" : "✘ " + fails + " fallaron"}`);
} catch (e) {
  line(`FATAL: ${e.message}`);
  fails++;
} finally {
  if (browser) await browser.close();
  const { writeFileSync } = await import("node:fs");
  writeFileSync("/tmp/opencode/flow-verify-hotfix1.txt", log.join("\n"), "utf8");
}
process.exit(fails === 0 ? 0 : 1);
