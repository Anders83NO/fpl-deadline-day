"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
];

const TIMEZONES = [
  { value: "Europe/London", label: "London (GMT+0/+1)" },
  { value: "Europe/Stockholm", label: "Stockholm (GMT+1/+2)" },
  { value: "Europe/Oslo", label: "Oslo (GMT+1/+2)" },
  { value: "Europe/Copenhagen", label: "Copenhagen (GMT+1/+2)" },
  { value: "Europe/Helsinki", label: "Helsinki (GMT+2/+3)" },
  { value: "America/New_York", label: "New York (GMT-5/-4)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8/-7)" },
  { value: "Australia/Sydney", label: "Sydney (GMT+10/+11)" },
  { value: "Asia/Kolkata", label: "India (GMT+5:30)" },
  { value: "Africa/Lagos", label: "Lagos (GMT+1)" },
];


export default function SettingsPage() {
  const { user } = useAuth();
  const [fplId, setFplId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Europe/London");
  const [saved, setSaved] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [stats, setStats] = useState<{ totalUsers: number; newLast7: number; activeLast30: number; uniquePlanners: number; totalPlans: number; recentPlans: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const ADMIN_EMAIL = "andersstenbergw@gmail.com";

  async function loadStats() {
    if (!user) return;
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }

  async function sendReminder() {
    if (!user) return;
    setSendingReminder(true);
    setReminderStatus(null);
    try {
      const res = await fetch("/api/admin/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });
      const data = await res.json();
      if (data.success) {
        setReminderStatus(`✓ Sent to ${data.sent} users — ${data.gw}, ${data.hoursUntil}h until deadline`);
      } else {
        setReminderStatus(data.message ?? data.error ?? "Something went wrong");
      }
    } catch {
      setReminderStatus("Failed to send");
    } finally {
      setSendingReminder(false);
    }
  }

  useEffect(() => {
    const id = localStorage.getItem("fpl_team_id") ?? "";
    setFplId(id);
    setLanguage(localStorage.getItem("fpl_language") ?? "en");
    setTimezone(localStorage.getItem("fpl_timezone") ?? "Europe/London");

    // Load display name — default to FPL team name
    const savedName = localStorage.getItem("fpl_display_name");
    if (savedName) {
      setDisplayName(savedName);
    } else if (id) {
      fetch(`/api/fpl/team?id=${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.teamName) setDisplayName(data.teamName);
        })
        .catch(() => {});
    }
  }, []);

  function save() {
    const oldId = localStorage.getItem("fpl_team_id") ?? "";
    localStorage.setItem("fpl_team_id", fplId);
    localStorage.setItem("fpl_display_name", displayName);
    localStorage.setItem("fpl_language", language);
    localStorage.setItem("fpl_timezone", timezone);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // If team ID changed, fetch new team name and update display name
    if (fplId && fplId !== oldId) {
      fetch(`/api/fpl/team?id=${fplId}`)
        .then(r => r.json())
        .then(data => {
          if (data.teamName) {
            setDisplayName(data.teamName);
            localStorage.setItem("fpl_display_name", data.teamName);
          }
        })
        .catch(() => {});
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">

      <header className="mb-8">
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "#f59e0b" }}>Settings</p>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">Preferences</h1>
      </header>

      {/* Profile */}
      <Section title="Profile">
        <Field label="FPL Team ID">
          <input
            type="text"
            value={fplId}
            onChange={(e) => setFplId(e.target.value)}
            placeholder="e.g. 1213119"
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: "#1a1a1a", border: "1px solid #0f1520" }}
          />
          <p className="text-[10px] mt-1.5" style={{ color: "#4d6a88" }}>
            Find it in the URL on fantasy.premierleague.com
          </p>
        </Field>
        <Field label="Display name">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: "#1a1a1a", border: "1px solid #0f1520" }}
          />
        </Field>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <Field label="Language">
          <div className="grid grid-cols-1 gap-1.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                style={{
                  background: language === lang.code ? "#1a1500" : "#1a1a1a",
                  border: `1px solid ${language === lang.code ? "#f59e0b" : "#0f1520"}`,
                }}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium text-white">{lang.label}</span>
                {language === lang.code && (
                  <span className="ml-auto text-xs font-bold" style={{ color: "#f59e0b" }}>✓</span>
                )}
                {lang.code !== "en" && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "#1e2d42", color: "#4d6a88" }}>
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Timezone">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: "#1a1a1a", border: "1px solid #0f1520" }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </Field>

      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "#1a1a1a", border: "1px solid #0f1520" }}>
          <div>
            <p className="text-sm font-semibold text-white">Email reminders</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#6688aa" }}>Deadline reminder 24h before each GW</p>
          </div>
          {user ? (
            <span className="text-[10px] px-2 py-1 rounded font-semibold" style={{ background: "#0f2010", color: "#4ade80", border: "1px solid #1a4020" }}>
              Active
            </span>
          ) : (
            <span className="text-[10px] px-2 py-1 rounded font-semibold" style={{ background: "#1e2d42", color: "#6688aa", border: "1px solid #1e3050" }}>
              Sign in
            </span>
          )}
        </div>
      </Section>

      {/* Account */}
      <Section title="Account">
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #0f1520" }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: "#1a1a1a", borderBottom: "1px solid #222" }}>
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#6688aa" }}>Email</p>
              <p className="text-sm text-white mt-0.5">{user ? user.email : "Sign in to access"}</p>
            </div>
            {!user && (
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "#f59e0b22", color: "#f59e0b" }}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #0f1520" }}>
          {[
            { label: "Version", value: "0.1.0 (Beta)" },
            { label: "Give feedback", value: "→" },
            { label: "Privacy policy", value: "→" },
          ].map((item, i, arr) => (
            <div key={i} className="flex items-center justify-between px-4 py-3"
              style={{ background: "#1a1a1a", borderBottom: i < arr.length - 1 ? "1px solid #222" : "none" }}>
              <p className="text-sm text-white">{item.label}</p>
              <p className="text-sm" style={{ color: "#6688aa" }}>{item.value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Admin */}
      {user?.email === ADMIN_EMAIL && (
        <Section title="Admin">

          {/* Stats */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#1a1a1a", border: "1px solid #0f1520" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Statistics</p>
              <button
                onClick={loadStats}
                disabled={loadingStats}
                className="text-[11px] px-3 py-1 rounded-lg font-semibold"
                style={{ background: "#1e2d42", color: loadingStats ? "#3d5570" : "#f59e0b" }}
              >
                {loadingStats ? "Loading…" : stats ? "Refresh" : "Load stats"}
              </button>
            </div>

            {stats && (
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "#3d5570" }}>Users</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Total", value: stats.totalUsers },
                      { label: "New (7d)", value: stats.newLast7 },
                      { label: "Active (30d)", value: stats.activeLast30 },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ background: "#0f1520", border: "1px solid #1e2d42" }}>
                        <p className="text-xl font-bold text-white">{s.value}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: "#4d6a88" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "#3d5570" }}>GW Plans</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Total plans", value: stats.totalPlans },
                      { label: "Planners", value: stats.uniquePlanners },
                      { label: "Saved (7d)", value: stats.recentPlans },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ background: "#0f1520", border: "1px solid #1e2d42" }}>
                        <p className="text-xl font-bold text-white">{s.value}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: "#4d6a88" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Send reminder */}
          <div className="rounded-xl p-4" style={{ background: "#1a1a1a", border: "1px solid #0f1520" }}>
            <p className="text-sm font-semibold text-white mb-1">Send deadline reminder</p>
            <p className="text-[11px] mb-3" style={{ color: "#6688aa" }}>Sends email to all registered users now</p>
            <button
              onClick={sendReminder}
              disabled={sendingReminder}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: sendingReminder ? "#333" : "#f59e0b22", color: sendingReminder ? "#666" : "#f59e0b" }}
            >
              {sendingReminder ? "Sending…" : "Send now"}
            </button>
            {reminderStatus && (
              <p className="text-[11px] mt-2" style={{ color: "#4ade80" }}>{reminderStatus}</p>
            )}
          </div>
        </Section>
      )}

      {/* Save button */}
      <button
        onClick={save}
        className="w-full py-3 rounded-xl text-sm font-bold mt-2 transition-all"
        style={{ background: saved ? "#4ade80" : "#f59e0b", color: "#000" }}
      >
        {saved ? "✓ Saved!" : "Save changes"}
      </button>

      <div className="mt-8 pt-6 flex justify-center gap-6" style={{ borderTop: "1px solid #1e2d42" }}>
        <Link href="/about" className="text-xs" style={{ color: "#4d6a88" }}>About</Link>
        <span className="text-xs" style={{ color: "#2a3a4a" }}>·</span>
        <a href="mailto:hello@fpldeadlineday.com" className="text-xs" style={{ color: "#4d6a88" }}>Contact</a>
      </div>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: "#6688aa" }}>{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: "#888" }}>{label}</p>
      {children}
    </div>
  );
}
