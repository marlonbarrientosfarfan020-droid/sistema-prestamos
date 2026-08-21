import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1e3a8a",
};

export const metadata: Metadata = {
  title: {
    default: "PréstamosPE — Financiamiento Rápido y Confiable en Perú",
    template: "%s | PréstamosPE",
  },
  description:
    "Sistema integral de préstamos en Soles (PEN). Solicita tu crédito en minutos, consulta tu estado y gestiona tus pagos de forma segura y transparente.",
  keywords: [
    "préstamos Perú",
    "crédito rápido",
    "préstamos en soles",
    "financiamiento personal",
    "PEN",
    "Yape",
    "Plin",
  ],
  authors: [{ name: "PréstamosPE" }],
  creator: "PréstamosPE",
  openGraph: {
    type: "website",
    locale: "es_PE",
    title: "PréstamosPE — Financiamiento Rápido en Perú",
    description: "Solicita tu préstamo en minutos. Proceso 100% digital, seguro y transparente.",
    siteName: "PréstamosPE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PE" className={`${inter.variable} ${outfit.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
