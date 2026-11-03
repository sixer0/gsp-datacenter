/**
 * Uji asap stdio NYATA toolset `write` (IMPL-W, D-522): server.ts sebagai proses anak (klien SDK resmi,
 * `STUDIO_MCP_TOOLSETS=write`), lalu ke server Studio:
 *   tools/list (6 alat) -> studio_write 4 bagian (bab wajib kurang: SECTION_MISSING, 0 tulis) -> studio_write 5 bagian
 *   (tanpa kunci butir, judul alias, tanpa meta status: mesin memperbaiki; COMPLETE + render + sha) -> studio_edit 1
 *   (cari-ganti paragraf) -> studio_edit 2 (sel status butir + sisip paragraf) -> studio_edit find tak ada
 *   (TEXT_NOT_FOUND, 0 tulis) -> studio_file_verify (unduh ke STUDIO_MCP_FILE_ROOTS, sha cocok) -> studio_search
 *   (frasa hasil sunting ditemukan di dokumen ini).
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder kosong> npx tsx <repo>/scripts/studio/mcp/smoke-write.ts \
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-03_implw] [--agent-id cod-implw]
 *
 * Menulis satu laporan kerja nyata per jalan (docKey ber-cap waktu). 429 dihormati (tunggu lalu ulang sekali).
 * Keluar 0 semua lulus, 1 ada langkah gagal, 2 galat lingkungan. Rahasia tidak pernah dicetak.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const argOf = (argv: string[], name: string, def: string): string => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if (secret === "" || roots === "") {
    process.stderr.write("smoke-write: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib diisi\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-03_implw");
  const agentId = argOf(argv, "--agent-id", "cod-implw");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const docKey = `implw-smoke-${stamp}`;
  const phrase = `frasa-sunting-implw-${stamp}`;
  const steps: Array<{ step: string; ok: boolean; note: string }> = [];
  const outputs: string[] = [];
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "write" },
    stderr: "pipe",
  });
  const client = new Client({ name: "studio-mcp-smoke-write", version: "1.0.0" });
  await client.connect(transport);
  const tools = await client.listTools();
  steps.push({ step: "tools/list", ok: tools.tools.length === 6, note: `${tools.tools.map((t) => t.name).join(", ")} (${Buffer.byteLength(JSON.stringify(tools))} B)` });

  let calls = 0;
  const call = async (name: string, args: Record<string, unknown>) => {
    for (let attempt = 0; ; attempt++) {
      const t0 = Date.now();
      const r: any = await client.callTool({ name, arguments: args });
      calls++;
      const raw = JSON.stringify(r);
      outputs.push(raw);
      const data = r.structuredContent ?? {};
      if (data.error?.code === "RATE_LIMITED" && attempt === 0) {
        await sleep(15_000);
        continue;
      }
      return { isError: r.isError === true, data, text: String(r.content?.[0]?.text ?? ""), bytes: Buffer.byteLength(raw), ms: Date.now() - t0 };
    }
  };
  const note = (r: { isError: boolean; data: any; bytes: number; ms: number }, s: string) => `${s} [${r.bytes} B, ${r.ms} ms]${r.isError ? ` galat ${r.data.error?.code}` : r.data.ok === false ? ` ok:false ${r.data.code}: ${String(r.data.error?.message ?? "").slice(0, 200)}` : ""}`;

  const sections = [
    { heading: "Summary", blocks: [`Smoke IMPL-W: laporan ditulis lewat studio_write dari isi saja (cap ${stamp}).`] },
    { heading: "Rincian pekerjaan", blocks: ["Butir kerja:", [["Judul", "Status", "Bukti"], ["Bangun studio_write", "selesai", "scripts/studio/mcp/write-tools.ts"], ["Uji DEV", "in progress"]]] },
    { heading: "Bukti", blocks: [{ list: ["vitest mcp lulus", "tsc 0"] }] },
    { heading: "Risiko", blocks: ["Tidak ada isu terbuka saat smoke."] },
    { heading: "Next steps", blocks: ["Jalankan ronde 5."] },
  ];
  const w4 = await call("studio_write", { mission, docKey, sections: sections.slice(0, 4) });
  // IMPL-W3 butir 6: bab wajib kurang pada tulisan pertama = disimpan INCOMPLETE (hasil normal), bukan SECTION_MISSING.
  steps.push({ step: "studio_write 4 bagian (bab wajib kurang) -> INCOMPLETE", ok: !w4.isError && w4.data.ok === true && w4.data.state === "INCOMPLETE" && (w4.data.missing ?? []).length === 1, note: note(w4, `state ${w4.data.state} missing ${(w4.data.missing ?? []).join(",")}`) });

  const w = await call("studio_write", { mission, docKey, title: `Smoke IMPL-W ${stamp}`, sections });
  const documentId: string | null = w.data.documentId ?? null;
  const codes = (w.data.warnings ?? []).map((x: any) => x.code);
  steps.push({ step: "studio_write 5 bagian", ok: !w.isError && w.data.completeness?.status === "COMPLETE" && w.data.render?.verified === true, note: note(w, `doc ${documentId} ${w.data.docNumber} rev ${w.data.revisionNo} ${w.data.state}; perbaikan ${codes.join(",")}`) });
  if (documentId === null) return finish();

  const e1 = await call("studio_edit", { documentId, edits: [{ find: "Jalankan ronde 5.", replace: `Jalankan ronde 5 (${phrase}).` }] });
  steps.push({ step: "studio_edit 1 (paragraf)", ok: !e1.isError && e1.data.revisionNo > w.data.revisionNo && e1.data.basisRevisionNo === w.data.revisionNo, note: note(e1, `rev ${e1.data.revisionNo} basis ${e1.data.basisRevisionNo} bagian ${(e1.data.edited ?? []).join(",")}`) });
  const e2 = await call("studio_edit", { documentId, edits: [{ find: "running", replace: "done" }, { after: "Bangun studio_write", insert: "Kedua butir selesai sesudah smoke." }] });
  steps.push({ step: "studio_edit 2 (sel + sisip)", ok: !e2.isError && (e2.data.edited ?? []).includes("record") && e2.data.render?.verified === true, note: note(e2, `rev ${e2.data.revisionNo} bagian ${(e2.data.edited ?? []).join(",")}`) });
  const e3 = await call("studio_edit", { documentId, edits: [{ find: "teks yang tidak ada di laporan ini", replace: "x" }] });
  steps.push({ step: "studio_edit find tak ada", ok: e3.data.error?.code === "TEXT_NOT_FOUND" && e3.data.untrusted === true, note: note(e3, "0 tulis") });

  const fileId: string | null = e2.data.render?.fileId ?? w.data.render?.fileId ?? null;
  if (fileId !== null) {
    const fv = await call("studio_file_verify", { fileId, downloadDir: root });
    const saved: string | null = fv.data.savedTo ?? null;
    let good = false;
    let check = "tidak tersimpan";
    if (saved !== null && fs.existsSync(saved)) {
      const buf = fs.readFileSync(saved);
      const sha = crypto.createHash("sha256").update(buf).digest("hex");
      good = sha === e2.data.render?.sha256 && buf.toString("utf8").includes(phrase);
      check = `${path.basename(saved)} ${buf.length} B sha ${sha.slice(0, 16)} ${sha === e2.data.render?.sha256 ? "cocok" : "BEDA"}; memuat frasa sunting ${buf.toString("utf8").includes(phrase)}`;
    }
    steps.push({ step: "studio_file_verify (unduh)", ok: !fv.isError && fv.data.verified === true && good, note: note(fv, check) });
  }
  const s = await call("studio_search", { q: phrase, documentId });
  const hit = (s.data.hits ?? []).some((h: any) => h.documentId === documentId);
  steps.push({ step: "studio_search frasa sunting", ok: !s.isError && hit, note: note(s, `${(s.data.hits ?? []).length} hasil`) });
  return finish();

  async function finish(): Promise<number> {
    await client.close();
    const leaked = outputs.some((o) => o.includes(secret));
    steps.push({ step: "rahasia tidak keluar", ok: !leaked, note: `${outputs.length} hasil diperiksa` });
    const ok = steps.every((x) => x.ok);
    process.stdout.write(`${JSON.stringify({ ok, mission, docKey, calls, steps }, null, 2)}\n`);
    return ok ? 0 : 1;
  }
}

main().then(
  (c) => {
    process.exitCode = c;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-write: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);
