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
            <div className="flex items-center gap-2">
              <span className="text-xs hidden sm:block" style={{ color: "#6688aa" }}>{user.email}</span>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "#1a2538", color: "#ef4444", border: "1px solid #1e3050" }}
              >
                Sign out
              </button>
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
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
