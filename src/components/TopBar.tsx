"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import DeadlineCountdown from "@/components/DeadlineCountdown";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { track } from "@/lib/track";

export default function TopBar() {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <div className="glass sticky top-0 z-40 px-4 h-14 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(30,48,80,0.7)" }}>
        <Logo size={36} showText={true} />
        <div className="flex items-center gap-3">
          <DeadlineCountdown />
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Account menu"
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#000", boxShadow: "0 0 0 2px #0f1520, 0 0 0 3px rgba(245,158,11,0.35)" }}
              >
                {user.email?.[0].toUpperCase()}
              </button>
              {showMenu && (
                <div
                  className="card animate-fade-up absolute right-0 top-11 py-1 z-50 min-w-[200px] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="px-4 py-2 text-xs truncate" style={{ color: "#6688aa" }}>{user.email}</p>
                  <div style={{ borderTop: "1px solid #1e3050" }} />
                  <button
                    onClick={async () => { setShowMenu(false); await signOut(); }}
                    className="w-full text-left px-4 py-2.5 text-sm"
                    style={{ color: "#ef4444" }}
                  >
                    Sign out
                  </button>
                </div>
              )}
              {showMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              )}
            </div>
          ) : (
            <button
              onClick={() => { track("cta_click", { cta: "sign_in", location: "top_bar" }); setShowAuth(true); }}
              className="h-9 px-3.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
