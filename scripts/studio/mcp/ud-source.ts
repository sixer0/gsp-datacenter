/**
 * IMPL-W4: bahan uji dokumen klien r5b (`doc_ud2b/source`) -> argumen `studio_write` (isi saja, seperti yang disusun
 * agen) + suntingan RV-1..RV-4. Dipakai `smoke-implw4.ts` dan `measure-write.ts`. Keterangan dan sumber tabel = pilihan
 * isi agen r5b DB (format_DB.txt butir 4-5); data Gambar 6.1 dari gambar.md (Rev 0) dan revisi.md RV-4 (Rev 1).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

type Block = string | Record<string, unknown>;
const ORDER = ["bab-01.md", "bab-02.md", "bab-03.md", "bab-04.md", "bab-05.md", "bab-06.md"];
const TABLES = [
  { caption: "Document control block", source: "contract.md (mission NEARLINK-1019, header block)" },
  { caption: "Threat register", source: "masterplan/02 section 3 (rated threat set)" },
  { caption: "Payload cipher candidate set", source: "masterplan/02 section 4.2 (candidate set)" },
];
export const CATS0 = ["High", "Medium", "Low-Medium", "Low", "N/A"];
export const SERIES0 = [{ name: "Critical", values: [0, 1, 1, 0, 1] }, { name: "High", values: [1, 5, 2, 3, 0] }, { name: "Medium", values: [3, 3, 1, 0, 0] }];
export const CATS1 = ["High", "Medium-High", "Medium", "Low-Medium", "Low", "N/A"];
export const SERIES1 = [{ name: "Critical", values: [0, 0, 1, 1, 0, 1] }, { name: "High", values: [1, 0, 5, 2, 3, 0] }, { name: "Medium", values: [3, 1, 2, 1, 0, 0] }];
export const FIG_CAPTION = "Jumlah ancaman per tingkat Likelihood dan Impact (Table 6.1)";

const cells = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

/** Satu berkas bab -> { heading, blocks }. */
function sectionOf(md: string, tableNo: { n: number }): { heading: string; blocks: Block[] } {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let heading = "";
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length > 0) blocks.push(para.join(" "));
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^##\s/.test(l) && heading === "") {
      heading = l.replace(/^##\s+/, "").trim();
      continue;
    }
    if (/^###\s/.test(l)) {
      flush();
      blocks.push({ subheading: l.replace(/^###\s+/, "").trim() });
      continue;
    }
    if (l.trim().startsWith("|")) {
      flush();
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        if (!/^\|?\s*:?-{3,}/.test(lines[i].trim())) rows.push(cells(lines[i]));
        i++;
      }
      i--;
      const t = TABLES[tableNo.n++] ?? { caption: "Table", source: "this document" };
      blocks.push({ table: rows, caption: t.caption, source: t.source });
      if (t.caption === "Threat register") blocks.push({ chart: { caption: FIG_CAPTION, source: "Table 6.1, bab 6 dokumen ini", categories: CATS0, series: SERIES0, stacked: true } });
      continue;
    }
    const li = /^\s*(?:[-*]|(\d+)\.)\s+(.*)$/.exec(l);
    if (li) {
      flush();
      const items: string[] = [];
      const ordered = li[1] !== undefined;
      while (i < lines.length && /^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
      i--;
      blocks.push({ list: items, ...(ordered ? { ordered: true } : {}) });
      continue;
    }
    if (l.trim() === "") flush();
    else para.push(l.trim());
  }
  flush();
  return { heading, blocks };
}

/** Argumen studio_write (template + meta dari meta.md + 6 bagian sumber). */
export function writeArgs(dir: string, mission: string, docKey: string): Record<string, unknown> {
  const tableNo = { n: 0 };
  const sections = ORDER.map((f) => sectionOf(readFileSync(path.join(dir, f), "utf8"), tableNo));
  return {
    mission,
    docKey,
    template: "latest",
    meta: { title: "NearLink Research Report and Production Plan", subtitle: "Excerpt edition (front matter, Chapter 1, Chapter 6, Chapter 10)", number: "GSP-UD1-NL-001", classification: "TERBATAS", author: "Tim Riset GSP", checker: "belum ditetapkan", approver: "belum ditetapkan", date: "2026-10-19", rev: "Rev 0, terbitan pertama", language: "EN" },
    sections,
  };
}

export const RV_TEXT = [
  { find: "the quota_block defaults of 500 bundles and 5 MB", replace: "the quota_block defaults of 400 bundles and 5 MB" },
  { find: "not as evidence that the system works.", replace: "not as evidence that the system works. Revision note REV-UD1-03: this sentence was added in Rev 1 to mark the close of the conclusions chapter and adds no new finding." },
];
export const RV_DATA = [
  { cell: { row: "SEC-12", column: "Likelihood" }, value: "Medium-High" },
  { figure: FIG_CAPTION, chart: { categories: CATS1, series: SERIES1 } },
];
export const RV_META = { rev: "Rev 1, sesuai revisi.md" };
