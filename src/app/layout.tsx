import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

/*
  Inter carries all functional UI (DESIGN.md §3).
  Cormorant Garamond stands in for Reckless, which is a commercial licence —
  swap the variable here if the licence is acquired.
  Devanagari is not covered by either; Noto Sans Devanagari is added when the
  translation decision lands (DESIGN.md open decision 4).
*/
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgriGrowth — Connect. Cultivate. Thrive.",
  description:
    "Digital agricultural contract platform connecting buyers, landowners and workers.",
};

export const viewport: Viewport = {
  themeColor: "#07503f",
  width: "device-width",
  initialScale: 1,
  // Field users need to be able to zoom. Never lock this down.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
