import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme-context";
import { Header } from "@/components/Layout/Header";

// Self-hosted via next/font: no external Google Fonts request at runtime (faster,
// no layout shift, and it can't silently fail the way a CSS @import can).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TypeFlow",
  description: "A fast, feature-complete typing test with accounts, leaderboards, and live multiplayer races.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-bg text-text">
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
