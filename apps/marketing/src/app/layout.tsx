import type { Metadata } from "next";
import * as React from "react";
import { Analytics } from "../components/Analytics";
import { SkipNav } from "../components/SkipNav";
import { ThemeProvider } from "../contexts/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phoenix Rooivalk - SAE Level 4 Autonomous Counter-Drone Defense",
  description:
    "Edge autonomy in RF-denied environments. Sub-200ms response time. SAE Level 4 autonomous counter-drone defense system for military and critical infrastructure protection.",
  keywords: [
    "counter-drone",
    "autonomous defense",
    "RF-denied",
    "edge computing",
    "SAE Level 4",
    "drone defense",
    "counter-UAS",
    "C-UAS",
    "military technology",
    "defense systems",
  ],
  authors: [{ name: "Phoenix Rooivalk" }],
  creator: "Phoenix Rooivalk",
  publisher: "Phoenix Rooivalk",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Phoenix Rooivalk - SAE Level 4 Autonomous Counter-Drone Defense",
    description:
      "Edge autonomy in RF-denied environments. Sub-200ms response time. SAE Level 4 autonomous counter-drone defense.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "",
    siteName: "Phoenix Rooivalk",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.svg",
        width: 800,
        height: 600,
        alt: "Phoenix Rooivalk - Autonomous Counter-Drone Defense System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Phoenix Rooivalk - SAE Level 4 Counter-Drone Defense",
    description:
      "Edge autonomy in RF-denied environments with sub-200ms response time.",
    images: ["/logo.svg"],
    creator: "@phoenixrooivalk",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Analytics />
        <SkipNav />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
