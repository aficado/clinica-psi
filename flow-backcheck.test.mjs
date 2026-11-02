// Confirmación del bug Volver en paso ¿Cuándo? (build actual, PRE-fix)
import puppeteer from "puppeteer";

const base = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
await sleep(1500);

const state = (label) =>
  page.evaluate((l) => {
    const cur = document.querySelector('[aria-current="step"]');
    const volver = [...document.querySelectorAll("button, a")].filter(
      (b) => b.textContent.replace(/\s+/g, " ").trim().toLowerCase() === "volver",
    ).length;
    return `${l} → step="${cur ? cur.textContent.trim() : "?"}" | botones Volver=${volver}`;
  }, label).then(console.log);

const click = async (t) => {
  const ok = await page.evaluate((x) => {
    const el = [...document.querySelectorAll("button, a")].find((b) =>
      b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(x.toLowerCase()),
    );
    if (!el) return false;
    el.click();
    return true;
  }, t);
  console.log(`click "${t}": ${ok}`);
  return ok;
};

await click("Terapia de pareja");
await sleep(700);
await click("Presencial");
await sleep(700);
await click("Dra");
await sleep(2500);
await state("EN PACO ¿Cuándo? SIN elegir fecha (persona quiere regresar)");

// persona intenta retroceder → no puede; gracias al breadcrumb no clicable
// y a "Volver" ausente. Evidencia generada.
const cal = await page.evaluate(() => !!document.querySelector('[role="grid"]'));
await state(`calendario presente=${cal} | intento de retroceso imposible`);

await browser.close();
