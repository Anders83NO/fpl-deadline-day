"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import DeadlineCountdown from "@/components/DeadlineCountdown";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";

export default function TopBar() {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 px-4 h-14 flex items-center justify-between"
        style={{ background: "#0f1520", borderBottom: "1px solid #1e3050" }}>
        <Logo size={36} showText={true} />
        <div className="flex items-center gap-3">
          <DeadlineCountdown />
          {user ? (
            <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowMenu(false); }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "#f59e0b", color: "#000" }}
              >
                {user.email?.[0].toUpperCase()}
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 top-10 rounded-xl py-1 z-50 min-w-[160px]"
                  style={{ background: "#162030", border: "1px solid #1e3050" }}
                >
                  <p className="px-4 py-2 text-xs truncate" style={{ color: "#6688aa" }}>{user.email}</p>
                  <div style={{ borderTop: "1px solid #1e3050" }} />
                  <button
                    onClick={async () => { await signOut(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm"
                    style={{ color: "#ef4444" }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "#1a2538", color: "#f59e0b", border: "1px solid #1e3050" }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />
    </>
  );
}
