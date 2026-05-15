import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

// Baloo 2: tipografía chunky redondeada, muy juguetona — ideal para
// contenido dirigido a niños. Múltiples pesos (400-800) para títulos
// fuertes y texto corrido. Subset latin = soporta español. Self-hosted
// por next/font: sin requests a Google en producción.
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Museo del Gato — Simon Says",
  description: "Kiosk game for Museo del Gato",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={baloo.variable}>
      <body className={`${baloo.className} h-screen w-screen overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
