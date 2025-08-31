import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import SplashScreen from "@/components/SplashScreen";
import { ConvexClientProvider } from "../components/ConvexClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Most Valuable — E‑commerce",
  applicationName: "Most Valuable",
  description: "Timeless pieces for modern living. Join the waitlist.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Most Valuable — E‑commerce",
    description: "Timeless pieces for modern living. Join the waitlist.",
    url: "https://www.mostvaluableco.com/",
    siteName: "Most Valuable",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Most Valuable - Timeless pieces for modern living",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Most Valuable — E‑commerce",
    description: "Timeless pieces for modern living. Join the waitlist.",
    images: ["/thumbnail.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}>
        <ConvexClientProvider>
          <SplashScreen />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
