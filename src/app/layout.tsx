import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1a1814",
};

export const metadata: Metadata = {
  title: "Gauram Designer Studio — Billing",
  description: "Boutique Billing & Invoice Management System",
  icons: {
    icon: "/logo-v2.png",
    apple: "/logo-v2.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full min-h-screen w-full antialiased font-sans bg-[#14120e]" suppressHydrationWarning>
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}
