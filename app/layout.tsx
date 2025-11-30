import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { OrganizationSchema } from "@/lib/seo/schema";

// Fuente para títulos
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Fuente para cuerpo de texto
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'),
  title: {
    default: "comoelmusguito - Terrarios Artesanales y Cursos Online",
    template: "%s | comoelmusguito",
  },
  description:
    "Descubre terrarios artesanales únicos y aprende a crear ecosistemas autosustentables con el Musguito. Cursos online, talleres presenciales y terrarios hechos a mano en Chile.",
  keywords: [
    "terrarios Chile",
    "terrarios artesanales",
    "curso terrarios online",
    "taller terrarios Santiago",
    "ecosistemas en frasco",
    "musgo terrarios",
    "comoelmusguito",
    "Tomás Barrera",
  ],
  authors: [{ name: "Tomás Barrera (comoelmusguito)" }],
  creator: "Tomás Barrera",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://comoelmusguito.com",
    siteName: "comoelmusguito",
    title: "comoelmusguito - Crea Vida en Cualquier Lugar",
    description:
      "Terrarios artesanales únicos y cursos para aprender a crear ecosistemas autosustentables.",
    images: [
      {
        url: "/og/home.jpg",
        width: 1200,
        height: 630,
        alt: "Terrarios artesanales comoelmusguito",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "comoelmusguito - Terrarios Artesanales",
    description: "Crea vida en cualquier lugar. Terrarios únicos y cursos online.",
    images: ["/og/home.jpg"],
    creator: "@comoelmusguito",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { Header, Footer } from "@/components/shared";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <OrganizationSchema />
      </head>
      <body className="antialiased">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
