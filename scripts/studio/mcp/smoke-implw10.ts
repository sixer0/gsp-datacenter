/**
 * Uji asap stdio NYATA IMPL-W10 (gerbang akhir loop, D-577): server.ts (`STUDIO_MCP_TOOLSETS=write`) ke Studio DEV.
 * S1/S2 = payload how-to laporan (`docs/STUDIO-HOWTO-REPORT.md` §3 dan §4) dibaca dari dokumen dan dijalankan apa adanya
 * (placeholder diganti teks konkret): studio_write lalu SATU studio_edit (cell, addRow 2 sel, append, find/replace, meta).
 * S3 append ke section bersub-judul mendarat di akhir section. S4 vonis bersyarat tidak dinaikkan (VERDICT_DROPPED tampil
 * di hasil ringkas). S5 suntingan bab biasa tidak mengirim record. S6/S7 sub-judul tersimpan (MD `###` lewat
 * studio_report_submit): append ke section dan ke sasaran sub-judul mendarat di akhir section.
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder> npx tsx scripts/studio/mcp/smoke-implw10.ts
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-04_smoke-implw10] [--agent-id cod-implw10]
 *
 * Keluar 0 lulus, 1 ada langkah gagal, 2 galat lingkungan. Rahasia tidak dicetak. 429 dihormati.
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
type Res = { isError: boolean; data: any; text: string; bytes: number; ms: number };
type Call = (name: string, args: Record<string, unknown>) => Promise<Res>;
type Step = { step: string; ok: boolean; note: string };

const argOf = (argv: string[], name: string, def: string): string => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const codes = (r: Res): string[] => (r.data.warnings ?? []).map((w: any) => w.code);
const brief = (r: Res, extra = ""): string => `${r.data.ok === false ? `${r.data.code} ` : ""}${extra} [${r.bytes} B, ${r.ms} ms]`.trim();

async function content(call: Call, id: string): Promise<any> {
  const g = await call("studio_document_get", { documentId: id, view: "content" });
  return g.data.content ?? {};
}
const chapter = (c: any, key: string) => (c.sections?.content?.chapters ?? []).find((x: any) => x.key === key) ?? { sections: [] };
const blocksOf = (c: any, key: string): any[] => (chapter(c, key).sections ?? []).flatMap((s: any) => s.blocks ?? []);
const textOf = (b: any): string => (typeof b?.text === "string" ? b.text : JSON.stringify(b ?? null));

const BUKTI_S1 = "Berkas out/a.txt berukuran 12 B dengan sha 0a1b2c3d.";

/** Placeholder how-to -> nilai konkret; placeholder lain -> teks unik bernomor (bentuk JSON tidak diubah). */
function fill(json: string, fixed: Record<string, string>): string {
  let n = 0;
  return json.replace(/<([^<>"]+)>/g, (_, name: string) => fixed[name] ?? `Isi ${name} nomor ${++n}.`);
}

function howto(mission: string, docKey: string, agentId: string): { s1: Record<string, unknown>; edits: unknown[]; meta: Record<string, unknown> } {
  const doc = fs.readFileSync(path.join(__dirname, "..", "..", "..", "docs", "STUDIO-HOWTO-REPORT.md"), "utf8");
  const fixed: Record<string, string> = {
    misi: mission, kunci: docKey.replace(/^lapkerja-/, ""), owner: agentId, initiator: "ctl-implw10", label: "IMPL-W10", kartu: "t_0123abcd",
    bukti: BUKTI_S1, "SELURUH kalimat lama": BUKTI_S1, "kalimat baru utuh": "Berkas out/a.txt berukuran 12 B dengan sha 0a1b2c3d, diverifikasi ulang.",
  };
  const m = /## 3\.[\s\S]*?```json\n([\s\S]*?)```/.exec(doc);
  if (m === null) throw new Error("blok JSON §3 how-to tidak ditemukan");
  const s4 = /## 4\.[\s\S]*?(?=\n## 5\.)/.exec(doc)?.[0] ?? "";
  const edits = [1, 2, 3, 4].map((k) => {
    const line = new RegExp(`^${k}\\. .*?\`(\\{.*?\\})\``, "m").exec(s4);
    if (line === null) throw new Error(`butir ${k} §4 how-to tanpa JSON`);
    return JSON.parse(fill(line[1], fixed));
  });
  const meta = /^5\. .*?"meta":(\{[^}]*\})/m.exec(s4);
  if (meta === null) throw new Error("butir 5 §4 how-to tanpa meta");
  return { s1: JSON.parse(fill(m[1], fixed)), edits, meta: JSON.parse(meta[1]) };
}

async function report(call: Call, mission: string, agentId: string, stamp: string): Promise<Step[]> {
  const steps: Step[] = [];
  const h = howto(mission, `lapkerja-implw10-${stamp}`, agentId);
  const w = await call("studio_write", h.s1);
  const id = w.data.documentId as string;
  steps.push({ step: "S1 studio_write payload how-to §3 apa adanya", ok: w.data.ok === true && typeof id === "string", note: brief(w, `rev ${w.data.revisionNo}; state ${w.data.state}; peringatan ${codes(w).join(",") || "-"}`) });
  if (typeof id !== "string") return steps;

  const e = await call("studio_edit", { documentId: id, edits: h.edits, meta: h.meta });
  const c1 = await content(call, id);
  const rec = c1.sections?.record ?? {};
  const items: any[] = rec.items ?? [];
  const b5 = items.find((i) => JSON.stringify(i).includes("X-B5"));
  const b1 = items.find((i) => JSON.stringify(i).includes("X-B1"));
  const bukti = JSON.stringify(chapter(c1, "3"));
  steps.push({
    step: "S2 studio_edit how-to §4 (cell, addRow 2 sel, append, find/replace, meta) dalam satu batch -> ok tanpa notApplied",
    ok: e.data.ok === true && (e.data.notApplied ?? []).length === 0 && rec.status === "complete" && b1?.status === "done" && /^K-[0-9a-f]{8}$/.test(String(b5?.key)) && b5?.status === "running" && items.length === 3 && bukti.includes("diverifikasi ulang") && bukti.includes("Isi paragraf nomor"),
    note: brief(e, `rev ${e.data.revisionNo}; edited ${(e.data.edited ?? []).join(",")}; status ${rec.status}; X-B1 ${b1?.status}; X-B5 ${b5?.key}/${b5?.status}; butir ${items.length}; peringatan ${codes(e).join(",") || "-"}`),
  });

  const s0 = await call("studio_edit", { documentId: id, edits: [{ section: "Bukti", append: [{ subheading: "Detail uji" }, "Isi detail sub-judul."] }] });
  const s1 = await call("studio_edit", { documentId: id, edits: [{ section: "Bukti", append: ["Tambahan di akhir section."] }] });
  const c2 = await content(call, id);
  const bl = blocksOf(c2, "3");
  // Bentuk blok sub-judul di proyeksi R20 tidak dipastikan di sini (peran/jenis); yang diuji = teksnya ada sebelum isi sub-judul.
  const iSub = bl.findIndex((b) => textOf(b) === "Detail uji" || JSON.stringify(b).includes('"Detail uji"'));
  steps.push({
    step: "S3 append ke section bersub-judul -> blok baru = blok terakhir bab, sesudah isi sub-judul",
    ok: s0.data.ok === true && s1.data.ok === true && iSub >= 0 && iSub < bl.length - 2 && textOf(bl.at(-1)) === "Tambahan di akhir section." && textOf(bl.at(-2)) === "Isi detail sub-judul.",
    note: `${brief(s0)}; ${brief(s1, `urutan ${bl.map((b) => (textOf(b) === "Detail uji" ? `[sub:${JSON.stringify(b).slice(0, 80)}]` : textOf(b).slice(0, 24))).join(" | ")}`)}`,
  });

  const v0 = await call("studio_edit", { documentId: id, meta: { verdict: "FAIL" } });
  const v1 = await call("studio_edit", { documentId: id, meta: { verdict: "PASS WITH ISSUES" } });
  const v2 = await call("studio_edit", { documentId: id, meta: { verdict: "PASS kecuali cek 3 gagal" } });
  const c3 = await content(call, id);
  steps.push({
    step: "S4 vonis bersyarat ('PASS WITH ISSUES', 'PASS kecuali cek 3 gagal') tidak dinaikkan; VERDICT_DROPPED tampil di ringkas; vonis tersimpan tetap FAIL",
    ok: v0.data.ok === true && codes(v1).includes("VERDICT_DROPPED") && codes(v2).includes("VERDICT_DROPPED") && v1.text.includes("VERDICT_DROPPED") && c3.sections?.record?.verdict === "FAIL",
    note: `${brief(v0)}; ${brief(v1, `peringatan ${codes(v1).join(",") || "-"}`)}; ${brief(v2, `peringatan ${codes(v2).join(",") || "-"}`)}; verdict ${c3.sections?.record?.verdict}`,
  });

  const at0 = c3.sections?.record?.reportedAt;
  const p = await call("studio_edit", { documentId: id, edits: [{ find: "Isi detail sub-judul.", replace: "Isi detail sub-judul diperbarui." }] });
  const c4 = await content(call, id);
  steps.push({
    step: "S5 sunting bab biasa -> hanya bab itu terkirim (record dan ReportedAt tidak berubah)",
    ok: p.data.ok === true && JSON.stringify(p.data.edited) === JSON.stringify(["bab 3"]) && c4.sections?.record?.reportedAt === at0,
    note: brief(p, `edited ${(p.data.edited ?? []).join(",")}; reportedAt ${at0} -> ${c4.sections?.record?.reportedAt}`),
  });
  return steps;
}

/**
 * S6/S7: laporan dengan sub-judul TERSIMPAN (`### Detail uji` lewat studio_report_submit MD; alat tulis menulis
 * {subheading} sebagai paragraf, jadi S3 tidak menghasilkan peran subheading di server). Append ke "Bukti" dan ke sasaran
 * berjudul sub-judul harus mendarat di akhir section (sesudah isi sub-judul).
 */
async function subheadingDoc(call: Call, mission: string, agentId: string, stamp: string): Promise<Step[]> {
  const steps: Step[] = [];
  const md = [
    `# Laporan uji sub-judul IMPL-W10 ${stamp}`, "", `mission: ${mission}`, `docKey: lapkerja-implw10-sub-${stamp}`, "Status: partial", "Verdict: PASS", `Owner: ${agentId}`, "Initiator: gsp-master01", "TaskRef: IMPL-W10", "ReportedAt: 2026-11-04T12:00+07:00", "",
    "## Ringkasan", "", "Uji append ke section bersub-judul.", "",
    "## Rincian kerja", "", "| key | judul | status |", "|---|---|---|", "| W10-S1 | Append sub-judul | running |", "",
    "## Bukti", "", "Bukti awal.", "", "### Detail uji", "", "Isi detail sub-judul.", "",
    "## Isu terbuka", "", "Tidak ada.", "",
    "## Langkah berikut", "", "Lanjut.", "",
  ].join("\n");
  const sub = await call("studio_report_submit", { markdown: md });
  const id = sub.data.documentId as string;
  const c0 = typeof id === "string" ? await content(call, id) : {};
  const sh = blocksOf(c0, "3").find((b) => textOf(b) === "Detail uji");
  steps.push({ step: "S6 studio_report_submit MD dengan '### Detail uji' -> sub-judul tersimpan (peran subheading)", ok: sub.data.ok === true && sh?.role === "subheading", note: brief(sub, `rev ${sub.data.revisionNo}; blok sub-judul ${JSON.stringify(sh ?? null).slice(0, 100)}`) });
  if (typeof id !== "string") return steps;
  const e1 = await call("studio_edit", { documentId: id, edits: [{ section: "Bukti", append: ["Tambahan di akhir section."] }] });
  const e2 = await call("studio_edit", { documentId: id, edits: [{ section: "Detail uji", append: ["Tambahan lewat sasaran sub-judul."] }] });
  const c1 = await content(call, id);
  const bl = blocksOf(c1, "3");
  const order = bl.map((b) => (b.role === "subheading" ? `[sub:${textOf(b)}]` : textOf(b)));
  steps.push({
    step: "S7 append ke 'Bukti' (bersub-judul) lalu ke sasaran 'Detail uji' -> keduanya di akhir section, sesudah isi sub-judul",
    ok: e1.data.ok === true && e2.data.ok === true && JSON.stringify(order) === JSON.stringify(["Bukti awal.", "[sub:Detail uji]", "Isi detail sub-judul.", "Tambahan di akhir section.", "Tambahan lewat sasaran sub-judul."]),
    note: `${brief(e1)}; ${brief(e2, `urutan ${order.join(" | ")}`)}`,
  });
  return steps;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if ((process.env.INTERNAL_API_SECRET ?? "") === "" || roots === "") {
    process.stderr.write("smoke-implw10: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-04_smoke-implw10");
  const agentId = argOf(argv, "--agent-id", "cod-implw10");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "write,reports" },
    stderr: "pipe",
  });
  const mcp = new Client({ name: "studio-mcp-smoke-implw10", version: "1.0.0" });
  await mcp.connect(transport);
  const log: string[] = [];
  const call: Call = async (name, args) => {
    for (let attempt = 0; ; attempt++) {
      const t0 = Date.now();
      const r: any = await mcp.callTool({ name, arguments: args });
      const data = r.structuredContent ?? {};
      if (data.code === "RATE_LIMITED" && attempt < 2) {
        await sleep(((data.retryAfterSec as number) ?? 20) * 1000);
        continue;
      }
      const text = String(r.content?.[0]?.text ?? "");
      log.push(`### ${name} ${JSON.stringify(args).slice(0, 200)}\n${text}`);
      return { isError: r.isError === true, data, text, bytes: Buffer.byteLength(JSON.stringify(r)), ms: Date.now() - t0 };
    }
  };
  const steps: Step[] = [];
  try {
    steps.push(...(await report(call, mission, agentId, stamp)));
    steps.push(...(await subheadingDoc(call, mission, agentId, stamp)));
  } finally {
    await mcp.close();
  }
  fs.writeFileSync(path.join(root, `smoke-implw10-${stamp}.log`), log.join("\n\n"));
  const ok = steps.every((s) => s.ok);
  process.stdout.write(`${JSON.stringify({ ok, mission, stamp, steps }, null, 2)}\n`);
  return ok ? 0 : 1;
}

main().then(
  (c) => {
    process.exitCode = c;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-implw10: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);
