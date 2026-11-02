// Debug de caso A con traza completa
import puppeteer from "puppeteer";
const base = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
page.on("console", (m) => console.log("[console." + m.type() + "]", m.text().slice(0, 300)));
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
await sleep(1400);

const chip = () => page.evaluate(() => document.querySelector('[aria-current="step"]')?.textContent.replace(/\s+/g, " ").trim() ?? "?");
const clicked = async (l, t) => {
  const ok = await page.evaluate((x) => {
    const el = [...document.querySelectorAll("button, a")].find((b) => b.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(x.toLowerCase()));
    if (!el) return false; el.click(); return true;
  }, t);
  console.log(`[${l}] click "${t}":`, ok);
  return ok;
};

await clicked("svc", "Terapia de pareja"); await sleep(900);
console.log("chip:", await chip());
await clicked("mod", "Presencial"); await sleep(900);
console.log("chip:", await chip());
await clicked("pro", "Dra"); await sleep(3000);
console.log("chip:", await chip());

const day = await page.evaluate(() => {
  const days = [...document.querySelectorAll('[role="grid"] button')].filter((b) => !b.disabled && b.getAttribute("aria-disabled") !== "true");
  if (!days.length) return null;
  const pick = days[1] ?? days[0];
  pick.click();
  return { label: pick.getAttribute("aria-label"), pressed: pick.getAttribute("aria-pressed") };
});
console.log("día:", JSON.stringify(day)); await sleep(1000);

const hour = await page.evaluate(() => {
  const hs = [...document.querySelectorAll('[role="group"] button')].filter((b) => !b.disabled);
  if (!hs.length) return null;
  hs[0].click();
  return { t: hs[0].textContent.trim(), label: hs[0].getAttribute("aria-label") };
});
console.log("hora:", JSON.stringify(hour)); await sleep(1000);
console.log("chip tras hora:", await chip());
console.log("¿Continuar?:", await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "Continuar")));

await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continuar").click());
await sleep(900);
console.log("chip tras Continuar:", await chip());

// datos
await page.type("#bk-nombre", "Persona Debug A1");
await page.type("#bk-correo", "debug.a1@test.mx");
await page.type("#bk-tel", "55 0000 0000");
const consentState = await page.evaluate(() => {
  const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
  return boxes.map((b) => ({ checked: b.checked }));
});
console.log("checkboxes antes:", JSON.stringify(consentState));
await page.evaluate(() => {
  const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
  if (boxes[0] && !boxes[0].checked) boxes[0].click();
});
await sleep(400);
console.log("checkboxes tras click:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('input[type="checkbox"]')].map((b) => ({ checked: b.checked })))));

await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Confirmar cita").click());
await sleep(3500);
const res = await page.evaluate(() => ({
  alert: document.querySelector('[role="alert"]')?.textContent.trim() ?? null,
  status: document.querySelector('[role="status"]')?.textContent.replace(/\s+/g, " ").trim().slice(0, 120) ?? null,
  chip: document.querySelector('[aria-current="step"]')?.textContent ?? "(fin)",
}));
console.log("RESULTADO:", JSON.stringify(res));
await browser.close();
