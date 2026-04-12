import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#02050a",
  width: "device-width",
  initialScale: 1,
  // viewport-fit=cover permite usar env(safe-area-inset-*) en CSS,
  // necesario para que el canvas no quede tapado por el notch/Dynamic Island.
  // NO bloqueamos el zoom del navegador: es una barrera de accesibilidad (WCAG 1.4.4).
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Cosmos Atlas",
  description: "Planetario interactivo 3D en tiempo real. Boveda celeste precisa con estrellas, planetas, constelaciones y la Via Lactea.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cosmos Atlas",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
