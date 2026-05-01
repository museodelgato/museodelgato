import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Museo del Gato — Simon Says",
  description: "Kiosk game for Museo del Gato",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="h-screen w-screen overflow-hidden">{children}</body>
    </html>
  );
}
