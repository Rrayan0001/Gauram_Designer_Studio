import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-serif" });

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
    <html lang="en" className={`${inter.variable} ${cinzel.variable} h-full`}>
      <body className="h-full flex bg-white text-gray-900 antialiased font-sans">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50 min-h-screen">
          <div className="p-6 md:p-8 print-container">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
