import type { Metadata, Viewport } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";
import React from "react";
import SplashScreen from "@/components/SplashScreen";
import { ConvexClientProvider } from "../components/ConvexClientProvider";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Most Valuable Official Store",
  applicationName: "Most Valuable",
  description: "Timeless pieces for modern living. Join the waitlist.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Most Valuable Official Store",
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
    title: "Most Valuable Official Store",
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
      <body className={`${oswald.variable} font-sans antialiased bg-white text-slate-900`}>
        <ConvexClientProvider>
          <SplashScreen />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
