import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme-context";
import { Header } from "@/components/Layout/Header";

export const metadata: Metadata = {
  title: "TypeFlow",
  description: "A fast, feature-complete typing test with accounts, leaderboards, and live multiplayer races.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-bg text-text">
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="max-w-5xl mx-auto px-6 py-12">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
