import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SuaProva AI",
  description: "Correção automática de provas com IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto flex flex-col">
          {children}
        </div>
        <footer className="py-3 text-center text-xs font-medium text-slate-500 bg-white dark:bg-slate-950 border-t shrink-0 z-50">
          by projeto7 - versão 1.0
        </footer>
      </body>
    </html>
  );
}
