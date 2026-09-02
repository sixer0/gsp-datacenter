"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionHeader, Panel, Pill, EmptyState, Button } from "@/components/ui/kit";
import { usePaged, PagedBar } from "@/components/ui/paged";
import { Users, UserPlus, Shield, ShieldCheck, Trash2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

type UserRow = {
  id: string;
  username: string;
  displayName: string | null;
  role: "ADMINISTRATOR" | "USER";
  hermesProfile: string;
  createdAt: string;
  updatedAt: string;
};

type AgentRow = {
  id: string;
  profile: string;
  name: string;
  group: string;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

export default function UserAccessPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // create form
  const [fUsername, setFUsername] = useState("");
  const [fDisplayName, setFDisplayName] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fRole, setFRole] = useState<"USER" | "ADMINISTRATOR">("USER");
  const [fProfile, setFProfile] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, aRes] = await Promise.all([
        fetch("/api/user-access", { cache: "no-store" }),
        fetch("/api/agents", { cache: "no-store" }),
      ]);
      const uData = await uRes.json();
      const aData = await aRes.json();
      setUsers(uData.users || []);
      setAgents(Array.isArray(aData) ? aData : []);
    } catch (e) {
      setError("Gagal memuat data user access.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const agentProfiles = new Set(agents.filter((a) => a.group !== "user-access").map((a) => a.profile));
  const registered = (profile: string) => agentProfiles.has(profile) || agents.some((a) => a.profile === profile && a.group === "user-access");

  // paging 10 baris/halaman (lazy render)
  const paged = usePaged(users);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const uname = fUsername.trim().toLowerCase();
    if (!uname || !fPassword || !fProfile) {
      setNotice("Username, password, dan Swarm profile wajib diisi.");
      return;
    }
    if (!/^[a-z0-9][a-z0-9_-]{0,31}$/.test(uname)) {
      setNotice("Username hanya boleh huruf kecil, angka, _ atau - (1–32 karakter, tanpa spasi/titik).");
      return;
    }
    if (fPassword.length < 8) {
      setNotice("Password minimal 8 karakter.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/user-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: uname,
          displayName: fDisplayName || null,
          password: fPassword,
          role: fRole,
          hermesProfile: fProfile,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice(`User '${data.user.username}' dibuat (profile ${data.user.hermesProfile}).`);
        setFUsername(""); setFDisplayName(""); setFPassword(""); setFProfile(""); setFRole("USER");
        setShowCreate(false);
        load();
      } else {
        setNotice(data.error || "Gagal membuat user.");
      }
    } catch {
      setNotice("Gagal membuat user.");
    } finally {
      setBusy(false);
    }
  }

  async function updateRole(u: UserRow, role: "ADMINISTRATOR" | "USER") {
    setBusy(true);
    try {
      const res = await fetch(`/api/user-access/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      setNotice(res.ok ? `Role '${u.username}' → ${role}.` : data.error || "Gagal ubah role.");
      load();
    } catch {
      setNotice("Gagal ubah role.");
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(u: UserRow) {
    if (!window.confirm(`Hapus user '${u.username}' (profile ${u.hermesProfile})?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/user-access/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      setNotice(res.ok ? `User '${u.username}' dihapus.` : data.error || "Gagal menghapus.");
      load();
    } catch {
      setNotice("Gagal menghapus.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus:border-[var(--accent)]";

  return (
    <div className="p-6 max-w-5xl">
      <SectionHeader
        label="System"
        title="User Access"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={load} disabled={loading}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button onClick={() => setShowCreate((v) => !v)}>
              <UserPlus className="w-4 h-4" /> {showCreate ? "Tutup" : "Buat User"}
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="mb-4 rounded-lg border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-[13px] text-[var(--text-2)]">
          {notice}
        </div>
      )}

      {showCreate && (
        <Panel className="mb-4 p-4">
          <div className="flex items-center gap-2 mb-3 text-[13px] font-semibold text-[var(--text)]">
            <UserPlus className="w-4 h-4" /> Buat User Baru
          </div>
          <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Username" value={fUsername} onChange={(e) => setFUsername(e.target.value)} autoComplete="off" />
            <input className={inputCls} placeholder="Display name (opsional)" value={fDisplayName} onChange={(e) => setFDisplayName(e.target.value)} />
            <input className={inputCls} type="password" placeholder="Password (min 8 karakter)" value={fPassword} onChange={(e) => setFPassword(e.target.value)} autoComplete="new-password" />
            <input className={inputCls} list="hermes-profile-options" placeholder="Swarm profile (kosong = otomatis seusername, dibuat lean)" value={fProfile} onChange={(e) => setFProfile(e.target.value)} autoComplete="off" />
            <datalist id="hermes-profile-options">
              {["default", ...Array.from(agentProfiles)].map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <select className={inputCls} value={fRole} onChange={(e) => setFRole(e.target.value as any)}>
              <option value="USER">User</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
            <div className="flex items-end">
              <Button type="submit" disabled={busy}>Buat</Button>
            </div>
          </form>
          <div className="mt-2 text-[12px] text-[var(--text-3)]">
            Catatan: kolom profil boleh dikosongkan. Bila nama profil belum ada di mesin, server
            membuatkannya <strong>lean</strong> secara otomatis (skill fisik hanya lane-nya: trio
            orkestrasi + verifikasi + LAD untuk controller, dengan marker <code>.lean-policy</code>)
            dan menamainya sesuai username. Profil lama yang sudah ada tetap di-top-up tanpa diubah isinya.
          </div>
        </Panel>
      )}

      {loading ? (
        <Panel className="p-6 text-[13px] text-[var(--text-2)]">Memuat user access…</Panel>
      ) : error ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="Gagal memuat" hint={error} />
      ) : users.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="Belum ada user" hint="User WebUI akan muncul di sini setelah signup pertama." />
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[11px] uppercase tracking-wide text-[var(--text-3)]">
                <th className="px-3 py-2 font-semibold">User</th>
                <th className="px-3 py-2 font-semibold">Role</th>
                <th className="px-3 py-2 font-semibold">Swarm Profile</th>
                <th className="px-3 py-2 font-semibold">Terdaftar di Agents</th>
                <th className="px-3 py-2 font-semibold">Dibuat</th>
                <th className="px-3 py-2 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((u) => (
                <tr key={u.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface-1)]/60">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-[var(--text)]">{u.displayName || u.username}</div>
                    <div className="text-[12px] text-[var(--text-3)]">@{u.username}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill tone={u.role === "ADMINISTRATOR" ? "accent" : "neutral"}>{u.role === "ADMINISTRATOR" ? "Administrator" : "User"}</Pill>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--text-2)]">{u.hermesProfile}</td>
                  <td className="px-3 py-2.5">
                    {registered(u.hermesProfile) ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-[var(--up)]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terdaftar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] text-[var(--warn)]">
                        <XCircle className="w-3.5 h-3.5" /> Belum
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-[var(--text-3)]">{fmt(u.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.role === "ADMINISTRATOR" ? (
                        <Button variant="ghost" disabled={busy} onClick={() => { updateRole(u, "USER"); }}>
                          <ShieldCheck className="w-4 h-4" /> Demote
                        </Button>
                      ) : (
                        <Button variant="ghost" disabled={busy} onClick={() => { updateRole(u, "ADMINISTRATOR"); }}>
                          <Shield className="w-4 h-4" /> Promote
                        </Button>
                      )}
                      <button
                        className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--down)] hover:bg-[var(--surface-1)] transition-colors"
                        title="Hapus user"
                        disabled={busy}
                        onClick={() => removeUser(u)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PagedBar p={paged} />
        </Panel>
      )}
    </div>
  );
}
