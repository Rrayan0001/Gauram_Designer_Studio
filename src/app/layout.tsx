import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-serif" });

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
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} h-full`} suppressHydrationWarning>
      <body className="h-full flex flex-col md:flex-row antialiased font-sans" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 overflow-auto bg-paper min-h-screen">
          <div className="p-4 md:p-8 print-container">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
