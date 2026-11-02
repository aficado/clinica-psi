// Diagnóstico del detector de pantalla final tras un solo booking
import puppeteer from "puppeteer";
const base = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
page.on("console", (m) => console.log("[console." + m.type() + "]", m.text().slice(0, 250)));
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
await sleep(1300);

const clicked = (t) => page.evaluate((x) => {
  const el = [...document.querySelectorAll("button, a")].find((b) => b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(x.toLowerCase()));
  if (!el) return false; el.click(); return true;
}, t);

const chipNow = () => page.evaluate(() => document.querySelector('[aria-current="step"]')?.textContent.replace(/\s+/g, " ").trim() ?? "");

await clicked("Masaje terapéutico"); await sleep(900);
console.log("chip:", await chipNow());
await clicked("Dra"); await sleep(3000);
console.log("chip:", await chipNow());

const day = await page.evaluate(() => {
  const ds = [...document.querySelectorAll('[role="grid"] button')].filter((b) => !b.disabled && b.getAttribute("aria-disabled") !== "true");
  if (!ds.length) return null; (ds[1] ?? ds[0]).click(); return true;
});
await sleep(1000);
const hour = await page.evaluate(() => {
  const hs = [...document.querySelectorAll('[role="group"] button')].filter((b) => !b.disabled && b.getAttribute("aria-disabled") !== "true");
  if (!hs.length) return null; hs[0].click(); return true;
});
await sleep(1000);
console.log("día/hora:", day, hour, "| chip:", await chipNow());
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continuar").click());
await sleep(900);
console.log("chip tras Continuar:", await chipNow());

await page.type("#bk-nombre", "Persona Diag");
await page.type("#bk-correo", "diag@test.mx");
await page.evaluate(() => {
  const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
  if (boxes[0] && !boxes[0].checked) boxes[0].click();
});
await sleep(400);

await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Confirmar cita").click());

// polls: registrar qué se ve cada 500 ms hasta 6 s
for (let k = 0; k < 12; k++) {
  await sleep(500);
  const view = await page.evaluate(() => {
    const roles = [...document.querySelectorAll("[role=status], [role=alert]")].map((e) => ({ role: e.getAttribute("role"), txt: e.textContent.replace(/\s+/g, " ").trim().slice(0, 90) }));
    const chips = document.querySelector('[aria-current="step"]')?.textContent.replace(/\s+/g, " ").trim() ?? "(sin chip)";
    const buttons = [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).slice(-6);
    return { chips, roles, buttons };
  });
  console.log(`${(k + 1) * 0.5}s:`, JSON.stringify(view));
  if (view.roles.some((r) => r.txt.includes("agendada")) || view.roles.some((r) => r.role === "alert")) break;
}
await browser.close();
