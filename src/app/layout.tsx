import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import LandingGate from "@/components/LandingGate";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPL Deadline Day",
  description: "Everything an FPL manager needs, in one place.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0f1520] text-[#f0f0f0] overflow-x-hidden">
        <LandingGate>
          <TopBar />
          <main className="flex-1">{children}</main>
          <BottomNav />
        </LandingGate>
      </body>
    </html>
  );
}
