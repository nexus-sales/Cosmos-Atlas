import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ThreeClockPatch from "@/components/ThreeClockPatch";
import CatalogLoader from "@/components/CatalogLoader";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

// La CSP usa un nonce nuevo y aleatorio en cada request (ver proxy.ts). Si esta
// pagina se sirve como HTML estatico (generado una vez en el build), el nonce
// horneado en las etiquetas <script> nunca coincide con el nonce de la cabecera
// CSP de cada visita real -- el navegador bloquea todos los scripts, siempre.
// Forzar renderizado dinamico genera un nonce fresco y consistente en cada
// request. Sin coste real aqui: toda la app es 'use client', no hay contenido
// server-side que perder al dejar de ser estatica.
export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente display para titulares/nombre de la app/titulos de seccion --
// no para cuerpo de texto (ese sigue siendo Geist Sans).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
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
  icons: {
    icon: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased digital-grit`}
      >
        <ServiceWorkerRegistration />
        <ThreeClockPatch />
        <CatalogLoader />
        {children}
      </body>
    </html>
  );
}
