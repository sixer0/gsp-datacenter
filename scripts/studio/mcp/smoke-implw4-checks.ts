/**
 * IMPL-W4: langkah dan cek `smoke-implw4.ts`. Dokumen klien r5b (bahan asli) + laporan kerja status/meta. DOCX akhir
 * diunduh lewat studio_file_verify ke akar STUDIO_MCP_FILE_ROOTS dan dibaca dengan pembaca DOCX smoke lama
 * (`smoke-write-client.ts`, bukan `write-verify.ts`), jadi cek isi DOCX independen dari ringkasan alat.
 */
import fs from "node:fs";
import path from "node:path";
import { unzipSync } from "fflate";
import { docxParagraphs, zipEntry } from "./smoke-write-client";
import { RV_DATA, RV_META, RV_TEXT, writeArgs } from "./ud-source";

/* eslint-disable @typescript-eslint/no-explicit-any -- structuredContent bebas bentuk */
export type Call = (name: string, args: Record<string, unknown>) => Promise<{ isError: boolean; data: any; text: string; bytes: number; ms: number }>;
type Step = { step: string; ok: boolean; note: string };

/** Judul sumber persis (bab-01..06.md, urutan.md), tingkat bab dan subbab. */
export const EXPECTED_HEADINGS = [
  "FM.1 Document control block",
  "FM.2 Executive summary",
  "FM.3 Notation, provenance glyphs, and reading guide",
  "Chapter 1. Introduction",
  "1.1 Product concept and use cases",
  "1.2 Mission scope and boundaries",
  "1.3 Constraints carried by the brief",
  "1.4 How this document is structured and how its evidence works",
  "Chapter 6. Security and Privacy Design",
  "6.1 Trust model: parties, assets, trust boundaries, the relay's exact status",
  "6.2 Threat matrix SEC-01 to SEC-21 and severity rollup",
  "6.3 End-to-end encryption design SD-01 to SD-08",
  "6.4 Privacy and user controls",
  "6.5 Mitigation-to-architecture traceability",
  "Chapter 10. Conclusions and Implications",
  "10.1 What the evidence supports today",
  "10.2 What remains contingent on validation",
  "10.3 Go / no-go logic for Phase 3 prototyping",
];
const squash = (s: string) => s.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/[\t  ]+/g, " ").trim();
const note = (r: Awaited<ReturnType<Call>>, s: string) => `${s} [${r.bytes} B, ${r.ms} ms]${r.data.ok === false ? ` ok:false ${r.data.code}: ${String(r.data.hint ?? "").slice(0, 140)}` : ""}`;

export async function checkClient(call: Call, o: { source: string; mission: string; docKey: string; root: string }): Promise<Step[]> {
  const steps: Step[] = [];
  const w = await call("studio_write", writeArgs(o.source, o.mission, o.docKey));
  const v = w.data.verify ?? {};
  const id: string | null = w.data.documentId ?? null;
  steps.push({ step: "S1 studio_write bahan r5b (template latest + meta meta.md)", ok: w.data.ok === true && w.data.state === "dibuat" && v.shaMatch === true, note: note(w, `doc ${id} rev ${w.data.revisionNo} ${w.data.completeness?.status}; numbering ${w.data.numbering}; peringatan ${(w.data.warnings ?? []).map((x: any) => x.code).join(",")}`) });
  steps.push({ step: "S1 ringkasan: 18 judul, 4 keterangan, figur 0 isu tata letak, nomor meta", ok: v.headingCount === 18 && v.captionCount === 4 && (v.figures ?? []).every((f: any) => f.layoutIssues === 0) && v.meta?.number === "GSP-UD1-NL-001", note: `judul ${v.headingCount}, keterangan ${v.captionCount}, figur ${JSON.stringify(v.figures)}, meta ${JSON.stringify(v.meta)}` });
  if (id === null) return steps;
  const e1 = await call("studio_edit", { documentId: id, edits: RV_TEXT });
  steps.push({ step: "RV-1 + RV-3 (teks; RV-3 di DALAM paragraf terakhir)", ok: e1.data.ok === true, note: note(e1, `edited ${(e1.data.edited ?? []).join(",")}`) });
  const e2 = await call("studio_edit", { documentId: id, edits: RV_DATA });
  steps.push({ step: "RV-2 (sel SEC-12 Likelihood) + RV-4 (data Gambar 6.1)", ok: e2.data.ok === true && (e2.data.verify?.figures ?? []).every((f: any) => f.layoutIssues === 0), note: note(e2, `edited ${(e2.data.edited ?? []).join(",")}; figur ${JSON.stringify(e2.data.verify?.figures)}`) });
  const g = await call("studio_document_get", { documentId: id, view: "content", chapter: "5" });
  const codes: string[] = JSON.stringify(g.data).match(/"code":"([A-Z]-\d{2})"/g) ?? [];
  steps.push({ step: "RV-4: bentuk grafik tetap batang bertumpuk K-01", ok: codes.includes('"code":"K-01"') && !codes.includes('"code":"P-03"'), note: codes.join(",") });
  const e3 = await call("studio_edit", { documentId: id, meta: RV_META });
  steps.push({ step: "meta Rev 1 lewat saluran meta studio_edit (gema rev tersimpan)", ok: e3.data.ok === true && e3.data.verify?.meta?.rev === "Rev 1", note: note(e3, `edited ${(e3.data.edited ?? []).join(",")}; meta ${JSON.stringify(e3.data.verify?.meta)}`) });
  const fileId = e3.data.render?.fileId;
  const dl = await call("studio_file_verify", { fileId, downloadDir: o.root, overwrite: true });
  const saved = typeof dl.data.savedTo === "string" ? dl.data.savedTo : null;
  steps.push({ step: "unduh DOCX akhir (sha256 cocok)", ok: saved !== null, note: note(dl, `${saved}`) });
  if (saved === null) return steps;
  const buf = fs.readFileSync(saved);
  const paras = docxParagraphs(zipEntry(buf, "word/document.xml") ?? "").map(squash);
  const body = paras.slice(paras.lastIndexOf(EXPECTED_HEADINGS[0]) >= 0 ? paras.lastIndexOf(EXPECTED_HEADINGS[0]) : 0);
  let at = 0;
  const found = EXPECTED_HEADINGS.map((h) => {
    const i = body.indexOf(h, at);
    if (i >= 0) at = i + 1;
    return i >= 0;
  });
  steps.push({ step: "DOCX: judul tercetak = judul sumber, persis dan berurutan", ok: found.every(Boolean), note: `${found.filter(Boolean).length}/${EXPECTED_HEADINGS.length}${found.every(Boolean) ? "" : ` hilang: ${EXPECTED_HEADINGS.filter((_, i) => !found[i]).join(" | ")}`}` });
  steps.push({ step: "DOCX: tanpa kicker CHAPTER/BAB, tanpa nomor ganda", ok: !paras.some((p) => /^(CHAPTER|BAB) \d+$/i.test(p)) && !paras.some((p) => /^\d+(\.\d+)+ \d+(\.\d+)+ /.test(p)), note: "kicker dan '4.1 1.1' tidak ada" });
  const caps = paras.filter((p) => /^(Tabel|Gambar) \S+ /.test(p) && p.length < 200);
  steps.push({ step: "DOCX: Tabel 6.1, Gambar 6.1, Tabel 6.2 (nomor bab sumber), Tabel FM.1", ok: ["Tabel 6.1 ", "Gambar 6.1 ", "Tabel 6.2 ", "Tabel FM.1 "].every((c) => caps.some((p) => p.startsWith(c))), note: caps.join(" | ") });
  const front = paras.slice(0, 80).join(" | ");
  steps.push({ step: "DOCX: nomor sampul dari meta + teks revisi penuh + Rev 0 tetap", ok: front.includes("GSP-UD1-NL-001") && paras.some((p) => p.includes("Rev 1, sesuai revisi.md")) && paras.some((p) => p === "Rev 0"), note: `GSP-UD1-NL-001 ${front.includes("GSP-UD1-NL-001")}; "Rev 1, sesuai revisi.md" ${paras.some((p) => p.includes("Rev 1, sesuai revisi.md"))}; baris Rev 0 ${paras.some((p) => p === "Rev 0")}` });
  steps.push({ step: "DOCX: RV-1 400, RV-3 menyatu di paragraf terakhir, RV-2 Medium-High", ok: paras.some((p) => p.includes("defaults of 400 bundles")) && paras.some((p) => p.includes("not as evidence that the system works. Revision note REV-UD1-03")) && paras.includes("Medium-High"), note: "cek teks" });
  const media = unzipSync(new Uint8Array(buf), { filter: (f) => /^word\/media\/fig-.*\.png$/.test(f.name) });
  const png = Object.entries(media).map(([n, b]) => ({ n, b: Buffer.from(b) })).filter((x) => x.b.length > 15000 && x.b.length < 60000);
  for (const p of png) fs.writeFileSync(path.join(o.root, path.basename(p.n)), p.b);
  steps.push({ step: "PNG Gambar 6.1 disimpan untuk pemeriksaan piksel", ok: png.length >= 1, note: png.map((p) => path.join(o.root, path.basename(p.n))).join(", ") });
  return steps;
}

export async function checkReport(call: Call, o: { mission: string; docKey: string }): Promise<Step[]> {
  const steps: Step[] = [];
  const five = [
    { heading: "Ringkasan", blocks: ["Ringkasan awal ronde 6."] },
    { heading: "Rincian kerja", blocks: [[["key", "judul", "status"], ["W4-1", "Perbaikan penomoran", "done"], ["W4-2", "Status meta", "running"]]] },
    { heading: "Bukti", blocks: ["Uji implw4 hijau."] },
    { heading: "Isu terbuka", blocks: ["Tidak ada."] },
    { heading: "Langkah berikut", blocks: ["Smoke DEV."] },
  ];
  const a = await call("studio_write", { mission: o.mission, docKey: o.docKey, meta: { status: "partial" }, sections: five });
  steps.push({ step: "laporan kerja lengkap, status partial", ok: a.data.ok === true && a.data.verify?.record?.status === "partial", note: note(a, `status tersimpan ${a.data.verify?.record?.status}`) });
  const b = await call("studio_write", { mission: o.mission, docKey: o.docKey, meta: { status: "blocked" }, sections: [{ heading: "Ringkasan", blocks: ["Terhambat akses data."] }] });
  steps.push({ step: "r5b: tulis parsial tanpa Rincian kerja + meta.status blocked -> tersimpan blocked", ok: b.data.ok === true && b.data.verify?.record?.status === "blocked", note: note(b, `status tersimpan ${b.data.verify?.record?.status}; peringatan ${(b.data.warnings ?? []).map((x: any) => x.code).join(",")}`) });
  const c = await call("studio_edit", { documentId: a.data.documentId, meta: { status: "complete", verdict: "pass" } });
  steps.push({ step: "studio_edit { meta: { status: complete, verdict: pass } } -> tersimpan", ok: c.data.ok === true && c.data.verify?.record?.status === "complete" && c.data.verify?.record?.verdict === "PASS", note: note(c, `record ${JSON.stringify(c.data.verify?.record)}`) });
  return steps;
}
