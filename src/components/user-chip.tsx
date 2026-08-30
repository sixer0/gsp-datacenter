"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

/** Signed-in identity + sign-out control for the HQ sidebar footer. */
export function UserChip() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.user) setUser(d.user);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (!user) return null;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-[var(--text-2)] truncate">{user.username}</p>
        <p className="eyebrow !text-[9.5px] !text-[var(--text-4)] mt-0.5">{user.role}</p>
      </div>
      <button
        onClick={signOut}
        disabled={busy}
        title="Sign out"
        aria-label="Sign out"
        className="shrink-0 p-2 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-1)] transition-colors disabled:opacity-50"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
