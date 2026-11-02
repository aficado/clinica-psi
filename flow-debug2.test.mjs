// Debug de una reserva sola: imprime pasos, chips y resultado
import puppeteer from "puppeteer";
const base = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("[console.error]", m.text().slice(0, 200)); });
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
await sleep(1200);

const chip = () => page.evaluate(() => document.querySelector('[aria-current="step"]')?.textContent.replace(/\s+/g, " ").trim() ?? "?");
const clicked = async (t) => page.evaluate((x) => {
  const el = [...document.querySelectorAll("button, a")].find((b) => b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(x.toLowerCase()));
  if (!el) return false; el.click(); return true;
}, t);

console.log("chip inicial:", await chip());
console.log("svc clicked:", await clicked("Terapia de pareja")); await sleep(800);
console.log("chip:", await chip(), "| modalidad:", await clicked("Presencial")); await sleep(800);
console.log("chip:", await chip(), "| pro:", await clicked("Dra")); await sleep(2800);
console.log("chip:", await chip());

// día: botones de día con aria-labels
const dayBtns = await page.evaluate(() => [...document.querySelectorAll('[role="grid"] button')].map((b) => ({ label: b.getAttribute("aria-label"), disabled: b.disabled, ad: b.getAttribute("aria-disabled") })).slice(0, 10));
console.log("días:", JSON.stringify(dayBtns));
const dayRes = await page.evaluate(() => {
  const days = [...document.querySelectorAll('[role="grid"] button')].filter((b) => !b.disabled && b.getAttribute("aria-disabled") !== "true");
  if (!days.length) return null;
  const pick = days[1] ?? days[0];
  pick.click();
  return pick.getAttribute("aria-label");
});
console.log("día elegido:", dayRes); await sleep(900);

// horas
const hourBtns = await page.evaluate(() => [...document.querySelectorAll('[role="group"] button')].map((b) => ({ t: b.textContent.trim(), label: b.getAttribute("aria-label"), disabled: b.disabled, pressed: b.getAttribute("aria-pressed") })).slice(0, 10));
console.log("horas del día:", JSON.stringify(hourBtns));
const hourRes = await page.evaluate(() => {
  const hs = [...document.querySelectorAll('[role="group"] button')].filter((b) => !b.disabled);
  if (!hs.length) return null;
  hs[0].click();
  return hs[0].textContent.trim() + " | pressed=" + hs[0].getAttribute("aria-pressed");
});
console.log("hora elegida:", hourRes); await sleep(900);
console.log(" collegiate chip tras hora:", await chip());
const hayContinuar = await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "Continuar"));
console.log("¿Continuar visible?:", hayContinuar);
if (hayContinuar) {
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continuar").click());
  await sleep(700);
  console.log("chip tras Continuar:", await chip());
}
console.log("¿#bk-nombre presente?:", !!(await page.$("#bk-nombre")));
await browser.close();
