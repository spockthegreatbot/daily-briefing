import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Briefing — Ryojin Intelligence",
  description: "Daily market intelligence dashboard — crypto, macro, CT signals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased bg-[#080808]`}>
        {children}
      </body>
    </html>
  );
}
