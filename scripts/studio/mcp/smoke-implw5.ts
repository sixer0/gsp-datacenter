/**
 * Uji asap stdio NYATA IMPL-W5 (D-557): server.ts (`STUDIO_MCP_TOOLSETS=write`) ke Studio DEV. Laporan kerja:
 * studio_write tanpa reportedAt (cap jam server), studio_edit { section, append }, { section, addRow } (kunci stabil +
 * status alias), batch berantai (jangkar teks hasil suntingan sebelumnya, jangkar paragraf yang diganti, sel dengan
 * kunci baris yang diubah), terapkan sebagian (notApplied), alias status + status tak terpetakan (butir tetap).
 * Dokumen klien: grafik batang bertumpuk r6 (kategori High..N/A), meta Rev 1 + nomor tampilan, addRow + append, lalu
 * DOCX diunduh: kaki halaman memuat nomor tampilan + REV 1, PNG grafik tanpa tinta di kolom tepi kiri.
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder> npx tsx scripts/studio/mcp/smoke-implw5.ts
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-04_smoke-implw5] [--agent-id cod-implw5]
 *
 * Keluar 0 lulus, 1 ada langkah gagal, 2 galat lingkungan. Rahasia tidak dicetak. 429 dihormati.
 */
import fs from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { unzipSync } from "fflate";
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
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/;
const codes = (r: Res): string[] => (r.data.warnings ?? []).map((w: any) => w.code);
const brief = (r: Res, extra = ""): string => `${r.data.ok === false ? `${r.data.code} ` : ""}${extra} [${r.bytes} B, ${r.ms} ms]`.trim();

async function content(call: Call, id: string): Promise<any> {
  const g = await call("studio_document_get", { documentId: id, view: "content" });
  return g.data.content ?? {};
}
const itemsOf = (c: any): Record<string, string> => Object.fromEntries((c.sections?.record?.items ?? []).map((i: any) => [i.key, i.status]));

async function report(call: Call, mission: string, docKey: string): Promise<Step[]> {
  const steps: Step[] = [];
  const w = await call("studio_write", { mission, docKey, meta: { status: "partial" }, sections: [
    { heading: "Ringkasan", blocks: ["Ringkasan awal uji asap IMPL-W5.", "Paragraf X yang akan diganti."] },
    { heading: "Rincian kerja", blocks: [[["key", "judul", "status", "bukti"], ["W5-1", "Bahan mentah: probe JSON", "running", "out/probe.json 120 B"], ["W5-2", "Uji refresh", "todo", ""]]] },
    { heading: "Bukti", blocks: ["Bukti awal."] },
    { heading: "Isu terbuka", blocks: ["Tidak ada."] },
    { heading: "Langkah berikut", blocks: ["Lanjut uji."] },
  ] });
  const id = w.data.documentId as string;
  steps.push({ step: "R1 studio_write laporan tanpa reportedAt -> ReportedAt jam server (+07:00)", ok: w.data.ok === true && STAMP.test(String(w.data.verify?.record?.reportedAt ?? "")), note: brief(w, `rev ${w.data.revisionNo}; reportedAt ${w.data.verify?.record?.reportedAt}`) });
  if (typeof id !== "string") return steps;

  const a = await call("studio_edit", { documentId: id, edits: [{ section: "Bukti", append: ["Paragraf bukti tambahan.", { list: ["vitest 18 lulus", "tsc 0"] }, { table: [["uji", "hasil"], ["smoke", "lulus"]], caption: "Hasil uji asap" }] }] });
  const c1 = await content(call, id);
  const b3 = (c1.sections?.content?.chapters ?? []).find((c: any) => c.key === "3")?.sections?.[0]?.blocks ?? [];
  steps.push({ step: "R2 append paragraf + daftar + tabel di akhir Bukti (urut, satu panggilan)", ok: a.data.ok === true && b3.map((b: any) => b.type).slice(-4).join(",") === "paragraph,list,table,paragraph", note: brief(a, `bab3 ${b3.map((b: any) => b.type).join(",")}; reportedAt ${a.data.verify?.record?.reportedAt}`) });

  const r = await call("studio_edit", { documentId: id, edits: [{ section: "Rincian kerja", addRow: ["", "Uji tambahan W5", "terblokir", "out/w5.txt 10 B"] }] });
  const it1 = itemsOf(await content(call, id));
  const gen = Object.entries(it1).find(([k]) => k.startsWith("K-"));
  steps.push({ step: "R3 addRow tabel butir: kunci stabil dibangkitkan, 'terblokir' -> blocked, butir masuk record", ok: r.data.ok === true && gen?.[1] === "blocked", note: brief(r, `items ${JSON.stringify(it1)}`) });

  const ch = await call("studio_edit", { documentId: id, edits: [
    { find: "Paragraf X yang akan diganti.", replace: "Paragraf X diganti, seed 909 atas byte yang sama." },
    { after: "seed 909 atas byte yang sama.", insert: "Sisipan berantai A." },
    { after: "Sisipan berantai A.", insert: "Sisipan berantai B." },
    { after: "Paragraf X yang akan diganti.", insert: "Sisipan pada jangkar lama." },
    { cell: { row: "Bahan mentah: probe JSON", column: "judul" }, value: "Data mentah probe" },
    { cell: { row: "Bahan mentah: probe JSON", column: "status" }, value: "done" },
  ] });
  const c2 = await content(call, id);
  const t1 = JSON.stringify((c2.sections?.content?.chapters ?? []).find((c: any) => c.key === "1"));
  steps.push({ step: "R4 batch berantai 6 suntingan (jangkar hasil suntingan, jangkar lama, kunci baris diubah) -> satu panggilan ok", ok: ch.data.ok === true && !ch.data.notApplied && ["Sisipan berantai A.", "Sisipan berantai B.", "Sisipan pada jangkar lama."].every((s) => t1.includes(s)) && itemsOf(c2)["W5-1"] === "done" && codes(ch).includes("ADDRESS_FROM_STORED"), note: brief(ch, `edited ${(ch.data.edited ?? []).join(",")}; W5-1 ${itemsOf(c2)["W5-1"]}; peringatan ${codes(ch).join(",")}`) });

  const p = await call("studio_edit", { documentId: id, edits: [{ find: "Lanjut uji.", replace: "Lanjut uji ronde 7." }, { after: "jangkar yang salah kutip sama sekali", insert: "X." }, { section: "Bab Fiktif", append: "Y." }] });
  steps.push({ step: "R5 terapkan sebagian: 1 tersimpan, 2 notApplied (TEXT_NOT_FOUND + kandidat), isError false", ok: p.isError === false && p.data.ok === true && JSON.stringify((p.data.notApplied ?? []).map((x: any) => x.edit)) === "[2,3]" && (p.data.edited ?? []).includes("bab 5"), note: brief(p, `notApplied ${JSON.stringify((p.data.notApplied ?? []).map((x: any) => [x.edit, x.code, x.seenState]))}`) });

  const s = await call("studio_edit", { documentId: id, edits: [{ cell: { row: "W5-2", column: "status" }, value: "butuh tinjauan" }, { cell: { row: "W5-1", column: "status" }, value: "setengah jadi" }] });
  const it3 = itemsOf(await content(call, id));
  steps.push({ step: "R6 alias 'butuh tinjauan' -> review; status tak terpetakan -> butir tetap (status lama), tidak ditolak", ok: s.data.ok === true && it3["W5-2"] === "review" && it3["W5-1"] === "done" && codes(s).includes("ITEM_STATUS_KEPT"), note: brief(s, `items ${JSON.stringify(it3)}; peringatan ${codes(s).join(",")}`) });
  steps.push({ step: "R7 reportedAt dicap ulang pada revisi suntingan", ok: STAMP.test(String(s.data.verify?.record?.reportedAt ?? "")), note: `awal ${w.data.verify?.record?.reportedAt}; akhir ${s.data.verify?.record?.reportedAt}` });
  return steps;
}

/** PNG 8 bit (RGB/RGBA) -> jumlah piksel bertinta per kolom x. */
function inkColumns(png: Buffer, xs: number[]): number[] {
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  const bpp = png[25] === 6 ? 4 : 3;
  const idat: Buffer[] = [];
  for (let o = 8; o < png.length; ) {
    const len = png.readUInt32BE(o);
    if (png.toString("ascii", o + 4, o + 8) === "IDAT") idat.push(png.subarray(o + 8, o + 8 + len));
    o += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const up = y > 0 ? px[(y - 1) * stride + x] : 0;
      const ul = y > 0 && x >= bpp ? px[(y - 1) * stride + x - bpp] : 0;
      const pp = a + up - ul;
      const pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - ul);
      const pr = f === 0 ? 0 : f === 1 ? a : f === 2 ? up : f === 3 ? (a + up) >> 1 : pa <= pb && pa <= pc ? a : pb <= pc ? up : ul;
      px[y * stride + x] = (v + pr) & 0xff;
    }
  }
  return xs.map((x) => {
    let n = 0;
    for (let y = 0; y < h; y++) if ((px[y * stride + x * bpp] + px[y * stride + x * bpp + 1] + px[y * stride + x * bpp + 2]) / 3 < 200) n++;
    return n;
  });
}

async function client(call: Call, mission: string, docKey: string, root: string): Promise<Step[]> {
  const steps: Step[] = [];
  const w = await call("studio_write", { mission, docKey, template: "latest", meta: { title: "Uji asap IMPL-W5", author: "Tim Uji GSP", number: "GSP-UD1-NL-001", rev: "Rev 0", source: "Uji asap IMPL-W5" }, sections: [
    { heading: "1. Pendahuluan", blocks: ["Dokumen uji asap untuk append, addRow, dan kaki halaman."] },
    { heading: "2. Risiko", blocks: [
      { table: [["Risiko", "Skor (poin)"], ["Akses data", 3], ["Jadwal", 2]], caption: "Skor risiko awal", source: "Uji asap IMPL-W5" },
      { chart: { categories: ["High", "Medium", "Low-Medium", "Low", "N/A"], series: [{ name: "Critical", values: [1, 2, 1, 0, 1] }, { name: "High", values: [2, 3, 1, 2, 0] }, { name: "Medium", values: [1, 1, 2, 1, 0] }], stacked: true, caption: "Jumlah ancaman per tingkat Likelihood", source: "Uji asap IMPL-W5" } },
    ] },
  ] });
  const id = w.data.documentId as string;
  steps.push({ step: "K1 studio_write dokumen klien (grafik batang bertumpuk r6, nomor tampilan GSP-UD1-NL-001)", ok: w.data.ok === true && typeof id === "string", note: brief(w, `state ${w.data.state}; figur ${JSON.stringify(w.data.verify?.figures)}`) });
  if (typeof id !== "string") return steps;
  const e = await call("studio_edit", { documentId: id, meta: { rev: "Rev 1", revisionNote: "Uji asap IMPL-W5" }, edits: [
    { section: "Risiko", addRow: ["Anggaran", "4"], table: "Skor risiko" },
    { section: "Pendahuluan", append: "Paragraf tambahan lewat append." },
  ] });
  steps.push({ step: "K2 studio_edit meta Rev 1 + addRow (table = teks keterangan) + append", ok: e.data.ok === true && !e.data.notApplied, note: brief(e, `edited ${(e.data.edited ?? []).join(",")}; meta ${JSON.stringify(e.data.verify?.meta ?? e.data.meta)}`) });
  const fileId = e.data.render?.fileId;
  const dl = await call("studio_file_verify", { fileId, downloadDir: root, overwrite: true });
  const saved = typeof dl.data.savedTo === "string" ? dl.data.savedTo : null;
  steps.push({ step: "K3 unduh DOCX akhir (sha256 cocok)", ok: saved !== null, note: brief(dl, `${saved}`) });
  if (saved === null) return steps;
  const zip = unzipSync(new Uint8Array(fs.readFileSync(saved)));
  const text = (n: string) => (Buffer.from(zip[n]).toString("utf8").match(/<w:t[^>]*>[^<]*<\/w:t>/g) ?? []).map((x) => x.replace(/<[^>]+>/g, "")).join("").replace(/ /g, " ");
  const foot = Object.keys(zip).filter((n) => /^word\/footer\d*\.xml$/.test(n)).map(text).join(" | ");
  steps.push({ step: "K4 kaki halaman: nomor tampilan GSP-UD1-NL-001 + REV 1, bukan nomor server / REV A", ok: foot.includes("GSP-UD1-NL-001") && /REV 1\b/.test(foot) && !/REV A\b/.test(foot) && !/\/GSP\/KT\//.test(foot), note: foot.slice(0, 200) });
  const body = text("word/document.xml");
  steps.push({ step: "K5 DOCX memuat baris addRow dan paragraf append", ok: body.includes("Anggaran") && body.includes("Paragraf tambahan lewat append."), note: `Anggaran ${body.includes("Anggaran")}; append ${body.includes("Paragraf tambahan lewat append.")}` });
  // PNG grafik = gambar yang paragrafnya bersebelahan dengan keterangan "Gambar ..." (gambar templat lain: segel, pita).
  const rels = Buffer.from(zip["word/_rels/document.xml.rels"]).toString("utf8");
  const target = (rid: string) => new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`).exec(rels)?.[1] ?? new RegExp(`Target="([^"]+)"[^>]*Id="${rid}"`).exec(rels)?.[1];
  const ps = Buffer.from(zip["word/document.xml"]).toString("utf8").match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];
  const ptext = (x: string | undefined) => (x?.match(/<w:t[^>]*>[^<]*<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, "")).join("");
  const pngs = [...new Set(ps.flatMap((x, i) => {
    const rid = /r:embed="([^"]+)"/.exec(x)?.[1];
    if (rid === undefined || ![ps[i - 1], ps[i + 1], ps[i + 2]].some((q) => /^Gambar\s/.test(ptext(q)))) return [];
    const t = target(rid);
    return t !== undefined ? [`word/${t.replace(/^\.?\//, "")}`] : [];
  }))].filter((n) => zip[n] !== undefined && n.endsWith(".png"));
  const cols = pngs.map((n) => ({ n, ink: inkColumns(Buffer.from(zip[n]), [0, 1, 2]) }));
  for (const p of pngs) fs.writeFileSync(path.join(root, `implw5-${path.basename(p)}`), Buffer.from(zip[p]));
  steps.push({ step: "K6 PNG grafik: kolom piksel x=0..2 tanpa tinta (label 'Low-Medium' utuh)", ok: cols.length >= 1 && cols.every((c) => c.ink.every((v) => v === 0)), note: cols.map((c) => `${path.basename(c.n)} ${c.ink.join("/")}`).join("; ") });
  return steps;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const roots = process.env.STUDIO_MCP_FILE_ROOTS ?? "";
  if ((process.env.INTERNAL_API_SECRET ?? "") === "" || roots === "") {
    process.stderr.write("smoke-implw5: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-04_smoke-implw5");
  const agentId = argOf(argv, "--agent-id", "cod-implw5");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "write" },
    stderr: "pipe",
  });
  const mcp = new Client({ name: "studio-mcp-smoke-implw5", version: "1.0.0" });
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
    steps.push(...(await report(call, mission, `implw5-lap-${stamp}`)));
    steps.push(...(await client(call, mission, `implw5-klien-${stamp}`, root)));
  } finally {
    await mcp.close();
  }
  fs.writeFileSync(path.join(root, `smoke-implw5-${stamp}.log`), log.join("\n\n"));
  const ok = steps.every((s) => s.ok);
  process.stdout.write(`${JSON.stringify({ ok, mission, stamp, steps }, null, 2)}\n`);
  return ok ? 0 : 1;
}

main().then(
  (c) => {
    process.exitCode = c;
  },
  (e: unknown) => {
    process.stderr.write(`smoke-implw5: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);
