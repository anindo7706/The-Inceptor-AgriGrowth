import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/*
  Plus Jakarta Sans carries headings and display; Inter carries UI and body
  (DESIGN.md §3). Both cover Latin well and are metrically compatible enough
  to sit together. Devanagari is covered by neither — Noto Sans Devanagari is
  added when the translation decision lands.
*/
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgriGrowth — Connect. Cultivate. Thrive.",
  description:
    "Digital agricultural contract platform connecting buyers, landowners and workers.",
};

export const viewport: Viewport = {
  themeColor: "#0a0f0b",
  width: "device-width",
  initialScale: 1,
  // Field users need to be able to zoom. Never lock this down.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
