"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Pill } from "@/components/ui/kit";
import { ClipboardList, Plus, Filter } from "lucide-react";

interface Task {
  id: string;
  board: string;
  title: string;
  assignee: string | null;
  status: string;
  priority: number | null;
  result: string | null;
  updatedAt: string;
}

const STATUS_GROUPS: { id: string; label: string; statuses: string[]; tone: "neutral" | "accent" | "warn" | "up" | "down" }[] = [
  { id: "todo", label: "To Do", statuses: ["ready", "todo", "backlog", "queued", "created"], tone: "neutral" },
  { id: "progress", label: "In Progress", statuses: ["running", "in_progress", "claimed", "active"], tone: "accent" },
  { id: "review", label: "Review", statuses: ["in_review", "review", "needs_review", "requested_review"], tone: "warn" },
  { id: "blocked", label: "Blocked", statuses: ["blocked"], tone: "down" },
  { id: "scheduled", label: "Scheduled", statuses: ["scheduled", "parked"], tone: "neutral" },
  { id: "done", label: "Done", statuses: ["done", "completed", "archived"], tone: "up" },
];

const STATUS_TONE: Record<string, "neutral" | "accent" | "warn" | "up" | "down"> = {};
for (const g of STATUS_GROUPS) for (const s of g.statuses) STATUS_TONE[s] = g.tone;

const ASSIGNEE_EMOJI: Record<string, string> = {
  brahma: "🧠",
  "gsp-master-controller": "🎛️",
  "gsp-task-architect": "📐",
  "gsp-request-translator": "🔄",
  "gsp-pm-controller": "📋",
  "gsp-document-controller": "📑",
  "gsp-vendor-crawler-orchestrator": "🕸️",
  "gsp-coder-execution": "💻",
  "gsp-verifier": "✅",
  "gsp-data-collector": "📥",
  "gsp-data-analyst": "📊",
  "gsp-document-writer": "✍️",
  "gsp-social-media-analyst": "📈",
  "gsp-social-media-crawler": "🕷️",
  "gsp-architecture-specialist": "🏛️",
  "gsp-librarian": "📚",
};

// ── Derivat project dari judul task (tidak ada field project eksplisit) ──
function deriveProject(title: string): string {
  const t = (title || "").toLowerCase();
  if (/sosial media area jakarta|sosmed jakarta|sosial media/.test(t)) return "Sosmed Jakarta";
  if (/vendor katering|katering jabodetabek/.test(t)) return "Vendor Katering Jabodetabek";
  if (/librarian/.test(t)) return "Librarian Gatekeeper";
  if (/test/.test(t)) return "Test";
  return "Lainnya";
}

function shortId(id: string): string {
  return id.length > 14 ? id.slice(0, 12) + "…" : id;
}

function timeAgo(d: string): string {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [fAssignee, setFAssignee] = useState("all");
  const [fProject, setFProject] = useState("all");

  // opsi filter dari data task
  const assignees = useMemo(
    () => [...new Set(tasks.map((t) => t.assignee).filter(Boolean) as string[])],
    [tasks]
  );
  const projects = useMemo(
    () => [...new Set(tasks.map((t) => deriveProject(t.title)))],
    [tasks]
  );
  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (fAssignee === "all" || t.assignee === fAssignee) &&
          (fProject === "all" || deriveProject(t.title) === fProject)
      ),
    [tasks, fAssignee, fProject]
  );

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/brahma/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setLastSync(data.lastSync ?? null);
    } catch { /* keep last data */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    const iv = setInterval(fetchTasks, 6000);
    return () => clearInterval(iv);
  }, [fetchTasks]);

  async function addTask() {
    if (!newTask.trim() || busy) return;
    setBusy(true);
    try {
      // Create a REAL kanban card via the bridge (dispatch kind=kanban)
      const res = await fetch("/api/brahma/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "kanban", title: newTask.trim() }),
      });
      if (res.ok) {
        setNewTask("");
        setShowAddTask(false);
        setToast("Kartu kanban dibuat — bridge akan mengeksekusinya.");
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast("Gagal membuat task. Coba lagi.");
        setTimeout(() => setToast(null), 4000);
      }
      fetchTasks();
    } catch {
      setToast("Gagal membuat task. Coba lagi.");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="relative z-10 h-full flex flex-col w-full mx-auto pt-4 pb-16">
        <div className="flex justify-between items-end gap-4 mb-6">
          <div>
            <div className="eyebrow mb-2">Swarm kanban mirror</div>
            <h1 className="text-[32px] font-semibold tracking-[-0.025em] leading-none text-[var(--text)]">Tasks</h1>
            <p className="text-[12.5px] text-[var(--text-3)] mt-2">
              {tasks.length} task · board {tasks[0]?.board ?? "default"}
              {lastSync ? ` · sync ${timeAgo(lastSync)} lalu` : ""}
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowAddTask((s) => !s)}>
            <Plus className="w-3.5 h-3.5" /> Add Task
          </Button>
        </div>

        {/* ── Filter: Profile (assignee) + Project ── */}
        <div className="hq-rise flex flex-wrap items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
            <Filter className="w-3.5 h-3.5" /> Filter
          </span>
          <select
            value={fAssignee}
            onChange={(e) => setFAssignee(e.target.value)}
            title="Filter berdasarkan profil"
            className="bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-3 py-1.5 text-[12px] text-[var(--text-2)] outline-none cursor-pointer"
          >
            <option value="all">Semua profil</option>
            {assignees.map((a) => (
              <option key={a} value={a}>
                {ASSIGNEE_EMOJI[a] ?? "🤖"} {a.replace(/^gsp-/, "")}
              </option>
            ))}
          </select>
          <select
            value={fProject}
            onChange={(e) => setFProject(e.target.value)}
            title="Filter berdasarkan project"
            className="bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-3 py-1.5 text-[12px] text-[var(--text-2)] outline-none cursor-pointer"
          >
            <option value="all">Semua project</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {(fAssignee !== "all" || fProject !== "all") && (
            <button
              onClick={() => { setFAssignee("all"); setFProject("all"); }}
              className="text-[11.5px] text-[var(--accent)] hover:underline"
            >
              Reset filter
            </button>
          )}
          <span className="ml-auto num text-[11px] text-[var(--text-3)]">
            {filteredTasks.length} task
          </span>
        </div>

        {showAddTask && (
          <div className="hq-rise elevated mb-6 p-5">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Judul task — akan dibuat di board kanban Swarm…"
              className="w-full bg-[var(--surface-1)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--text-3)] rounded-[var(--r-md)] px-4 py-3 mb-3 text-[14px] focus:outline-none focus:border-[var(--line-strong)]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={addTask} disabled={busy || !newTask.trim()}>Create Task</Button>
              <Button variant="ghost" onClick={() => setShowAddTask(false)}>Cancel</Button>
            </div>
            {toast && <p className="mt-3 text-[12.5px] text-[var(--text-2)]">{toast}</p>}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="panel p-4">
                <div className="sk h-4 w-16 mb-4" />
                <div className="space-y-2">{[...Array(i + 1)].map((_, j) => <div key={j} className="sk h-16 rounded-[var(--r-md)]" />)}</div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="panel p-6 flex flex-col items-center text-center py-16">
            <ClipboardList className="w-7 h-7 text-[var(--text-4)] mb-3" />
            <div className="text-[14px] font-semibold text-[var(--text)]">Board kanban kosong</div>
            <p className="text-[12.5px] text-[var(--text-3)] mt-1.5 max-w-md leading-relaxed">
              Task nyata muncul di sini otomatis saat kerja di-delegate — dispatch dari HQ ke profil
              (mis. brahma → gsp-master-controller) membuat kartu kanban ber-assignee, lalu ditutup
              <span style={{ color: "var(--up)" }}> done</span> atau
              <span style={{ color: "var(--down)" }}> blocked</span> sesuai hasilnya.
              Bisa juga dibuat manual via <code className="text-[var(--text-2)]">hermes kanban create</code>.
            </p>
            <Button variant="ghost" className="mt-4" onClick={() => setShowAddTask(true)}>
              <Plus className="w-3.5 h-3.5" /> Buat task pertama
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="panel p-6 flex flex-col items-center text-center py-16">
            <ClipboardList className="w-7 h-7 text-[var(--text-4)] mb-3" />
            <div className="text-[14px] font-semibold text-[var(--text)]">Tidak ada task sesuai filter</div>
            <p className="text-[12.5px] text-[var(--text-3)] mt-1.5 max-w-md leading-relaxed">
              Ubah filter profil/project, atau reset filter untuk melihat seluruh board.
            </p>
            <Button variant="ghost" className="mt-4" onClick={() => { setFAssignee("all"); setFProject("all"); }}>
              Reset filter
            </Button>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-hidden">
            {STATUS_GROUPS.map((group) => {
              const groupTasks = filteredTasks.filter((t) => group.statuses.includes(t.status));
              return (
                <div key={group.id} className="hq-rise panel flex flex-col overflow-hidden min-h-[240px]">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="eyebrow">{group.label}</span>
                    <span className="num text-[11px] text-[var(--text-3)]">{groupTasks.length}</span>
                  </div>
                  <div className="rule" />
                  <div className="flex-1 p-2.5 space-y-2 overflow-y-auto">
                    {groupTasks.map((task) => (
                      <div key={task.id} className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface-1)] p-3 transition-colors hover:border-[var(--line-strong)]">
                        <p className="font-medium text-[12.5px] leading-relaxed text-[var(--text)]">{task.title}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-2.5">
                          {task.assignee && (
                            <span className="flex items-center gap-1 text-[10.5px] text-[var(--text-2)] bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-2 py-0.5">
                              {ASSIGNEE_EMOJI[task.assignee] ?? "🤖"} {task.assignee.replace(/^gsp-/, "")}
                            </span>
                          )}
                          {task.priority != null && task.priority > 0 && (
                            <Pill tone={task.priority >= 3 ? "warn" : "neutral"}>P{task.priority}</Pill>
                          )}
                          <span className="text-[10px] font-mono text-[var(--text-4)]">{shortId(task.id)}</span>
                        </div>
                        {task.result && (
                          <p className="text-[10.5px] text-[var(--text-3)] mt-2 line-clamp-2 border-t border-[var(--line)] pt-1.5">{task.result}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <Pill tone={STATUS_TONE[task.status] ?? "neutral"}>{task.status}</Pill>
                          <span className="text-[10px] text-[var(--text-4)]">{timeAgo(task.updatedAt)}</span>
                        </div>
                      </div>
                    ))}
                    {groupTasks.length === 0 && (
                      <p className="text-[var(--text-4)] text-[12px] text-center py-6">—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
