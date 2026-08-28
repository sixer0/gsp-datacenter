"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface AgentActivity {
  timestamp: string;
  action: string;
  result?: string;
}

interface Agent {
  id: string;
  profile: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  level: number;
  group: string;
  groupLabel: string;
  status: string;
  gatewayPid?: number;
  currentTask?: string;
  lastActive?: string;
  tasksCompleted: number;
  totalCost: number;
  recentActivity: AgentActivity[];
}

const statusConfig: Record<string, { color: string; dot: string; label: string; pulse?: boolean }> = {
  idle: { color: "var(--warn)", dot: "var(--warn)", label: "Idle" },
  working: { color: "var(--accent)", dot: "var(--accent)", label: "Working", pulse: true },
  error: { color: "var(--down)", dot: "var(--down)", label: "Error" },
  offline: { color: "var(--text-3)", dot: "var(--text-4)", label: "Offline" },
  online: { color: "var(--up)", dot: "var(--up)", label: "Online", pulse: true },
  active: { color: "var(--up)", dot: "var(--up)", label: "Active", pulse: true },
  mixed: { color: "var(--warn)", dot: "var(--warn)", label: "Partial" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function AgentCard({ agent, isExpanded, onToggle, onChat }: { agent: Agent; isExpanded: boolean; onToggle: () => void; onChat: () => void }) {
  const status = statusConfig[agent.status] || statusConfig.offline;

  return (
    <div className="panel panel-interactive overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-[var(--r-md)] flex items-center justify-center text-xl shrink-0"
            style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
          >
            {agent.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2 h-2 shrink-0">
                {status.pulse && <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: status.dot }} />}
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: status.dot }} />
              </span>
              <h3 className="text-[13px] font-semibold text-[var(--text)] truncate">{agent.name}</h3>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-medium shrink-0" style={{ color: status.color }}>{status.label}</span>
              <p className="text-[11px] text-[var(--text-3)] truncate">{agent.role}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--text-4)" }}>
                {agent.model}
              </span>
              <span className="text-[9px] font-mono text-[var(--text-4)]">profil: {agent.profile}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="num text-[18px] font-semibold text-[var(--text)] leading-none">{agent.tasksCompleted}</div>
            <div className="eyebrow mt-1">tasks</div>
            {agent.lastActive && <div className="num text-[10px] text-[var(--text-4)] mt-1">{timeAgo(agent.lastActive)}</div>}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 py-3 space-y-2.5" style={{ borderTop: "1px solid var(--line)" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onChat(); }}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-[12.5px]"
          >
            <span>💬</span> Chat dengan {agent.name}
          </button>
          <h4 className="eyebrow">Recent Activity</h4>
          {agent.recentActivity.length === 0 ? (
            <p className="text-[12px] text-[var(--text-3)] py-1">No activity yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {agent.recentActivity.slice(0, 10).map((activity, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[12px]">
                  <span className="num text-[var(--text-4)] shrink-0 w-14">{timeAgo(activity.timestamp)}</span>
                  <span className="text-[var(--text-2)]">{activity.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Live Agent Chat (routes to the real Hermes profile via /api/agent-chat) ─
function AgentChat({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMsgs = [...msgs, { role: "user" as const, content: text }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const r = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, message: text, history: msgs }),
      });
      const d = await r.json() as { reply: string };
      setMsgs([...newMsgs, { role: "assistant", content: d.reply }]);
    } catch {
      setMsgs([...newMsgs, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="elevated w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="text-2xl">{agent.emoji}</div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--text)]">{agent.name}</div>
            <div className="text-[12px] text-[var(--text-3)]">{agent.role}</div>
          </div>
          <button onClick={onClose} className="ml-auto text-[var(--text-3)] hover:text-[var(--text)] transition-colors text-xl leading-none">×</button>
        </div>
        <div className="h-80 overflow-y-auto p-4 space-y-3 flex flex-col" style={{ background: "var(--surface-1)" }}>
          {msgs.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[var(--text-3)] text-[13px] text-center">Ask {agent.name} anything.<br />They&apos;re connected to their Swarm profile.</p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%] rounded-[var(--r-md)] px-3.5 py-2 text-[13px] leading-relaxed"
                style={m.role === "user"
                  ? { background: "var(--surface-3)", color: "var(--text)" }
                  : { background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--text-2)" }}>
                {m.role === "assistant" && <span className="text-xs mr-1">{agent.emoji}</span>}
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-[var(--r-md)] px-3.5 py-2" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                <span className="text-[var(--text-3)] text-[13px]">{agent.emoji} thinking…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 p-3" style={{ borderTop: "1px solid var(--line)" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`Message ${agent.name}…`}
            className="flex-1 rounded-full px-4 py-2 text-[13px] text-[var(--text)] focus:outline-none transition-colors"
            style={{ background: "var(--surface-1)", border: "1px solid var(--line)" }}
          />
          <button onClick={send} disabled={!input.trim() || loading} className="btn-primary px-4 py-2 text-[13px]">Send</button>
        </div>
      </div>
    </div>
  );
}

// ── Hierarchy node (org chart) ─────────────────────────────
function HierarchyNode({ agent, sub }: { agent: Agent; sub?: React.ReactNode }) {
  const status = statusConfig[agent.status] || statusConfig.offline;
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-2 rounded-[var(--r-lg)] px-5 py-3 min-w-[150px]"
        style={{ background: "var(--surface-1)", border: "1px solid var(--line)", opacity: agent.status === "offline" ? 0.55 : 1 }}>
        <div className="text-3xl">{agent.emoji}</div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="relative flex w-2 h-2 shrink-0">
              {status.pulse && <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: status.dot }} />}
              <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: status.dot }} />
            </span>
            <span className="text-[13px] font-semibold text-[var(--text)]">{agent.name}</span>
          </div>
          <div className="text-[10px] text-[var(--text-3)] mt-0.5">{agent.role}</div>
          <div className="text-[9px] font-mono text-[var(--text-4)] mt-1">{agent.profile}</div>
        </div>
      </div>
      {sub && (
        <>
          <div className="w-px h-5" style={{ background: "var(--line-strong)" }} />
          {sub}
        </>
      )}
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 10000);
    return () => clearInterval(interval);
  }, [loadAgents]);

  if (loading) {
    return (
      <div className="relative min-h-screen p-8">
        <div className="relative z-10 w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="sk h-32 rounded-[var(--r-lg)]" />)}
        </div>
      </div>
    );
  }

  const brahma = agents.find(a => a.id === "brahma");
  const advisors = agents.filter(a => a.level === 2);
  const groups = ["controller", "analysis", "execution", "verification", "utility"]
    .map(g => ({ id: g, label: agents.find(a => a.group === g)?.groupLabel || g, agents: agents.filter(a => a.level === 3 && a.group === g) }))
    .filter(g => g.agents.length > 0);

  const online = agents.filter(a => a.status !== "offline").length;
  const working = agents.filter(a => a.status === "working").length;
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);

  return (
    <>
      <div className="relative z-10 w-full mx-auto text-[var(--text)] p-8 pb-16 space-y-8">
        {/* Header */}
        <div className="hq-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-2.5">Agent HQ</div>
            <h1 className="text-[32px] font-semibold tracking-[-0.025em] leading-none text-[var(--text)]">Your AI Team</h1>
            <p className="text-[13px] text-[var(--text-3)] mt-3">{agents.filter((a) => !a.id.startsWith("webui-")).length} profil Swarm · terhubung langsung ke gateway</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-7 text-center">
              <div>
                <div className="num text-[22px] font-semibold leading-none" style={{ color: "var(--up)" }}>{online}<span className="text-[var(--text-4)]">/{agents.length}</span></div>
                <div className="eyebrow mt-1.5">Online</div>
              </div>
              <div>
                <div className="num text-[22px] font-semibold leading-none" style={{ color: "var(--accent)" }}>{working}</div>
                <div className="eyebrow mt-1.5">Working</div>
              </div>
              <div>
                <div className="num text-[22px] font-semibold leading-none text-[var(--text)]">{totalTasks}</div>
                <div className="eyebrow mt-1.5">Total Tasks</div>
              </div>
            </div>
          </div>
        </div>

        {chatAgent && <AgentChat agent={chatAgent} onClose={() => setChatAgent(null)} />}

        {/* ── Level 1: Brahma (default profile) ── */}
        {brahma && (
          <section>
            <div className="eyebrow mb-3">Level 1 · Orkestrator</div>
            <div className="flex justify-center">
              <HierarchyNode agent={brahma} />
            </div>
          </section>
        )}

        {/* ── Level 2: Advisors ── */}
        {advisors.length > 0 && (
          <section>
            <div className="eyebrow mb-3">Level 2 · Tim Penasihat Utama</div>
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <div className="w-px h-5" style={{ background: "var(--line-strong)" }} />
                <div className="flex items-center gap-0">
                  <div className="w-32 h-px" style={{ background: "var(--line-strong)" }} />
                  <div className="w-px h-4" style={{ background: "var(--line-strong)" }} />
                  <div className="w-32 h-px" style={{ background: "var(--line-strong)" }} />
                </div>
                <div className="flex flex-wrap justify-center gap-6 pt-2">
                  {advisors.map(a => <HierarchyNode key={a.id} agent={a} />)}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Level 3: Specialist groups ── */}
        <section>
          <div className="eyebrow mb-3">Level 3 · Spesialis</div>
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-px h-5" style={{ background: "var(--line-strong)" }} />
              <div className="flex items-center gap-0 justify-center w-full max-w-3xl">
                <div className="flex-1 h-px" style={{ background: "var(--line-strong)" }} />
                {groups.map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-px h-4" style={{ background: "var(--line-strong)" }} />
                    <div className="flex-1 h-px" style={{ background: "var(--line-strong)" }} />
                  </div>
                ))}
                <div className="flex-1 h-px" style={{ background: "var(--line-strong)" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full pt-2">
                {groups.map(g => (
                  <div key={g.id} className={`flex flex-col items-center gap-2 ${g.id === "execution" ? "xl:col-span-2" : ""}`}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{g.label}</div>
                    <div className={`w-full ${g.id === "execution" && g.agents.length > 6 ? "grid grid-cols-1 min-[1400px]:grid-cols-2 gap-2" : "space-y-2"}`}>
                      {g.agents.map(a => (
                        <AgentCard
                          key={a.id}
                          agent={a}
                          isExpanded={expandedAgent === a.id}
                          onToggle={() => setExpandedAgent(expandedAgent === a.id ? null : a.id)}
                          onChat={() => setChatAgent(a)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
