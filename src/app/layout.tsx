import type { Metadata } from "next";
import { Baloo_2, JetBrains_Mono, Manrope } from "next/font/google";

import "./globals.css";

/**
 * Fonts are loaded through next/font, not a CSS @import to Google.
 *
 * An @import inside a stylesheet blocks rendering while the browser makes a
 * round trip to a third party, and the text jumps when the real font finally
 * lands. next/font downloads the files at build time, serves them from our own
 * domain, and reserves the right space in advance. It also means one fewer
 * outside party watching our visitors.
 */
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  // `template` names every future page automatically: a page that sets
  // title 'Ristoranti' becomes 'Ristoranti · RistoApp' in the browser tab.
  title: {
    default: "RistoApp — un tavolo, anche all'ultimo minuto",
    template: "%s · RistoApp",
  },
  description:
    "Scegli il tavolo che ti piace sulla piantina del locale, prenoti in un tocco e paghi dal telefono. I ristoranti migliori, vicino a te.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${baloo.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
