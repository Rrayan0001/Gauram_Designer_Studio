import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

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
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full flex flex-col md:flex-row antialiased font-sans" suppressHydrationWarning>
        <ToastProvider>
          <Sidebar />
          <main id="main" tabIndex={-1} className="flex-grow overflow-auto bg-paper min-h-screen outline-none flex flex-col">
            <div className="p-4 md:p-8 pb-24 md:pb-8 print-container flex-1">
              {children}
            </div>
            <footer className="no-print text-center text-[11px] text-ink-400 py-4 border-t border-ink-100 select-none bg-white/20">
              <p>Developed by <a href="https://kreosoftwares.in" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline font-semibold">Kreo Software</a></p>
            </footer>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
