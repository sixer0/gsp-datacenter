/**
 * Uji asap stdio NYATA jalur dokumen klien toolset `write` (IMPL-W2, D-522/D-527): server.ts sebagai proses anak
 * (`STUDIO_MCP_TOOLSETS=write`), lalu ke server Studio:
 *   studio_write template "latest" (3 bab: "1. Pendahuluan", "2. Kinerja" dengan dua tabel, satu tanpa caption,
 *   "6. Analisis" dengan grafik tanpa kode) -> studio_edit paragraf + sel tabel -> studio_edit data grafik (dicari dari
 *   keterangan) -> studio_file_verify unduh DOCX -> periksa DOCX: sampul memuat nomor meta (bukan nomor server saja),
 *   setiap tabel isi berketerangan "Tabel N.M", keterangan figur "Gambar 6.1" (N = nomor bab) -> studio_search frasa sunting.
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder kosong> npx tsx <repo>/scripts/studio/mcp/smoke-write-client.ts \
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-03_implw2] [--agent-id cod-implw2]
 *
 * Menulis satu dokumen klien nyata per jalan (docKey ber-cap waktu). 429 dihormati (tunggu, ulang sekali). Keluar 0 lulus,
 * 1 ada langkah gagal, 2 galat lingkungan. Rahasia tidak pernah dicetak.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const argOf = (argv: string[], name: string, def: string): string => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Satu entri zip (direktori pusat; stored/deflate) tanpa pustaka tambahan. */
export function zipEntry(buf: Buffer, name: string): string | null {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return null;
  let p = buf.readUInt32LE(eocd + 16);
  const n = buf.readUInt16LE(eocd + 10);
  for (let k = 0; k < n; k++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const xlen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42);
    const fname = buf.subarray(p + 46, p + 46 + nlen).toString("utf8");
    if (fname === name) {
      const lx = buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
      const data = buf.subarray(off + 30 + lx, off + 30 + lx + size);
      return (method === 8 ? zlib.inflateRawSync(data) : data).toString("utf8");
    }
    p += 46 + nlen + xlen + clen;
  }
  return null;
}

/** Paragraf teks DOCX (w:p -> gabungan w:t). */
export function docxParagraphs(xml: string): string[] {
  return (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? []).map((p) => (p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, "")).join("").replace(/&amp;/g, "&").trim());
}

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if (secret === "" || roots === "") {
    process.stderr.write("smoke-write-client: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib diisi\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-03_implw2");
  const agentId = argOf(argv, "--agent-id", "cod-implw2");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const docKey = `implw2-smoke-${stamp}`;
  const number = `GSP-W2-${stamp.slice(8)}`;
  const phrase = `frasa-klien-implw2-${stamp}`;
  const steps: Array<{ step: string; ok: boolean; note: string }> = [];
  const outputs: string[] = [];
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "write" },
    stderr: "pipe",
  });
  const client = new Client({ name: "studio-mcp-smoke-write-client", version: "1.0.0" });
  await client.connect(transport);
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
      return { isError: r.isError === true, data, bytes: Buffer.byteLength(raw), ms: Date.now() - t0 };
    }
  };
  const note = (r: { isError: boolean; data: any; bytes: number; ms: number }, s: string) => `${s} [${r.bytes} B, ${r.ms} ms]${r.isError || r.data.ok === false ? ` ${r.isError ? "galat" : "ok:false"} ${r.data.error?.code}: ${String(r.data.error?.message ?? "").slice(0, 200)} ${JSON.stringify(r.data.error?.details ?? null).slice(0, 300)}` : ""}`;

  const w = await call("studio_write", {
    mission,
    docKey,
    template: "latest",
    meta: { title: `Kajian Kesiapan GI Cikupa (smoke IMPL-W2 ${stamp})`, number, author: "Tim Kajian GSP", checker: "B. Santoso", approver: "C. Wibowo", rev: "A", classification: "Terbatas", source: "Rekap pemeliharaan Q3 2026" },
    sections: [
      { heading: "1. Pendahuluan", blocks: ["Kajian ini disusun untuk manajer aset GI Cikupa; jangkarnya indeks kesiapan Gardu C di bawah sasaran."] },
      {
        heading: "2. Kinerja Pemeliharaan",
        blocks: [
          "Capaian triwulan III 2026 per gardu.",
          { table: [["Gardu", "Indeks (%)"], ["A", 78], ["B", 70], ["C", 64]], caption: "Indeks kesiapan per gardu" },
          [["Peralatan", "Jumlah (unit)"], ["PMT", 12], ["PMS", 12]],
        ],
      },
      { heading: "6. Analisis Kesiapan", blocks: ["Gardu C di bawah sasaran 70 persen.", { chart: { categories: ["A", "B", "C"], series: [{ name: "Indeks", values: [78, 70, 64] }], caption: "Indeks kesiapan gardu triwulan III" } }] },
    ],
  });
  const id: string | null = w.data.documentId ?? null;
  steps.push({ step: "studio_write klien (3 bab, 2 tabel, 1 grafik)", ok: !w.isError && w.data.completeness?.status === "COMPLETE" && w.data.render?.verified === true, note: note(w, `doc ${id} ${w.data.docNumber} rev ${w.data.revisionNo} ${w.data.state}; bab ${(w.data.chapters ?? []).join(",")}; peringatan ${(w.data.warnings ?? []).map((x: any) => x.code).join(",")}`) });
  if (id === null) return finish();

  const e1 = await call("studio_edit", { documentId: id, edits: [{ find: "Gardu C di bawah sasaran 70 persen.", replace: `Gardu C di bawah sasaran 70 persen (${phrase}).` }, { find: "64", replace: "66" }] });
  steps.push({ step: "studio_edit paragraf + sel tabel", ok: !e1.isError && e1.data.basisRevisionNo === w.data.revisionNo && (e1.data.edited ?? []).length === 2, note: note(e1, `rev ${e1.data.revisionNo} basis ${e1.data.basisRevisionNo}; ${(e1.data.edited ?? []).join(",")}`) });
  const e2 = await call("studio_edit", { documentId: id, edits: [{ figure: "Indeks kesiapan gardu", chart: { series: [{ name: "Indeks", values: [80, 72, 66] }] } }] });
  steps.push({ step: "studio_edit data grafik (dari keterangan)", ok: !e2.isError && (e2.data.edited ?? []).some((x: string) => x.startsWith("figur")) && e2.data.render?.verified === true, note: note(e2, `rev ${e2.data.revisionNo}; ${(e2.data.edited ?? []).join(",")}`) });

  const fileId: string | null = e2.data.render?.fileId ?? null;
  if (fileId !== null) {
    const fv = await call("studio_file_verify", { fileId, downloadDir: root });
    const saved: string | null = fv.data.savedTo ?? null;
    steps.push({ step: "studio_file_verify (unduh DOCX)", ok: !fv.isError && fv.data.verified === true && saved !== null, note: note(fv, `${saved !== null ? path.basename(saved) : "-"}`) });
    if (saved !== null && fs.existsSync(saved)) {
      const xml = zipEntry(fs.readFileSync(saved), "word/document.xml") ?? "";
      const paras = docxParagraphs(xml);
      const coverIdx = paras.indexOf(number);
      const tableCaps = paras.filter((p) => /^Tabel \d+\.\d+/.test(p));
      const figCaps = paras.filter((p) => /^Gambar \d+\.\d+/.test(p));
      const contentTables = paras.filter((p) => p === "Gardu" || p === "Peralatan").length;
      steps.push({ step: "DOCX: sampul memuat nomor meta", ok: coverIdx >= 0 && paras[coverIdx - 1] === "Nomor dokumen", note: `nomor ${number} di paragraf ${coverIdx} (sebelumnya "${paras[coverIdx - 1] ?? "-"}")` });
      steps.push({ step: "DOCX: setiap tabel isi berketerangan", ok: tableCaps.length === 2 && contentTables === 2 && tableCaps[0].startsWith("Tabel 2.1") && tableCaps[1].startsWith("Tabel 2.2"), note: `${contentTables} tabel isi; keterangan: ${tableCaps.join(" | ")}` });
      steps.push({ step: "DOCX: keterangan figur Gambar 6.1 (N = nomor bab)", ok: figCaps.length === 1 && figCaps[0].startsWith("Gambar 6.1"), note: figCaps.join(" | ") || "tidak ada" });
      steps.push({ step: "DOCX: hasil sunting tercetak", ok: paras.some((p) => p.includes(phrase)) && paras.includes("66"), note: `frasa ${paras.some((p) => p.includes(phrase))}, sel 66 ${paras.includes("66")}` });
    }
  }
  const s = await call("studio_search", { q: phrase, documentId: id });
  steps.push({ step: "studio_search frasa sunting", ok: !s.isError && (s.data.hits ?? []).some((h: any) => h.documentId === id), note: note(s, `${(s.data.hits ?? []).length} hasil`) });
  return finish();

  async function finish(): Promise<number> {
    await client.close();
    steps.push({ step: "rahasia tidak keluar", ok: !outputs.some((o) => o.includes(secret)), note: `${outputs.length} hasil diperiksa` });
    const ok = steps.every((x) => x.ok);
    process.stdout.write(`${JSON.stringify({ ok, mission, docKey, displayNumber: number, calls, steps }, null, 2)}\n`);
    return ok ? 0 : 1;
  }
}

if (require.main === module) {
  main().then(
    (c) => {
      process.exitCode = c;
    },
    (e: unknown) => {
      process.stderr.write(`smoke-write-client: ${e instanceof Error ? e.message : String(e)}\n`);
      process.exitCode = 2;
    },
  );
}
