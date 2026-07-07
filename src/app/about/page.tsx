import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | FPL Deadline Day — Free Fantasy Premier League Tool",
  description: "FPL Deadline Day is a free web app for Fantasy Premier League managers. Transfer planner, live gameweek scores, deadline reminders and GW history — everything in one place.",
  keywords: [
    "FPL tool", "best FPL app", "free FPL tool", "Fantasy Premier League tool",
    "FPL transfer planner", "FPL deadline reminder", "FPL live scores",
    "Fantasy Premier League tips", "FPL manager tool 2024", "FPL app free"
  ],
  openGraph: {
    title: "About FPL Deadline Day — Free Fantasy Premier League Tool",
    description: "Transfer planner, live scores, deadline reminders and GW history for FPL managers. Completely free.",
    url: "https://fpldeadlineday.com/about",
    siteName: "FPL Deadline Day",
    type: "website",
  },
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d={d} />
    </svg>
  );
}

const features = [
  {
    icon: <Icon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
    title: "Gameweek deadline reminders",
    description: "Never miss an FPL deadline again. Sign up to receive email reminders 24 hours and 2 hours before each gameweek deadline — in your local timezone.",
  },
  {
    icon: <Icon d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />,
    title: "FPL transfer planner",
    description: "Plan your Fantasy Premier League transfers before the deadline. See your full squad on a pitch view, search for players, and confirm transfers with live price data from the FPL API.",
  },
  {
    icon: <Icon d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18" />,
    title: "GW history",
    description: "FPL Deadline Day automatically saves your transfer plan, captain pick and chip strategy after each gameweek deadline. Review past decisions and learn from them.",
  },
  {
    icon: <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    title: "Live gameweek scores",
    description: "Follow live Fantasy Premier League scores during gameweeks. See matches grouped by date, track bonus points and check which of your players are playing.",
  },
  {
    icon: <Icon d="M11 3a8 8 0 1 0 0 16A8 8 0 0 0 11 3zM21 21l-4.35-4.35" />,
    title: "Player scout",
    description: "Discover the best FPL transfer targets. Filter players by position, team and form. See fixture difficulty ratings and expected points to make smarter transfer decisions.",
  },
  {
    icon: <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
    title: "My Team view",
    description: "See your current FPL squad at a glance. Check player prices, form and upcoming fixtures — all pulled directly from the official Fantasy Premier League API.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28">

      <header className="mb-8">
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "#f59e0b" }}>About</p>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">FPL Deadline Day</h1>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: "#8aaac8" }}>
          FPL Deadline Day is a free web app built for Fantasy Premier League managers who want to stay ahead of every gameweek deadline.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="text-base font-bold text-white mb-1">What is FPL Deadline Day?</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#8aaac8" }}>
          Fantasy Premier League (FPL) is the official fantasy football game of the Premier League, played by over 10 million managers worldwide. Each gameweek has a strict transfer deadline — miss it, and your changes don't count.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "#8aaac8" }}>
          FPL Deadline Day gives you the tools to plan transfers, track live scores and never miss a deadline — all for free, with no ads.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-white mb-4">Features</h2>
        <div className="space-y-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl p-4" style={{ background: "#141e2e", border: "1px solid #1e2d42" }}>
              <div className="flex items-start gap-3">
                {f.icon}
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#7799bb" }}>{f.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-white mb-2">Is FPL Deadline Day free?</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#8aaac8" }}>
          Yes — completely free. All features are available without payment. Creating an account unlocks deadline reminders, cross-device sync and GW history, but the core transfer planner works without signing in.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-white mb-2">How does it work?</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#8aaac8" }}>
          FPL Deadline Day connects to the official Fantasy Premier League API to fetch live player data, prices, fixtures and your team. No FPL login is required — just enter your FPL team ID (found in the URL on fantasy.premierleague.com) and you're ready to go.
        </p>
      </section>

      <div className="rounded-xl px-5 py-4 text-center" style={{ background: "#1a1500", border: "1px solid #f59e0b33" }}>
        <p className="text-sm font-bold text-white mb-1">Ready to get started?</p>
        <p className="text-xs mb-4" style={{ color: "#c8a84b" }}>Free forever. No credit card needed.</p>
        <Link href="/transfers" className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#f59e0b", color: "#000" }}>
          Open the transfer planner →
        </Link>
      </div>

    </div>
  );
}
