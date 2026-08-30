"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * GSP Swarm HQ — unified sign-in (30-08-2026).
 * Same accounts as the Brahma WebUI (WebUiUser, verified by /api/auth/login).
 */
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data?.error || `Login failed (HTTP ${res.status})`));
        setBusy(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error — HQ unreachable.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="hq-ambient" aria-hidden />
      <div className="relative z-10 panel hq-rise w-full max-w-sm p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-[var(--r-md)] bg-white flex items-center justify-center text-[19px] font-bold text-[#0a0b0d]">
            S
          </div>
          <h1 className="mt-5 text-[20px] font-semibold tracking-[-0.015em] text-[var(--text)]">
            GSP Swarm HQ
          </h1>
          <p className="eyebrow mt-2">Sign in to continue</p>
        </div>

        <div className="rule my-7" />

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="eyebrow !text-[10px] text-[var(--text-3)]">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className="mt-1.5 w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2.5 text-[13.5px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:border-[var(--line-strong)]"
              placeholder="superadmin"
            />
          </label>
          <label className="block">
            <span className="eyebrow !text-[10px] text-[var(--text-3)]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1.5 w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2.5 text-[13.5px] text-[var(--text)] placeholder:text-[var(--text-4)] focus:border-[var(--line-strong)]"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="text-[12.5px] text-[var(--down)] leading-snug" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-3 text-[13px] disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11.5px] text-[var(--text-4)] leading-relaxed">
          Uses your Swarm / Brahma WebUI account.
          <br />
          Access to profiles follows your role in User Access.
        </p>
      </div>
    </div>
  );
}
