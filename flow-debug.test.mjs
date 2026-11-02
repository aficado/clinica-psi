// Debug: textos reales de botones por paso
import puppeteer from "puppeteer";

const base = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${base}/agendar`, { waitUntil: "networkidle0" });
await sleep(1500);

const dump = (label) =>
  page.evaluate((l) => {
    const texts = [...document.querySelectorAll("button, a")].map((b) => b.textContent.replace(/\s+/g, " ").trim());
    const cur = document.querySelector('[aria-current="step"]');
    return `${l}: step=${cur ? cur.textContent.trim() : "?"} | ${texts.slice(10, 45).join(" || ")}`;
  }, label).then((r) => console.log(r));

const clickBtnText = async (t) => {
  const ok = await page.evaluate((x) => {
    const el = [...document.querySelectorAll("button, a")].find((b) =>
      b.textContent.replace(/\s+/g, " ").trim().toLowerCase().startsWith(x.toLowerCase()),
    );
    if (!el) return false;
    el.click();
    return true;
  }, t);
  console.log(`click "${t}":`, ok);
};

await dump("paso 0");
await clickBtnText("Terapia individual");
await sleep(700);
await dump("tras servicio");
await clickBtnText("Presencial");
await sleep(700);
await dump("tras modalidad");
await clickBtnText("Dra");
await sleep(2500);
await dump("tras profesional");
await browser.close();
