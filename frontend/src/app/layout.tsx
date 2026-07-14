import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "../lib/providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BreakingNews from "../components/BreakingNews";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rapid News India - Grassroots Regional & National News Agency",
  description: "Get real-time regional and national updates directly from India. Browse breaking feeds, local district corners, watch video broadcasts, and submit content tips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Providers>
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          <BreakingNews />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
