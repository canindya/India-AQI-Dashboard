import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Shell from "@/components/layout/Shell";
import ThemeProvider from "@/components/layout/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqi.datacarta.in';

export const metadata: Metadata = {
  title: {
    default: 'India AQI Dashboard — Free, Verifiable Air Quality for 30+ Cities',
    template: '%s | India AQI Dashboard',
  },
  description:
    'Interactive dashboard showing daily, monthly and seasonal AQI for 30+ Indian cities. PM2.5, PM10, CO, NO₂, SO₂, O₃ tracked from 2022 onwards. Sources: Open-Meteo (CAMS-modeled), CPCB National AQI as authoritative reference.',
  keywords: [
    'India AQI', 'air quality India', 'AQI dashboard', 'PM2.5', 'PM10', 'CPCB',
    'Delhi AQI', 'Mumbai AQI', 'Bangalore AQI', 'Kolkata AQI', 'open data',
  ],
  authors: [{ name: 'Anindya Chakraborty' }],
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'India AQI Dashboard',
    title: 'India AQI Dashboard — Free, Verifiable Air Quality for 30+ Cities',
    description: 'Daily, monthly and seasonal AQI for 30+ Indian cities — sourced from Open-Meteo (CAMS) with CPCB cited as authoritative.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'India AQI Dashboard',
    description: 'Daily, monthly and seasonal AQI for 30+ Indian cities, free and verifiable.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://air-quality-api.open-meteo.com" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
