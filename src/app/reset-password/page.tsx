"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

type Step = "form" | "success" | "invalid";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>("form");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase puts the token in the URL hash — it handles it automatically
    // when the page loads via onAuthStateChange, but we just need to be here
  }, []);

  async function handleReset() {
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error } = await getSupabase().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("success");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#0f1520" }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size={48} showText={false} />
        </div>

        {step === "form" && (
          <div className="rounded-2xl p-6" style={{ background: "#162030", border: "1px solid #1e3050" }}>
            <h1 className="text-lg font-bold text-white mb-1">Set new password</h1>
            <p className="text-xs mb-5" style={{ color: "#6688aa" }}>
              Choose a new password for your account.
            </p>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-2"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none mb-4"
              style={{ background: "#1a2538", border: "1px solid #1e3050" }}
            />
            {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: "#f59e0b", color: "#000", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Saving…" : "Save new password"}
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#162030", border: "1px solid #1e3050" }}>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-lg font-bold text-white mb-2">Password updated!</h1>
            <p className="text-sm mb-5" style={{ color: "#6688aa" }}>
              You can now log in with your new password.
            </p>
            <a
              href="/"
              className="block w-full py-3 rounded-xl text-sm font-bold text-center"
              style={{ background: "#f59e0b", color: "#000" }}
            >
              Go to app
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
