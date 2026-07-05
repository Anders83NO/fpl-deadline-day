"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  onClose: () => void;
}

type AuthStep = "menu" | "login" | "signup" | "forgot" | "check-email";

export default function AuthModal({ onClose }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>("menu");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    onClose();
  }

  async function handleSignup() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep("check-email");
  }

  async function handleForgot() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep("check-email");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 pb-[calc(1.5rem+72px)] sm:pb-6"
        style={{ background: "#0f1520", border: "1px solid #1e3050" }}
      >
        {/* Menu */}
        {step === "menu" && (
          <>
            <h2 className="text-lg font-bold text-white mb-1">Create a free account</h2>
            <p className="text-xs mb-4" style={{ color: "#6688aa" }}>
              Everything is free. Sign up to unlock:
            </p>
            <div className="space-y-2.5 mb-5">
              {[
                { icon: "📬", text: "Deadline reminders — 24h and 2h before each GW" },
                { icon: "💾", text: "Your transfer plans saved across devices" },
                { icon: "📊", text: "GW history — see what you planned last week" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-1">
                  <span className="text-base leading-tight">{item.icon}</span>
                  <p className="text-xs leading-snug" style={{ color: "#c8daf0" }}>{item.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep("signup")}
              className="w-full py-3 rounded-xl text-sm font-bold mb-3"
              style={{ background: "#f59e0b", color: "#000" }}
            >
              Create free account
            </button>
            <button
              onClick={() => setStep("login")}
              className="w-full py-3 rounded-xl text-sm font-semibold mb-4"
              style={{ background: "#1a2538", color: "#f0f0f0", border: "1px solid #1e3050" }}
            >
              I already have an account
            </button>
            <button onClick={onClose} className="w-full text-center text-xs py-1" style={{ color: "#3d5570" }}>
              Not now
            </button>
          </>
        )}

        {/* Login */}
        {step === "login" && (
          <>
            <button onClick={() => setStep("menu")} className="flex items-center gap-1 text-xs mb-5" style={{ color: "#6688aa" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
              Back
            </button>
            <h2 className="text-lg font-bold text-white mb-4">Log in</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-2"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-1"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}
            />
            <button onClick={() => setStep("forgot")} className="text-xs mb-4 block" style={{ color: "#6688aa" }}>
              Forgot password?
            </button>
            {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: "#f59e0b", color: "#000", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
            <p className="text-xs text-center mt-4" style={{ color: "#6688aa" }}>
              No account?{" "}
              <button onClick={() => setStep("signup")} className="underline" style={{ color: "#f59e0b" }}>
                Create one
              </button>
            </p>
          </>
        )}

        {/* Signup */}
        {step === "signup" && (
          <>
            <button onClick={() => setStep("menu")} className="flex items-center gap-1 text-xs mb-5" style={{ color: "#6688aa" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
              Back
            </button>
            <h2 className="text-lg font-bold text-white mb-4">Create account</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-2"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}
            />
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-4"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}
            />
            {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}
            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: "#f59e0b", color: "#000", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
            <p className="text-xs text-center mt-4" style={{ color: "#6688aa" }}>
              Already have an account?{" "}
              <button onClick={() => setStep("login")} className="underline" style={{ color: "#f59e0b" }}>
                Log in
              </button>
            </p>
          </>
        )}

        {/* Forgot password */}
        {step === "forgot" && (
          <>
            <button onClick={() => setStep("login")} className="flex items-center gap-1 text-xs mb-5" style={{ color: "#6688aa" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
              Back
            </button>
            <h2 className="text-lg font-bold text-white mb-2">Reset password</h2>
            <p className="text-xs mb-4" style={{ color: "#6688aa" }}>We&apos;ll send a reset link to your email.</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-4"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}
            />
            {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}
            <button
              onClick={handleForgot}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: "#f59e0b", color: "#000", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}

        {/* Check email */}
        {step === "check-email" && (
          <>
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
              <p className="text-sm mb-6" style={{ color: "#6688aa" }}>
                We sent a link to <strong className="text-white">{email}</strong>. Click it to continue.
              </p>
              <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold" style={{ background: "#f59e0b", color: "#000" }}>
                Got it
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
