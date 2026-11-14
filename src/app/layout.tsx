import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import LandingGate from "@/components/LandingGate";
import { AuthProvider } from "@/context/AuthContext";
import GwSnapshotRunner from "@/components/GwSnapshotRunner";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPL Deadline Day — Free Tools for Fantasy Premier League Managers",
  description: "Transfer planner, live scores, deadline reminders and GW history for Fantasy Premier League. Free FPL tool used by managers worldwide.",
  keywords: ["FPL tool", "Fantasy Premier League tool", "FPL transfer planner", "FPL deadline reminder", "best FPL app", "FPL live scores"],
  openGraph: {
    title: "FPL Deadline Day — Free Tools for Fantasy Premier League Managers",
    description: "Transfer planner, live scores, deadline reminders and GW history. Free FPL tool.",
    url: "https://www.fpldeadlineday.com",
    siteName: "FPL Deadline Day",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FPL Deadline Day",
    description: "Free transfer planner, deadline reminders and live scores for Fantasy Premier League managers.",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.fpldeadlineday.com/#website",
      name: "FPL Deadline Day",
      url: "https://www.fpldeadlineday.com",
      inLanguage: "en",
    },
    {
      "@type": "WebApplication",
      "@id": "https://www.fpldeadlineday.com/#app",
      name: "FPL Deadline Day",
      url: "https://www.fpldeadlineday.com",
      applicationCategory: "SportsApplication",
      operatingSystem: "Web",
      description:
        "Free web app for Fantasy Premier League (FPL) managers: live Premier League scores, transfer planner, deadline email reminders, player stats and gameweek history. No ads.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
      featureList: [
        "Live Premier League scores per gameweek",
        "FPL transfer planner with pitch view",
        "Gameweek deadline email reminders",
        "FPL player stats and scout tips",
        "Gameweek history",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint: hides the server-rendered landing page for connected visitors */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("fpl_team_id"))document.documentElement.classList.add("has-team")}catch(e){}` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-YP3CB75NB6" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-YP3CB75NB6');
        `}} />
      </head>
      <body className="min-h-full flex flex-col bg-[#0f1520] text-[#f0f0f0] overflow-x-hidden">
        <AuthProvider>
          <LandingGate>
            <GwSnapshotRunner />
            <TopBar />
            <main className="flex-1">{children}</main>
            <BottomNav />
          </LandingGate>
        </AuthProvider>
      </body>
    </html>
  );
}
