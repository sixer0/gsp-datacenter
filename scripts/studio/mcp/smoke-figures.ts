/**
 * Uji asap stdio NYATA alat figur MCP Studio (FIG-03b): `server.ts` sebagai proses anak (klien SDK resmi,
 * `STUDIO_MCP_TOOLSETS=documents`), lalu: document_create -> chapter_submit (bab JSON v2 dengan grafik P-02 padat,
 * 8 label panjang) -> figure_preview (isu + saran) -> figure_preview inline (dry-run label pendek) -> figure_preview
 * downloadDir (SVG di akar) -> figure_revise (basis sesi; label pendek) -> figure_preview (isu lebih sedikit) ->
 * figure_revise basis lama (409 SCOPE_CONFLICT, 0 tulis). Memeriksa rahasia tidak keluar dan tulis berkas di akar.
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder kosong> npx tsx <repo>/scripts/studio/mcp/smoke-figures.ts \
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-02_fig03b] [--agent-id cod-fig03b] [--template datum-gsp]
 *
 * Menulis satu dokumen klien baru per jalan di Studio. Kode keluar: 0 lulus, 1 ada langkah gagal, 2 galat lingkungan.
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const argOf = (argv: string[], name: string, def: string) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};
const LONG = ["Pembangkit Listrik Tenaga Uap Suralaya", "Gardu Induk Tegangan Ekstra Tinggi Cilegon", "Saluran Udara Tegangan Tinggi Bogor Baru", "Pusat Pengatur Beban Jawa Bali", "Unit Induk Distribusi Jakarta Raya", "Unit Pelaksana Transmisi Durikosambi", "Pembangkit Listrik Tenaga Gas Muara Karang", "Gardu Distribusi Kawasan Industri Pulogadung"];
const SHORT = ["PLTU Suralaya", "GITET Cilegon", "SUTT Bogor", "P2B Jabali", "UID Jakarta", "UPT Duri", "PLTG M. Karang", "GD Pulogadung"];
const points = (labels: string[]) => labels.map((label, i) => ({ label, value: 40 + i * 9 }));
const CHART = (labels: string[]) => ({ type: "chart", code: "P-02", data: { shape: "categorical", points: points(labels) }, unit: "MW", caption: { text: "Beban puncak per unit" }, source: { text: "Rekap beban Q3 2026" } });

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if (secret === "" || roots === "") {
    process.stderr.write("smoke-figures: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib diisi\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", process.env.STUDIO_BASE_URL ?? "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-02_fig03b");
  const agentId = argOf(argv, "--agent-id", "cod-fig03b");
  const template = argOf(argv, "--template", "datum-gsp");
  const docKey = `figur-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;
  const stderr: string[] = [];
  const outputs: string[] = [];
  const steps: Array<{ step: string; ok: boolean; note: string; cid?: string | null }> = [];
  const t0 = Date.now();
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, INTERNAL_API_SECRET: secret, STUDIO_AGENT_ID: agentId, STUDIO_MCP_FILE_ROOTS: roots, STUDIO_MCP_TOOLSETS: "documents" },
    stderr: "pipe",
  });
  transport.stderr?.on("data", (d: Buffer) => stderr.push(d.toString("utf8")));
  const client = new Client({ name: "studio-mcp-smoke-figures", version: "1.0.0" });
  await client.connect(transport);
  const call = async (name: string, args: Record<string, unknown>) => {
    const r: any = await client.callTool({ name, arguments: args });
    const raw = JSON.stringify(r);
    outputs.push(raw);
    const data = r.structuredContent ?? {};
    const cids: string[] = Array.isArray(data.correlationIds) ? data.correlationIds : [];
    return { isError: r.isError === true, data, text: String(r.content?.[0]?.text ?? ""), cid: data.error?.correlationId ?? cids[cids.length - 1] ?? null, bytes: Buffer.byteLength(raw) };
  };
  const push = (step: string, ok: boolean, note: string, r: { cid: string | null; bytes?: number; isError?: boolean; data?: any }) =>
    steps.push({ step, ok, note: `${note} [${r.bytes} B]${r.isError ? ` galat ${r.data?.error?.code}: ${String(r.data?.error?.message ?? "").slice(0, 200)}` : ""}`, cid: r.cid });
  const codes = (d: any): string[] => (Array.isArray(d?.figure?.issues) ? d.figure.issues.map((i: any) => String(i.checkId)) : []);

  const tools = await client.listTools();
  steps.push({ step: "tools/list", ok: ["studio_figure_preview", "studio_figure_revise"].every((n) => tools.tools.some((t) => t.name === n)), note: `${tools.tools.length} alat, ${Buffer.byteLength(JSON.stringify(tools))} B` });
  const c1 = await call("studio_document_create", { template, mission, docKey, title: "Uji figur FIG-03b" });
  const documentId = c1.data.documentId as string;
  push("studio_document_create", !c1.isError && typeof documentId === "string", `dokumen ${documentId} ${c1.data.docNumber} rev ${c1.data.revisionNo}`, c1);
  if (c1.isError) return finish();
  const chapter = { key: "1", title: { text: "Beban Sistem" }, sections: [{ title: { text: "Beban Puncak" }, blocks: [{ type: "paragraph", text: "Bagian ini merangkum beban puncak per unit pada triwulan III 2026." }, CHART(LONG)] }] };
  const sub = await call("studio_chapter_submit", { submission: { $schema: "studio.chapter/v2", target: { documentId }, chapter }, detail: true });
  const chart = Array.isArray(sub.data.chapter?.blocks) ? sub.data.chapter.blocks.find((b: any) => b.type === "chart") : null;
  const pid = chart?.pid as string | undefined;
  push("studio_chapter_submit (grafik padat)", !sub.isError && typeof pid === "string", `rev ${sub.data.revision?.revisionNo}; grafik pid ${pid} alamat ${chart?.address}; basis sesi ${sub.data.basisFromSession ?? "-"}`, sub);
  if (typeof pid !== "string") return finish();
  const rev1 = sub.data.revision?.revisionNo as number;

  const p1 = await call("studio_figure_preview", { documentId, pid });
  const suggest = Array.isArray(p1.data.figure?.issues) ? p1.data.figure.issues.filter((i: any) => typeof i.suggest === "string").length : 0;
  push("studio_figure_preview (sebelum)", !p1.isError && p1.data.rendered === true && p1.data.layoutIssueCount > 0 && suggest > 0 && p1.data.untrusted === true && p1.data.figure?.svg === undefined, `${p1.data.layoutIssueCount} isu tata letak / ${p1.data.issueCount} total [${codes(p1.data).join(", ")}], ${suggest} bersaran, ${p1.data.figure?.size?.widthMm}x${p1.data.figure?.size?.heightMm} mm`, p1);
  const pi = await call("studio_figure_preview", { documentId, pid, block: CHART(SHORT) });
  push("studio_figure_preview inline (dry-run)", !pi.isError && pi.data.figure?.inline === true && pi.data.layoutIssueCount < p1.data.layoutIssueCount, `${pi.data.layoutIssueCount} isu tata letak [${codes(pi.data).join(", ")}]; tidak disimpan`, pi);
  const pd = await call("studio_figure_preview", { documentId, pid, downloadDir: path.join(root, "figur") });
  const saved = typeof pd.data.savedTo === "string" && fs.existsSync(pd.data.savedTo) && fs.readFileSync(pd.data.savedTo, "utf8").includes("<svg");
  push("studio_figure_preview downloadDir", !pd.isError && saved, `SVG ${pd.data.bytes} B -> ${pd.data.savedTo}`, pd);

  const rv = await call("studio_figure_revise", { documentId, pid, patch: { data: { shape: "categorical", points: points(SHORT) } }, change: { what: "label kategori dipendekkan", why: "label panjang bertumpuk (AUTO_ORIENT/LABEL_GUTTER)", impact: "Gambar 1.1 lebih ringkas" } });
  push("studio_figure_revise (basis sesi)", !rv.isError && rv.data.revisionNo === rv.data.baseRevisionNo + 1 && rv.data.basisFromSession === rev1, `rev ${rv.data.baseRevisionNo} -> ${rv.data.revisionNo}; ${rv.data.layoutIssueCount} isu tata letak [${codes(rv.data).join(", ")}]`, rv);
  const p2 = await call("studio_figure_preview", { documentId, pid });
  push("studio_figure_preview (sesudah)", !p2.isError && p2.data.revisionNo === rv.data.revisionNo && p2.data.layoutIssueCount < p1.data.layoutIssueCount, `isu tata letak ${p1.data.layoutIssueCount} -> ${p2.data.layoutIssueCount} (total ${p1.data.issueCount} -> ${p2.data.issueCount}) [${codes(p2.data).join(", ")}]`, p2);
  const st = await call("studio_figure_revise", { documentId, pid, baseRevisionNo: rev1, patch: { unit: "kW" }, change: { what: "satuan", why: "uji basis lama", impact: "tidak ada (harus ditolak)" } });
  const p3 = await call("studio_figure_preview", { documentId, pid });
  push("studio_figure_revise basis lama", st.isError && ["SCOPE_CONFLICT", "BASE_CONFLICT", "REVISION_CONFLICT"].includes(st.data.error?.code) && p3.data.revisionNo === rv.data.revisionNo, `galat ${st.data.error?.code} httpStatus ${st.data.error?.httpStatus} untrusted ${st.data.untrusted === true}; revisi tetap ${p3.data.revisionNo}`, { ...st, isError: false });
  return finish();

  async function finish(): Promise<number> {
    await client.close();
    const all = stderr.join("");
    steps.push({ step: "rahasia tidak keluar", ok: ![...outputs, all].some((s) => s.includes(secret)), note: `dipindai ${outputs.length} hasil alat + stderr server` });
    const writes = all.split("\n").filter((l) => l.includes('"fileWrites"')).flatMap((l) => {
      try {
        return (JSON.parse(l).fileWrites as string[]) ?? [];
      } catch {
        return [];
      }
    });
    const outside = writes.filter((w) => !path.resolve(w.replace(/^\S+ /, "")).toLowerCase().startsWith(root.toLowerCase()));
    steps.push({ step: "tulis berkas hanya di akar", ok: outside.length === 0, note: `${writes.length} tulis tercatat, ${outside.length} di luar akar` });
    const failed = steps.filter((s) => !s.ok);
    process.stdout.write(`${JSON.stringify({ ok: failed.length === 0, baseUrl, mission, docKey, agentId, durationMs: Date.now() - t0, steps }, null, 2)}\n`);
    return failed.length === 0 ? 0 : 1;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-figures: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);
