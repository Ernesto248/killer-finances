import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";

const siteUrl = "https://killer-finances.leonardsolutions.dev";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KillerFinances - Panel Financiero",
    template: "%s - KillerFinances",
  },
  description:
    "Panel financiero para cuadres, wires, reventas y gastos. Hecho para remeseros y operadores de cambio.",
  applicationName: "KillerFinances",
  generator: "Next.js",
  keywords: [
    "KillerFinances",
    "panel financiero",
    "cuadres",
    "wires",
    "reventas",
    "remesas",
    "Zelle",
    "finanzas Cuba",
  ],
  authors: [{ name: "KillerFinances" }],
  creator: "KillerFinances",
  publisher: "KillerFinances",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: "KillerFinances",
    title: "KillerFinances - Panel Financiero",
    description:
      "Panel financiero para cuadres, wires, reventas y gastos. Hecho para remeseros y operadores de cambio.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "KillerFinances - Panel Financiero",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KillerFinances - Panel Financiero",
    description:
      "Panel financiero para cuadres, wires, reventas y gastos. Hecho para remeseros y operadores de cambio.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
