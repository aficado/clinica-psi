import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import "./animations.css";
import { SiteChrome } from "@/components/SiteChrome";
import { clinic } from "@/lib/data";
import { getNavItems, getSiteSettings } from "@/lib/content";
import { getThemeTokens, themeToCssVars } from "@/lib/themes";

// `variable` expone el stack de fuentes como variables CSS,
// consumidas por los tokens de Tailwind (@theme en globals.css).
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://raizviva.mx"), // TODO: dominio real
  title: {
    default: clinic.fullName,
    template: `%s · ${clinic.name}`,
  },
  description: clinic.tagline,
  openGraph: {
    title: clinic.fullName,
    description: clinic.tagline,
    type: "website",
    locale: "es_MX",
    // Imagen social 1200x630 generada con `node scripts/make-og.mjs` (7.04).
    images: ["/images/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: clinic.fullName,
    description: clinic.tagline,
    images: ["/images/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Tokens del tema guardados en la base de datos local (R3-B, 8.05).
  // Se inyectan como variables CSS en `:root` para aplicar la
  // apariencia en todo el sitio. Los colores cambian al vuelo; las
  // tipografías solo se aplican si están cargadas con next/font
  // (Fraunces/Inter); las curadas no disponibles degradan al defecto.
  const theme = getThemeTokens();
  // Menú de navegación y redes sociales leídos de la base de datos (8.11);
  // se editan desde /admin/menu y bajan por props al chrome del sitio.
  const nav = getNavItems();
  const social = getSiteSettings();
  const style = {
    ...themeToCssVars(theme),
    "--font-display": theme.font_display === "Fraunces" ? "var(--font-fraunces)" : theme.font_display,
    "--font-sans": theme.font_sans === "Inter" ? "var(--font-inter)" : theme.font_sans,
  } as React.CSSProperties;
  return (
    <html lang="es-MX" style={style}>
      {/* Marca `has-js` para que el fallback CSS (contenido visible sin
          JavaScript) se active solo si el script no se ejecuta. */}
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.classList.add('has-js')",
        }}
      />
      {/* Modo oscuro (8.14): aplica la clase `dark` antes del primer paint
          según `localStorage.rv_theme` o `prefers-color-scheme` (sin flash). */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{var t=localStorage.getItem('rv_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}",
        }}
      />
      <body className={`${fraunces.variable} ${inter.variable}`}>
        {/* Todo el chrome del sitio vive aquí dentro; `SiteChrome` decide
            en el cliente si renderizarlo (páginas públicas) o no, cuando
            la ruta es `/admin` (panel con su propio esqueleto). */}
        <SiteChrome nav={nav} social={social}>
          <main id="main" className="min-h-screen">
            {children}
          </main>
        </SiteChrome>
      </body>
    </html>
  );
}
