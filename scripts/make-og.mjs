/**
 * Genera public/images/og.png (1200x630) para Open Graph (R3-C, 7.04).
 * Dibuja la marca en SVG y la rasteriza con sharp (usa las fuentes
 * DejaVu del sistema). Ejecutar: node scripts/make-og.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Paleta del tema por defecto (app/globals.css).
const INK = "#1f2a27";
const INK_SOFT = "#4c5b55";
const SAND = "#f5efe6";
const MIST = "#dce7e0";
const SAGE = "#3f5e52";
const SAGE_LIGHT = "#5b7a6b";
const TERRACOTTA = "#c97b5a";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${SAND}"/>
      <stop offset="1" stop-color="${MIST}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Halos decorativos -->
  <circle cx="1035" cy="115" r="210" fill="${SAGE}" opacity="0.08"/>
  <circle cx="150" cy="560" r="160" fill="${TERRACOTTA}" opacity="0.09"/>

  <!-- Marca de hoja (dos arcos) -->
  <g transform="translate(96,96) rotate(-18 60 60)">
    <path d="M0 120 C 0 40 40 0 120 0 C 120 80 80 120 0 120 Z" fill="${SAGE}"/>
    <path d="M18 102 C 50 78 78 50 102 18" stroke="${MIST}" stroke-width="9" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Bloque de texto -->
  <text x="96" y="330" font-family="DejaVu Serif" font-weight="bold" font-size="88" fill="${SAGE}">Raíz Viva</text>
  <text x="98" y="392" font-family="DejaVu Sans" font-size="30" fill="${INK}">Cuidado integral para tu cuerpo y tu mente</text>
  <text x="98" y="440" font-family="DejaVu Sans" font-size="24" fill="${INK_SOFT}">Terapia psicológica · Masajes · Medicina china · Nutrición</text>

  <!-- Línea divisoria y tag final -->
  <line x1="98" y1="478" x2="480" y2="478" stroke="${TERRACOTTA}" stroke-width="4" stroke-linecap="round"/>
  <text x="98" y="528" font-family="DejaVu Sans" font-size="22" fill="${SAGE_LIGHT}">Presencial y en línea · Ciudad de México</text>

  <!-- URL en la esquina -->
  <text x="1102" y="576" text-anchor="end" font-family="DejaVu Sans" font-size="24" fill="${INK_SOFT}">www.raizviva.mx</text>
</svg>`;

const out = path.join(root, "public", "images", "og.png");
mkdirSync(path.dirname(out), { recursive: true });

const png = await sharp(Buffer.from(svg), { density: 300 })
  .resize(1200, 630, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(out, png);
console.log(`og.png escrito: ${out} (${(png.length / 1024).toFixed(1)} KB, 1200x630)`);
