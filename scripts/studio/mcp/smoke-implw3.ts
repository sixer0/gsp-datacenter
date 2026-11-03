/**
 * Uji asap stdio NYATA IMPL-W3 (D-534): memutar ulang pola gagal ronde 5 lewat server.ts sebagai proses anak
 * (`STUDIO_MCP_TOOLSETS=write`) ke server Studio DEV. Setiap langkah harus berhasil ATAU memberi satu hasil normal
 * (`isError` absen) yang dapat ditindaklanjuti; tidak satu pun hasil yang dapat diperbaiki boleh `isError: true`.
 *
 *   INTERNAL_API_SECRET=... STUDIO_MCP_FILE_ROOTS=<folder kosong> npx tsx <repo>/scripts/studio/mcp/smoke-implw3.ts \
 *     [--base-url http://127.0.0.1:9021] [--mission 2026-11-03_implw3] [--agent-id cod-implw3]
 *
 * Menulis satu laporan kerja dan satu dokumen klien per jalan (docKey ber-cap waktu). 429 dihormati. Keluar 0 lulus,
 * 1 ada langkah gagal, 2 galat lingkungan. Rahasia tidak pernah dicetak.
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { isGenuineFailure } from "./outcome";
import { docxParagraphs, zipEntry } from "./smoke-write-client";

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
    process.stderr.write("smoke-implw3: env INTERNAL_API_SECRET dan STUDIO_MCP_FILE_ROOTS wajib diisi\n");
    return 2;
  }
  const root = path.resolve(roots.split(path.delimiter)[0]);
  const baseUrl = argOf(argv, "--base-url", "http://127.0.0.1:9021");
  const mission = argOf(argv, "--mission", "2026-11-03_implw3");
  const agentId = argOf(argv, "--agent-id", "cod-implw3");
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const steps: Array<{ step: string; ok: boolean; note: string }> = [];
  const outputs: string[] = [];
  const correctableIsError: string[] = [];
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [require.resolve("tsx/cli"), path.join(__dirname, "server.ts")],
    env: { ...(process.env as Record<string, string>), STUDIO_BASE_URL: baseUrl, STUDIO_AGENT_ID: agentId, STUDIO_MCP_TOOLSETS: "write" },
    stderr: "pipe",
  });
  const client = new Client({ name: "studio-mcp-smoke-implw3", version: "1.0.0" });
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
      if (data.code === "RATE_LIMITED" && attempt < 2) {
        await sleep(20_000);
        continue;
      }
      if (data.ok === false && r.isError === true && !isGenuineFailure(String(data.code), data.error?.httpStatus)) correctableIsError.push(`${name}:${data.code}`);
      return { isError: r.isError === true, data, bytes: Buffer.byteLength(raw), ms: Date.now() - t0 };
    }
  };
  type R = Awaited<ReturnType<typeof call>>;
  const note = (r: R, s: string) => `${s} [${r.bytes} B, ${r.ms} ms]${r.data.ok === false ? ` ok:false ${r.data.code} isError=${r.isError}: ${String(r.data.hint ?? "").slice(0, 160)}` : ""}`;
  const codes = (r: R) => (r.data.warnings ?? []).map((x: any) => x.code).join(",");

  // ── Laporan kerja ──
  const docKey = `implw3-lap-${stamp}`;
  const items = [["key", "judul", "status", "bukti"], ...Array.from({ length: 20 }, (_, i) => [`T-${i + 1}`, `Tugas nomor ${i + 1}`, "selesai", `out/${i + 1}.txt`])];
  const a1 = await call("studio_write", {
    mission,
    docKey,
    meta: { status: "selesai", verdict: "lulus dengan catatan", tanggal: "2026-11-03", nomor: 7, kategori: "uji", cardIds: "abc, t_0123abcd", taskRef: "IMPL W3 baris 4" },
    sections: [
      { title: "Ringkasan", content: [{ paragraph: "Ringkasan awal. Status proyek baik dan status tim baik." }] },
      { heading: "Rincian kerja", blocks: [{ rows: items }] },
    ],
  });
  const lapId: string | null = a1.data.documentId ?? null;
  steps.push({ step: "R5: tulis pertama kurang bab + meta tambahan + varian blok + vonis/kartu (dulu SECTION_MISSING/INVALID_ARGUMENT/CONTENT_INJECTION)", ok: !a1.isError && a1.data.ok === true && a1.data.state === "INCOMPLETE" && (a1.data.missing ?? []).length === 3 && a1.data.render === null, note: note(a1, `doc ${lapId} state ${a1.data.state} missing ${(a1.data.missing ?? []).join("|")} render ${a1.data.render === null ? "tidak" : "ya"}; peringatan ${codes(a1)}`) });
  if (lapId === null) return finish();
  const a2 = await call("studio_write", {
    mission,
    docKey,
    meta: { status: "selesai", verdict: "lulus dengan catatan" },
    sections: [
      { heading: "Ringkasan", blocks: ["Ringkasan awal. Status proyek baik dan status tim baik."] },
      { heading: "Rincian kerja", blocks: [items] },
      { heading: "Bukti", blocks: ["Bukti awal dengan angka 1,000 unit."] },
      { heading: "Isu terbuka", blocks: ["Tidak ada."] },
      { heading: "Langkah berikut", blocks: ["Lanjut ronde 5b."] },
    ],
  });
  steps.push({ step: "tulis kedua melengkapi bab -> COMPLETE + render", ok: !a2.isError && a2.data.completeness?.status === "COMPLETE" && a2.data.render?.verified === true, note: note(a2, `rev ${a2.data.revisionNo} ${a2.data.completeness?.status}`) });
  // Siklus 1 W3-M1: tulis ulang SEBAGIAN atas laporan sendiri yang lengkap -> bab lain + butir record tetap.
  const a2b = await call("studio_write", { mission, docKey, sections: [{ heading: "Ringkasan", blocks: ["Ringkasan awal. Status proyek baik dan status tim baik. Diperbarui."] }] });
  const g2 = await call("studio_document_get", { documentId: lapId, view: "content", slot: "record" });
  const items2 = JSON.stringify(g2.data).match(/"key":"T-\d+"/g)?.length ?? 0;
  steps.push({ step: "W3-M1: tulis ulang sebagian laporan lengkap -> butir record + bab lain tetap, missing kosong", ok: !a2b.isError && a2b.data.ok === true && (a2b.data.missing ?? []).length === 0 && codes(a2b).includes("RECORD_KEPT") && items2 >= 20, note: note(a2b, `written ${(a2b.data.written ?? []).join(",")}; butir record ${items2}; peringatan ${codes(a2b)}`) });
  const a3 = await call("studio_edit", { documentId: lapId, edits: [{ cell: { row: "T-7", column: "status" }, value: "running" }] });
  steps.push({ step: "R5: sel status (muncul 20 kali) lewat cell row+column", ok: !a3.isError && a3.data.ok === true && (a3.data.edited ?? []).length > 0, note: note(a3, `edited ${(a3.data.edited ?? []).join(",")}`) });
  const a4 = await call("studio_edit", { documentId: lapId, edits: [{ find: "done", replace: "running" }] });
  const cand = a4.data.error?.details?.candidates ?? [];
  steps.push({ step: "R5: kata tunggal ambigu -> hasil normal + kandidat cell siap salin", ok: !a4.isError && a4.data.code === "TEXT_AMBIGUOUS" && cand.length > 0 && cand[0].cell?.column !== undefined, note: note(a4, `${cand.length} kandidat; cell ${JSON.stringify(cand[0]?.cell ?? null)}`) });
  const a5 = await call("studio_edit", { documentId: lapId, edits: [{ find: "ANGKA 1000 UNIT", replace: "angka 1.200 unit" }] });
  steps.push({ step: "R5: find samar (huruf besar, 1000 vs 1,000)", ok: !a5.isError && a5.data.ok === true && codes(a5).includes("FUZZY_MATCH"), note: note(a5, `peringatan ${codes(a5)}`) });
  const a6 = await call("studio_edit", { documentId: lapId, edits: [{ find: "awal. Status", replace: "awal; Status" }] });
  steps.push({ step: "tanda baca persis (jangkar pendek)", ok: !a6.isError && a6.data.ok === true, note: note(a6, `rev ${a6.data.revisionNo}`) });
  const pv = await call("studio_document_get", { documentId: lapId, view: "paragraphs", chapter: "1" });
  const p1 = (pv.data.paragraphs ?? [])[0];
  steps.push({ step: "view=paragraphs memberi pid + teks polos", ok: !pv.isError && p1 !== undefined && typeof p1.pid === "string", note: note(pv, `${(pv.data.paragraphs ?? []).length} paragraf; pid ${p1?.pid ?? "-"}`) });
  if (p1 !== undefined) {
    const at = String(p1.text).indexOf(" dan status");
    const bad = await call("studio_edit", { documentId: lapId, edits: [{ pid: p1.pid, at, length: 4, replace: ", dan", expect: "xxxx" }] });
    steps.push({ step: "posisi dengan expect salah -> POSITION_MISMATCH hasil normal", ok: !bad.isError && bad.data.code === "POSITION_MISMATCH", note: note(bad, "") });
    const good = await call("studio_edit", { documentId: lapId, edits: [{ pid: p1.pid, at, length: 4, replace: ", dan", expect: " dan" }] });
    steps.push({ step: "posisi pid + at + expect diterapkan", ok: !good.isError && good.data.ok === true, note: note(good, `rev ${good.data.revisionNo}`) });
  }

  // ── Dokumen klien (bab bergaya sumber) ──
  const cKey = `implw3-klien-${stamp}`;
  const revText = "Rev 0, terbitan pertama untuk tinjauan klien";
  const sections = (fixed: boolean) => [
    { heading: "Ringkasan Eksekutif", blocks: ["Ringkasan untuk manajer aset;\nbaris ini ter-wrap keras\ndi sumber dengan `kode`."] },
    {
      heading: "4. Konsep Produk",
      blocks: [
        "Paragraf pembuka bab empat\nyang ter-wrap keras.",
        { subheading: "1.1 Product concept" },
        "Isi konsep produk.",
        { subheading: "1.2 Pasar sasaran" },
        { table: [["Gardu", "Status"], ["A", "siap"], ["B", "siap"], ["C", "tunda"]], caption: "Status gardu" },
      ],
    },
    {
      heading: "6. Analisis",
      blocks: [
        { chart: { categories: ["A", "B", "C"], series: [{ name: "Indeks", values: [78, 70, 64] }], caption: "Gambar 6.1 Kesiapan gardu", source: "Rekap pemeliharaan Q3 2026" } },
        { table: [["Gardu", "Daya"], ["A", "12"], ["B", "15"]], caption: fixed ? "Daya per gardu (MW)" : "Daya per gardu", ...(fixed ? { source: "Data SCADA 2026" } : {}) },
      ],
    },
  ];
  const meta = (fixed: boolean) => ({ title: `Kajian IMPL-W3 ${stamp}`, author: "Tim Riset GSP", revision: revText, kategori: "uji", ...(fixed ? { source: "Survei lapangan GSP 2026" } : {}) });
  const c1 = await call("studio_write", { mission, docKey: cKey, template: "latest", meta: meta(false), sections: sections(false) });
  const iss = (c1.data.error?.details?.issues ?? []).map((x: any) => x.code);
  steps.push({ step: "R5: tabel tanpa sumber/satuan -> SATU hasil normal berisi semua isu, 0 dokumen", ok: !c1.isError && c1.data.code === "CONTENT_INVALID" && iss.includes("SOURCE_MISSING") && iss.includes("TABLE_UNIT_MISSING"), note: note(c1, `isu ${iss.join(",")}`) });
  const c2 = await call("studio_write", { mission, docKey: cKey, template: "latest", meta: meta(true), sections: sections(true) });
  const cId: string | null = c2.data.documentId ?? null;
  steps.push({ step: "satu ulangan dengan sumber + satuan caption -> COMPLETE + DOCX", ok: !c2.isError && c2.data.completeness?.status === "COMPLETE" && c2.data.render?.verified === true, note: note(c2, `doc ${cId} bab ${(c2.data.chapters ?? []).join(",")}; peringatan ${codes(c2)}`) });
  if (cId !== null) {
    const ce = await call("studio_edit", { documentId: cId, edits: [{ cell: { row: "B", column: "Status" }, value: "tunda" }] });
    steps.push({ step: "klien: sel berulang ('siap' 2x) lewat cell", ok: !ce.isError && ce.data.ok === true, note: note(ce, `edited ${(ce.data.edited ?? []).join(",")}`) });
    const fileId: string | null = ce.data.render?.fileId ?? c2.data.render?.fileId ?? null;
    if (fileId !== null) {
      const fv = await call("studio_file_verify", { fileId, downloadDir: root, overwrite: true });
      const saved: string | null = fv.data.savedTo ?? null;
      steps.push({ step: "studio_file_verify segera sesudah render", ok: !fv.isError && fv.data.verified === true && saved !== null, note: note(fv, saved !== null ? path.basename(saved) : "-") });
      if (saved !== null && fs.existsSync(saved)) {
        const paras = docxParagraphs(zipEntry(fs.readFileSync(saved), "word/document.xml") ?? "");
        const all = paras.join("\n");
        steps.push({ step: "DOCX: sub-bab 4.1 tanpa nomor sumber ganda", ok: !/\b4\.1\s*1\.1\b/.test(all) && !all.includes("1.1 Product concept") && paras.some((p) => p.includes("Product concept")), note: paras.filter((p) => p.includes("Product concept")).slice(0, 3).join(" | ") });
        steps.push({ step: "DOCX: bab 4 dan 6 sesuai nomor eksplisit", ok: paras.some((p) => /Gambar 6\.1/.test(p)) && paras.some((p) => /Tabel 4\.1/.test(p)), note: paras.filter((p) => /^(Tabel|Gambar) \d/.test(p)).join(" | ") });
        steps.push({ step: "DOCX: caption tidak dobel", ok: !/Gambar 6\.1\.?\s*Gambar 6\.1/.test(all), note: paras.filter((p) => p.includes("Kesiapan gardu")).join(" | ") });
        steps.push({ step: "DOCX: tidak ada sumber karangan", ok: !/Diolah oleh|Compiled by/.test(all), note: `Diolah oleh ${/Diolah oleh/.test(all)}, Compiled by ${/Compiled by/.test(all)}` });
        steps.push({ step: "DOCX: revisi pendek + teks penuh", ok: paras.includes("Rev 0") && all.includes(revText), note: `"Rev 0" ${paras.includes("Rev 0")}, teks penuh ${all.includes(revText)}` });
        steps.push({ step: "DOCX: wrap keras digabung", ok: all.includes("baris ini ter-wrap keras di sumber dengan kode") || all.includes("baris ini ter-wrap keras di sumber dengan"), note: paras.filter((p) => p.includes("ter-wrap keras")).join(" | ").slice(0, 200) });
      }
    }
  }
  return finish();

  async function finish(): Promise<number> {
    await client.close();
    steps.push({ step: "tidak ada hasil dapat-diperbaiki yang isError", ok: correctableIsError.length === 0, note: correctableIsError.join(",") || `${outputs.length} hasil diperiksa` });
    steps.push({ step: "rahasia tidak keluar", ok: !outputs.some((o) => o.includes(secret)), note: `${outputs.length} hasil diperiksa` });
    const ok = steps.every((x) => x.ok);
    process.stdout.write(`${JSON.stringify({ ok, mission, calls, steps }, null, 2)}\n`);
    return ok ? 0 : 1;
  }
}

if (require.main === module) {
  main().then(
    (c) => {
      process.exitCode = c;
    },
    (e: unknown) => {
      process.stderr.write(`smoke-implw3: ${e instanceof Error ? e.message : String(e)}\n`);
      process.exitCode = 2;
    },
  );
}
