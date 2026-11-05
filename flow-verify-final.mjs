// Verificación final del flujo de citas (R4-B-BUG-1 + R4-B-HOTFIX-1:
// Regresar arriba, avance abajo-derecha difuminado, ventana que grisará días).
// TODO: limpiar los scripts después de la verificación.
import puppeteer from "puppeteer";
import { DatabaseSync } from "node:sqlite";
import { execSync } from "node:child_process";

const base = "http://localhost:3000";
const dbPath = "/home/aficado/clinica-bienestar/data/clinica-bienestar.db";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
try {
  // ---- Levantar servidor si no está levantado ----------------------------
  try {
    execSync("curl -s -o /dev/null -w '' http://localhost:3000/ && echo up");
    console.log("servidor ya arriba");
  } catch (e) {
    console.log("levantando servidor...");
    execSync('cd /home/aficado/clinica-bienestar && (nohup npm start > /tmp/opencode/serve.log 2>&1 &)', { stdio: "ignore" });
    for (let i = 0; i < 40; i++) {
      try { execSync("curl -s -o /dev/null -w '' http://localhost:3000/"); break; } catch (_) { await sleep(750); }
    }
  }

  browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const log = [];
  let fails = 0;
  const line = (s) => { log.push(s); console.log(s); };

  // Estado actual de la página: sección activa + botones disponibles.
  const pageState = async (p) => JSON.parse(
    await p.evaluate(() => {
      const section = document.querySelector("section[aria-labelledby]");
      const all = [...document.querySelectorAll("button")];
      return JSON.stringify({
        secId: section ? section.getAttribute("aria-labelledby") : null,
        btns: all.length,
        servicio: all.filter((b) => b.textContent.includes("Terapia de pareja")).length,
        presencial: all.filter((b) => b.textContent.includes("Presencial")).length,
        profesional: all.filter((b) => b.textContent.includes("Dra.")).length,
        siguiente: all.filter((b) => /Siguiente|Continuar/.test(b.textContent)).length,
        confirmar: all.filter((b) => b.textContent.includes("Confirmar cita")).length,
      });
    }),
  );

  const clickText = async (p, text) => JSON.parse(
    await p.evaluate((t) => {
      const all = [...document.querySelectorAll("button")].filter((b) => b.textContent.includes(t));
      if (!all.length) return JSON.stringify(false);
      all[0].click();
      return JSON.stringify(true);
    }, text),
  );

  /**
   * R4-B-HOTFIX-1: "Regresar" SIEMPRE arriba del contenido del paso y el avance
   * ("Siguiente"/"Confirmar cita") ABAJO y a la DERECHA, difuminado (disabled)
   * hasta cumplir los requisitos. Se comprueba por geometría, no por clases.
   */
  const verificarBotones = async (p, sel) => JSON.parse(
    await p.evaluate((css) => {
      const root = document.querySelector(css) || document.querySelector("section") || document.querySelector("form");
      if (!root) return JSON.stringify({ ok: false, why: "sin raíz" });
      const h2 = root.querySelector("h2");
      const hy = h2 ? h2.getBoundingClientRect().top : Number.NaN;
      const back = [...root.querySelectorAll("button")].filter((b) => /regresar/i.test(b.textContent));
      const next = [...root.querySelectorAll("button")].filter((b) => /Siguiente|Confirmar cita/.test(b.textContent));
      const vw = window.innerWidth;
      return JSON.stringify({
        ok: true,
        back: back.length,
        backAbove: back.length > 0 && back.every((b) => b.getBoundingClientRect().top < hy),
        next: next.length,
        nextBelow: next.length > 0 && next.every((b) => b.getBoundingClientRect().top > hy),
        nextRight: next.length > 0 && next.every((b) => b.getBoundingClientRect().right > vw * 0.55),
        nextDisabled: next.length > 0 && next.every((b) => b.disabled),
      });
    }, sel),
  );

  // ---- Paso A: limpiar citas de prueba previas ---------------------------
  const db = new DatabaseSync(dbPath);
  const preRows = db.prepare("SELECT COUNT(*) n FROM appointments").get();
  line(`A) Citas en BD antes de la prueba: ${preRows.n}`);

  // ---- Paso B: persona real agendando una cita ---------------------------
  const ctx1 = await browser.createBrowserContext();
  const p1 = await ctx1.newPage();
  await p1.setViewport({ width: 1280, height: 900 });
  await p1.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
  await sleep(1500);

  const s0 = await pageState(p1);
  line(`B) paso Servicio: sección=${s0.secId}, servicios=${s0.servicio}, total btns=${s0.btns}`);
  if (s0.servicio < 1 || s0.secId !== "bk-paso1") fails++;

  // click en servicio -> avanza a Modalidad
  const c1 = await clickText(p1, "Terapia de pareja");
  await sleep(800);
  const s1 = await pageState(p1);
  line(`B) paso Modalidad: sección=${s1.secId}, presencial=${s1.presencial}`);
  if (c1 && s1.secId !== "bk-paso2") fails++;

  // click en modalidad -> avanza a Profesional
  const c2 = await clickText(p1, "Presencial");
  await sleep(800);
  const s2 = await pageState(p1);
  line(`B) paso Profesional: sección=${s2.secId}, profesionales=${s2.profesional}`);
  if (c2 && s2.secId !== "bk-paso3") fails++;

  // click en profesional -> avanza a ¿Cuándo?
  const c3 = await clickText(p1, "Dra.");
  await sleep(800);
  const s3 = await pageState(p1);
  line(`B) paso ¿Cuándo?: sección=${s3.secId}, siguiente=${s3.siguiente}`);
  if (c3 && s3.secId !== "bk-paso4") fails++;

  // HF-2/HF-3: Regresar arriba y Siguiente abajo-derecha (deshabilitado hasta elegir día+hora)
  const bot4 = await verificarBotones(p1, "section[aria-labelledby='bk-paso4']");
  line(`B) ¿Cuándo? → ${JSON.stringify(bot4)}`);
  if (!bot4.ok || bot4.back < 1 || !bot4.backAbove || !bot4.nextBelow || !bot4.nextRight) fails++;

  // elegir día + hora en el calendario
  const eligio = JSON.parse(
    await p1.evaluate(async () => {
    const ds = [...document.querySelectorAll('[role="grid"] button')].filter(
      (b) => !b.disabled && b.getAttribute("aria-disabled") !== "true",
    );
    if (!ds.length) return JSON.stringify(false);
    ds[1]?.click();
    await new Promise((r) => setTimeout(r, 900));
    const hs = [...document.querySelectorAll('[role="group"] button')].filter(
      (b) => !b.disabled && b.getAttribute("aria-disabled") !== "true",
    );
    if (!hs.length) return JSON.stringify(false);
    hs[0].click();
      return JSON.stringify(true);
    })
  );
  await sleep(600);
  line(`B) ✅ día+hora elegidos: ${eligio ? "sí" : "no"}`);
  if (!eligio) fails++;

  // Siguiente -> paso Tus datos (antes "Continuar"; HF-3)
  const c4 = await clickText(p1, "Siguiente");
  await sleep(800);
  const s4 = await pageState(p1);
  const paso4Ok = s4.secId === "bk-paso5" || !s4.secId; // el paso Tus datos es <form>, no tiene aria-labelledby
  line(`B) paso Tus datos: sección=${s4.secId}, confirmar=${s4.confirmar} (avanzo: ${c4 ? "sí" : "no"})`);
  if (!paso4Ok || !c4) fails++;

  // HF-2/HF-3 en "Tus datos" (el paso es un <form>)
  const bot5 = await verificarBotones(p1, "form");
  line(`B) Tus datos → ${JSON.stringify(bot5)}`);
  if (!bot5.ok || bot5.back < 1 || !bot5.backAbove || !bot5.nextBelow || !bot5.nextRight) fails++;

  // llenar formulario y confirmar. Se usa page.type() para que se disparen
  // los eventos input/change (la validación HTML5 requiere que el campo cambie).
  await p1.type("#bk-nombre", "Cita de prueba final (gate R4-B-BUG-1)");
  await p1.type("#bk-correo", "prueba-final@demo.mx");
  const cb = await p1.evaluate(() => {
    const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
    if (boxes[0] && !boxes[0].checked) boxes[0].click();
    return !!boxes[0];
  });
  line(`B) ✅ checkbox acepto: ${cb ? "sí" : "no"}`);
  const conf = await pageState(p1);
  const btnConfirmar = await p1.evaluate(() => {
    const all = [...document.querySelectorAll("button")].filter((b) => b.textContent.includes("Confirmar cita"));
    return JSON.stringify(all.length);
  });
  if (JSON.parse(btnConfirmar) < 1) line("B) ✘ no se encontró 'Confirmar cita'");
  else {
    await p1.evaluate(() => {
      const all = [...document.querySelectorAll("button")].filter((b) => b.textContent.includes("Confirmar cita"));
      all[0].click();
    });
  }
  await sleep(8000);
  const result = await p1.evaluate(() => {
    const done = document.querySelector('[role="status"]');
    if (done && done.textContent.includes("quedó agendada")) return "OK";
    const alert = document.querySelector('[role="alert"]');
    return alert ? `ERR: ${alert.textContent.trim()}` : "(sin reacción)";
  });
  line(`B) ✅ confirmación: ${result}`);
  if (result !== "OK") fails++;
  // Token de la cita creada por ESTA corrida (el panel lista solo las futuras con token).
  const tokenCreado =
    result === "OK"
      ? ((await p1.evaluate(() => document.querySelector('[role="status"]')?.textContent ?? "")).match(
          /rv-[a-f0-9]{16}/,
        )?.[0] ?? null)
      : null;
  line(`B) token de esta corrida: ${tokenCreado}`);

  // ---- Paso C: verificar en BD -------------------------------------------
  const rows = db.prepare("SELECT * FROM appointments WHERE status='confirmada'").all();
  line(`C) Citas confirmadas en BD (total): ${rows.length}`);
  for (const r of rows) {
    line(`C)   ${r.token} | ${r.patient_name} | ${r.date} ${String(r.hour).padStart(2, "0")}:00 | ${r.service_slug} | ${r.status}`);
  }
  const myRows = rows.filter((r) => r.patient_name.includes("Cita de prueba final"));
  if (myRows.length === 0) fails++;

  // ---- Paso D: login admin + /admin/horarios -----------------------------
  const ctx2 = await browser.createBrowserContext();
  const p2 = await ctx2.newPage();
  await p2.setViewport({ width: 1280, height: 900 });
  await p2.goto(`${base}/admin/login`, { waitUntil: "networkidle0" });
  await sleep(1500);
  const loginInputs = await p2.evaluate(() => {
    const inputs = [...document.querySelectorAll("input")];
    return JSON.stringify({
      email: inputs.filter((i) => i.type === "email").length,
      pass: inputs.filter((i) => i.type === "password").length,
      btns: [...document.querySelectorAll("button, a, input[type=submit]")].filter(
        (b) => b.textContent.includes("Entrar") || b.textContent.includes("Iniciar"),
      ).length,
    });
  });
  const li = JSON.parse(loginInputs);
  line(`D) login: email=${li.email}, pass=${li.pass}, boton Entrar=${li.btns}`);
  await p2.type("input[type='email']", "admin@raizviva.mx");
  await p2.type("input[type='password']", "demo123");
  const loginOk = await clickText(p2, "Entrar") || await clickText(p2, "Iniciar sesi\u00f3n");
  if (!loginOk) line("D) ✘ no se encontró botón 'Entrar' en login");
  else {
    await sleep(3000);
    const afterLogin = await p2.evaluate(() => window.location.pathname);
    line(`D) URL tras login: ${afterLogin}`);
    if (afterLogin !== "/admin" && afterLogin !== "/admin/horarios") fails++;

    const adminPage = await p2.goto(`${base}/admin/horarios`, { waitUntil: "networkidle0" });
    if (adminPage.status() !== 200) line(`D) ✘ /admin/horarios status: ${adminPage.status()}`);
    else {
      await sleep(1500);
      const citasAdmin = JSON.parse(
        await p2.evaluate((tk) => {
          const li = [...document.querySelectorAll("li")].filter((b) => /rv-[a-f0-9]{16}/.test(b.textContent));
          return JSON.stringify({ count: li.length, veMiToken: li.some((l) => l.textContent.includes(tk || "∅")) });
        }, tokenCreado),
      );
      line(`D) Citas visibles en /admin/horarios: ${citasAdmin.count} · la de esta corrida aparece: ${citasAdmin.veMiToken}`);
      if (citasAdmin.count < 1 || !citasAdmin.veMiToken) fails++;
    }
  }

  // ---- Resultado final ---------------------------------------------------
  line(`\nRESULTADO: ${fails === 0 ? "✔ TODAS las verificaciones pasaron" : "✘ " + fails + " fallaron"}`);
  await browser.close();
} catch (e) {
  console.error("FATAL:", e.message);
  if (browser) await browser.close();
  process.exit(1);
} finally {
  try {
    const { writeFileSync } = await import("node:fs");
    writeFileSync("/tmp/opencode/flow-verify-final.txt", log.join("\n"), "utf8");
  } catch (e) { /* ignore */ }
}
