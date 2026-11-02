// ============================================================
// PRUEBAS DEL FLUJO DE AGENDADO — simulando una persona real
// Batería: 6 tipos de caso × 3 repeticiones. Transcript para
// el auditor del modelo en VRAM.
// Corrección v2: detector de resultado con polling + verificación
// de transición de paso + errores por run no abortan la batería.
// ============================================================
import puppeteer from "puppeteer";
import { DatabaseSync } from "node:sqlite";

const base = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const db = new DatabaseSync("/home/aficado/clinica-bienestar/data/clinica-bienestar.db");
const dbAppts = () => db.prepare("SELECT COUNT(*) n FROM appointments WHERE status = 'confirmada'").get().n;
const dbCancel = () => db.prepare("SELECT COUNT(*) n FROM appointments WHERE status = 'cancelada'").get().n;

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const log = [];
const line = (s) => { log.push(s); console.log(s); };
let fails = 0;

async function freshPage() {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  return page;
}
async function closeCtx(page) { const b = page.browserContext(); await page.close(); await b.close(); }

async function gotoBooking(page) {
  await page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
  await sleep(1300); // hidratación
}

const clickText = (page, t) =>
  page.evaluate((x) => {
    const el = [...document.querySelectorAll("button, a")].find((b) =>
      b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(x.toLowerCase()),
    );
    if (!el) return false;
    el.click();
    return true;
  }, t);

const chipText = (page) =>
  page.evaluate(() => {
    const c = document.querySelector('[aria-current="step"]');
    return c ? c.textContent.replace(/\s+/g, " ").trim() : "?";
  });

const volverCount = (page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll("button, a")].filter(
        (b) => b.textContent.replace(/\s+/g, " ").trim().toLowerCase() === "volver",
      ).length,
  );

/** Espera a que el paso-marcado cambie a `expect` (inclusión). */
async function awaitChip(page, expect, ms = 4000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const c = await chipText(page);
    if (c.includes(expect)) return true;
    await sleep(200);
  }
  return false;
}

const firstAvailableDay = (page) =>
  page.evaluate(() => {
    const days = [...document.querySelectorAll('[role="grid"] button')].filter(
      (b) => !b.disabled && b.getAttribute("aria-disabled") !== "true",
    );
    if (!days.length) return null;
    const pick = days[1] ?? days[0];
    const label = pick.getAttribute("aria-label") ?? pick.textContent.trim();
    pick.click();
    return label;
  });

const firstAvailableHour = (page) =>
  page.evaluate(() => {
    const hs = [...document.querySelectorAll('[role="group"] button')].filter(
      (b) => !b.disabled && b.getAttribute("aria-disabled") !== "true",
    );
    if (!hs.length) return null;
    const label = hs[0].getAttribute("aria-label") ?? hs[0].textContent.trim();
    hs[0].click();
    return label;
  });

async function pickFirstSlot(page, svcText, modeText, proText) {
  if (!(await clickText(page, svcText))) return { err: "no encontró el servicio " + svcText };
  if (!(await awaitChip(page, "Modalidad", 3000))) return { err: " la Modalidad no cargó tras servicio" };
  await sleep(400);
  if (modeText) {
    if (!(await clickText(page, modeText))) return { err: "no encontró la modalidad " + modeText };
  }
  if (!(await awaitChip(page, "Profesional", 3000))) return { err: "el ¿Con quién? no cargó" };
  await sleep(400);
  if (!(await clickText(page, proText))) return { err: "no encontró al profesional " + proText };
  await sleep(500);
  if (!(await awaitChip(page, "Horario", 5000))) return { err: "el ¿Cuándo? no cargó tras profesional" };
  await sleep(2000); // la disponibilidad es una server action
  if (!(await page.evaluate(() => !!document.querySelector('[role="grid"]'))))
    return { err: "el calendario no apareció" };
  const day = await firstAvailableDay(page); await sleep(900);
  if (!day) return { err: "sin días disponibles en el mes" };
  const hour = await firstAvailableHour(page); await sleep(800);
  if (!hour) return { err: "sin horas disponibles el día elegido" };
  if (!(await awaitChip(page, "Horario", 2000))) return { err: "perdió el paso tras elegir" };
  return { day, hour };
}

async function continuar(page) {
  const before = await chipText(page);
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continuar");
    if (c) c.click();
  });
  const ok = await awaitChip(page, "Tus datos", 4000);
  if (!ok) return { ok: false, err: `Continuar no avanzó (seguía "${before}")` };
  return { ok: true };
}

async function fillDatos(page, { name, email, phone, consent }) {
  await page.waitForSelector("#bk-nombre", { timeout: 5000 });
  await page.evaluate(() => {
    for (const id of ["bk-nombre", "bk-correo", "bk-tel"]) {
      const el = document.querySelector("#" + id);
      if (el) {
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        set.call(el, ""); el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  });
  await page.type("#bk-nombre", name);
  if (email) await page.type("#bk-correo", email);
  if (phone) await page.type("#bk-tel", phone);
  await page.evaluate((c) => {
    const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
    if (boxes[0] && boxes[0].checked !== c) boxes[0].click();
  }, consent);
  await sleep(350);
}

/** Confirma y hace POLLING del resultado (hasta ~7 s). */
async function confirmar(page) {
  const clicked = await clickText(page, "Confirmar cita");
  if (!clicked) return { res: "no encontró botón Confirmar cita", chip: "?" };
  const t0 = Date.now();
  let alert = null, status = null;
  while (Date.now() - t0 < 7000) {
    const r = await page.evaluate(() => ({
      alert: document.querySelector('[role="alert"]')?.textContent.replace(/\s+/g, " ").trim() ?? null,
      status: document.querySelector('[role="status"]')?.textContent.includes("queda agendada")
        ? (document.querySelector('[role="status"] .font-mono')?.textContent.trim() ?? "OK-sin-ref")
        : null,
    }));
    if (r.status) { status = r.status; break; }
    if (r.alert) { alert = r.alert; break; }
    await sleep(300);
  }
  return { res: status ? `OK token=${status}` : alert ? `ERR: ${alert}` : "sin reacción visible tras Confirmar", chip: await chipText(page) };
}

const tag = (ok) => (ok ? "-" : "✘");
const beforeAppts = dbAppts();

line("(Citas confirmadas en BD antes de la batería: " + beforeAppts + "; canceladas: " + dbCancel() + ")");

// --------- CASO A: reserva presencial completa ×3 --------
for (let i = 1; i <= 3; i++) {
  try {
    const page = await freshPage();
    await gotoBooking(page);
    const slot = await pickFirstSlot(page, "Terapia de pareja", "Presencial", i === 2 ? "Lic" : "Dra");
    if (slot.err) { fails++; line(`A✘${i} presencial → ✘ FALLO al llegar al hueco: ${slot.err}`); await closeCtx(page); continue; }
    const c = await continuar(page);
    if (!c.ok) { fails++; line(`A✘${i} presencial → ✘ ${c.err} (hueco: ${JSON.stringify(slot)})`); await closeCtx(page); continue; }
    await fillDatos(page, { name: `Persona Prueba A${i}`, email: `persona.a${i}@test.mx`, phone: `55 0000 000${i}`, consent: true });
    const { res } = await confirmar(page);
    const ok = res.startsWith("OK"); if (!ok) fails++;
    line(`A${tag(ok)}${i} presencial (Terapia de pareja, ${i===2?"Lic":"Dra"}) → ${ok ? "✔ confirmada" : "✘ " + res} | hueco: ${JSON.stringify(slot)}`);
    await closeCtx(page);
  } catch (e) { fails++; line(`A✘${i} presencial → ✘ CRASH: ${String(e).slice(0, 200)}`); }
}

// --------- CASO B: reserva en línea completa ×3 ----------
for (let i = 1; i <= 3; i++) {
  try {
    const page = await freshPage();
    await gotoBooking(page);
    const slot = await pickFirstSlot(page, "Nutrición y bienestar", "En línea", i === 3 ? "Lic" : "Dra");
    if (slot.err) { fails++; line(`B✘${i} en línea → ✘ FALLO al llegar al hueco: ${slot.err}`); await closeCtx(page); continue; }
    const c = await continuar(page);
    if (!c.ok) { fails++; line(`B✘${i} en línea → ✘ ${c.err} (hueco: ${JSON.stringify(slot)})`); await closeCtx(page); continue; }
    await fillDatos(page, { name: `Persona Prueba B${i}`, email: `persona.b${i}@test.mx`, consent: true });
    const { res } = await confirmar(page);
    const ok = res.startsWith("OK"); if (!ok) fails++;
    line(`B${tag(ok)}${i} en línea (Nutrición, ${i===3?"Lic":"Dra"}) → ${ok ? "✔ confirmada" : "✘ " + res} | hueco: ${JSON.stringify(slot)}`);
    await closeCtx(page);
  } catch (e) { fails++; line(`B✘${i} en línea → ✘ CRASH: ${String(e).slice(0, 200)}`); }
}

// --------- CASO C: retroceder en cada paso (Volver) ×3 ----------
for (let i = 1; i <= 3; i++) {
  try {
    const page = await freshPage();
    await gotoBooking(page);
    await clickText(page, "Terapia psicológica individual"); await sleep(800);
    const v1 = await volverCount(page);
    await clickText(page, "Volver"); await sleep(500);
    const back0 = await chipText(page);
    await clickText(page, "Masaje terapéutico"); await sleep(800); // solo presencial → salta a ¿Con quién?
    const jump = await chipText(page);
    const v2 = await volverCount(page);
    await clickText(page, "Volver"); await sleep(500);
    const back1 = await chipText(page);
    await clickText(page, "Presencial"); await sleep(800);
    await clickText(page, "Dra"); await sleep(500);
    const okChip = await awaitChip(page, "Horario", 6000); await sleep(2000);
    const v3 = await volverCount(page); // ★ fix de esta ronda: Volver SIN fecha elegida
    await clickText(page, "Volver"); await sleep(600);
    const back2 = await chipText(page);
    await clickText(page, "Dra"); await sleep(500);
    await awaitChip(page, "Horario", 6000); await sleep(2000);
    await firstAvailableDay(page); await sleep(900);
    await firstAvailableHour(page); await sleep(800);
    await continuar(page);
    const v4 = await volverCount(page);
    await clickText(page, "Volver"); await sleep(500);
    const back3 = await chipText(page);
    const okC = back0.includes("1.Servicio") && back1.includes("2.Modalidad") && back2.includes("3.Profesional") &&
      back3.includes("4.Horario") && v1 >= 1 && v2 >= 1 && v3 === 1 && v4 >= 1 && okChip;
    if (!okC) fails++;
    line(`C${tag(okC)}${i} retrocesos → Modalidad:Volver=${v1} → "${back0}" | masaje salta a "${jump}", Volver=${v2} → "${back1}" | ¿Cuándo? sin fecha: Volver=${v3} → "${back2}" | en Datos Volver=${v4} → "${back3}"`);
    await closeCtx(page);
  } catch (e) { fails++; line(`C✘${i} retrocesos → ✘ CRASH: ${String(e).slice(0, 200)}`); }
}

// --------- CASO D: recarga a mitad de flujo (cookie) ×3 ----------
for (let i = 1; i <= 3; i++) {
  try {
    const page = await freshPage();
    await gotoBooking(page);
    await clickText(page, i === 2 ? "Nutrición y bienestar" : "Terapia de pareja"); await sleep(800);
    await clickText(page, "Presencial"); await sleep(800);
    await clickText(page, "Dra"); await sleep(500);
    await awaitChip(page, "Horario", 6000); await sleep(2000);
    await firstAvailableDay(page); await sleep(900);
    await firstAvailableHour(page); await sleep(800);
    const antes = { chip: await chipText(page), volver: await volverCount(page) };
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(1800);
    const despues = { chip: await chipText(page), volver: await volverCount(page) };
    const tieneCal = await page.evaluate(() => !!document.querySelector('[role="grid"]'));
    const okD = antes.chip === despues.chip && tieneCal;
    if (!okD) fails++;
    line(`D${tag(okD)}${i} recarga a mitad → antes "${antes.chip}" (Volver=${antes.volver}) | tras recargar "${despues.chip}" (Volver=${despues.volver}, calendario=${tieneCal}) — ${antes.chip === despues.chip ? "el estado se restauró de la cookie" : "✘ PERDIÓ el estado"}`);
    await closeCtx(page);
  } catch (e) { fails++; line(`D✘${i} recarga → ✘ CRASH: ${String(e).slice(0, 200)}`); }
}

// --------- CASO E: dos personas peleando por el mismo hueco ×3 ----------
for (let i = 1; i <= 3; i++) {
  try {
    const pro = i === 3 ? "Lic" : "Dra";
    const p1 = await freshPage(); await gotoBooking(p1);
    const s1 = await pickFirstSlot(p1, "Terapia psicológica individual", "Presencial", pro);
    if (s1.err) { fails++; line(`E✘${i} carrera → ✘ P1 no llegó: ${s1.err}`); await closeCtx(p1); continue; }
    const c1 = await continuar(p1);
    if (!c1.ok) { fails++; line(`E✘${i} carrera → ✘ P1 ${c1.err}`); await closeCtx(p1); continue; }
    await fillDatos(p1, { name: `Primera Persona E${i}`, email: `persona.e${i}@test.mx`, consent: true });
    // persona 2 abre el flujo AHORA (mismo hueco aún libre)
    const p2 = await freshPage(); await gotoBooking(p2);
    const s2 = await pickFirstSlot(p2, "Terapia psicológica individual", "Presencial", pro);
    if (s2.err) { fails++; line(`E✘${i} carrera → ✘ P2 no llegó: ${s2.err}`); await closeCtx(p2); await closeCtx(p1); continue; }
    const c2 = await continuar(p2);
    if (!c2.ok) { fails++; line(`E✘${i} carrera → ✘ P2 ${c2.err}`); await closeCtx(p2); await closeCtx(p1); continue; }
    await fillDatos(p2, { name: `Segunda Persona E${i}`, email: `segunda.e${i}@test.mx`, consent: true });
    const mismoHueco = JSON.stringify(s1) === JSON.stringify(s2);
    const r1 = (await confirmar(p1)).res;
    const r2 = (await confirmar(p2)).res;
    const blocked = !r2.startsWith("OK");
    const okE = r1.startsWith("OK") && blocked;
    if (!okE) fails++;
    line(`E${tag(okE)}${i} carrera (${pro}, ${mismoHueco ? "ambas vieron el mismo hueco" : "✘ huescos distintos"}) → 1ª: ${r1.startsWith("OK") ? "✔" : "✘ " + r1} | 2ª (hueco ya ocupado): ${blocked ? "✔ rechazada: " + r2.replace("ERR: ", "") : "✘✘ ¡SE CONFIRMIÓ DOBLE!: " + r2}`);
    await closeCtx(p2); await closeCtx(p1);
  } catch (e) { fails++; line(`E✘${i} carrera → ✘ CRASH: ${String(e).slice(0, 200)}`); }
}

// --------- CASO F: validaciones del formulario ×3 ----------
for (let i = 1; i <= 3; i++) {
  try {
    const page = await freshPage();
    await gotoBooking(page);
    const slot = await pickFirstSlot(page, "Masaje terapéutico", null, i === 2 ? "Lic" : "Dra");
    if (slot.err) { fails++; line(`F✘${i} validaciones → ✘ FALLO al llegar al hueco: ${slot.err}`); await closeCtx(page); continue; }
    const c = await continuar(page);
    if (!c.ok) { fails++; line(`F✘${i} validaciones → ✘ ${c.err}`); await closeCtx(page); continue; }
    await fillDatos(page, { name: `Persona F${i}`, email: `persona.f${i}@test.mx`, consent: false });
    const r1 = (await confirmar(page)).res;
    await page.evaluate(() => {
      const e = document.querySelector("#bk-correo");
      if (e) {
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        set.call(e, ""); e.dispatchEvent(new Event("input", { bubbles: true }));
      }
      const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
      if (boxes[0] && !boxes[0].checked) boxes[0].click();
    });
    await sleep(350);
    const r2 = (await confirmar(page)).res;
    const okF = !r1.startsWith("OK") && !r2.startsWith("OK");
    if (!okF) fails++;
    line(`F${tag(okF)}${i} validaciones (Masaje, ${i===2?"Lic":"Dra"}) → sin consentimiento: ${r1.startsWith("OK") ? "✘✘ ¡SE CONFIRMIÓ SIN CONSENTIMIENTO!" : "✔ rechazada: " + r1.replace("ERR: ", "")} | sin correo (con consentimiento): ${r2.startsWith("OK") ? "✘✘ ¡SE CONFIRMIÓ SIN CORREO!" : "✔ rechazada: " + r2.replace("ERR: ", "")}`);
    await closeCtx(page);
  } catch (e) { fails++; line(`F✘${i} validaciones → ✘ CRASH: ${String(e).slice(0, 200)}`); }
}

line("(Citas en BD después de la batería: confirmadas " + dbAppts() + ", canceladas " + dbCancel() + ")");
line(`RESULTADO DE LA BATERÍA: ${fails === 0 ? "✔ TODOS los casos pasaron (18 ejecuciones)" : "✘ " + fails + " caso(s) fallaron"}`);

await browser.close();
const { writeFileSync } = await import("node:fs");
writeFileSync("/tmp/opencode/flow-transcript.txt", log.join("\n"), "utf8");
console.log("(transcript → /tmp/opencode/flow-transcript.txt)");
