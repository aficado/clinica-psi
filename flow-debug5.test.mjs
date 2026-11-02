// Diagnóstico v5: recurso 404 + ruta mono-modal con reintentos y trazas
import puppeteer from "puppeteer";
const base = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();

page.on("response", (r) => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url().slice(0, 150)); });
page.on("requestfailed", (r) => console.log("REQ-FAIL", r.url().slice(0, 150)));

await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
await sleep(1400);

const chipNow = () => page.evaluate(() => document.querySelector('[aria-current="step"]')?.textContent.replace(/\s+/g, " ").trim() ?? "");
const clickText = (t) => page.evaluate((x) => {
  const el = [...document.querySelectorAll("button, a")].find((b) => b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(x.toLowerCase()));
  if (!el) return false; el.click(); return true;
}, t);

// paso mono-modal: Masaje → ¿Con quién?
console.log("click masaje:", await clickText("Masaje terapéutico"));
for (let k = 1; k <= 4; k++) {
  await sleep(500);
  console.log(`  ${k * 0.5}s chip:`, await chipNow());
}
const proBtns = await page.evaluate(() =>
  [...document.querySelectorAll("button")].filter((b) => /dra\.|lic\./i.test(b.textContent)).map((b) => b.textContent.replace(/\s+/g, " ").trim()),
).catch(() => []);
console.log("botones de pro:", JSON.stringify(proBtns));

console.log("click Dra:", await clickText("Dra"));
for (let k = 1; k <= 6; k++) {
  await sleep(600);
  const c = await chipNow();
  console.log(`  ${k * 0.6}s chip:`, c);
  if (c.includes("Horario")) break;
}
const canPlan = await page.evaluate(() => !!document.querySelector('[role="grid"]'));
console.log("grid:", canPlan);
await browser.close();
