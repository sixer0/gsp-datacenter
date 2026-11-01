/**
 * Olah HTML pratinjau (S24, mode pratinjau) di sisi klien: daftar unit
 * halaman (`<section class="st-unit" data-unit data-unit-key>`) dan srcdoc
 * yang hanya memuat satu unit. HTML tidak pernah dieksekusi di dokumen induk:
 * DOMParser membuat dokumen inert (skrip tidak jalan), dan hasilnya hanya
 * ditampilkan di iframe ber-`sandbox` tanpa allow-scripts.
 */

export interface PreviewUnit {
  key: string;
  kind: string;
  label: string;
}

const KIND_LABEL: Readonly<Record<string, string>> = {
  cover: "Sampul",
  controlSheet: "Lembar kendali",
  toc: "Daftar isi",
  signature: "Pengesahan",
  part: "Bagian",
  chapter: "Bab",
  appendix: "Lampiran",
  orphan: "Blok lain",
};

export function unitLabel(kind: string, key: string): string {
  const base = KIND_LABEL[kind] ?? kind;
  if (kind === "chapter" || kind === "appendix") return `${base} ${key}`;
  if (kind === "part") return `${base} ${key.replace(/^F:/, "")}`;
  return base;
}

function parse(html: string): Document | null {
  if (typeof DOMParser === "undefined") return null;
  try {
    return new DOMParser().parseFromString(html, "text/html");
  } catch {
    return null;
  }
}

/** Unit halaman berurutan seperti di dokumen. */
export function listPreviewUnits(html: string): PreviewUnit[] {
  const doc = parse(html);
  if (!doc) return [];
  const out: PreviewUnit[] = [];
  doc.querySelectorAll("section[data-unit]").forEach((el) => {
    const kind = el.getAttribute("data-unit") ?? "";
    const key = el.getAttribute("data-unit-key") ?? (kind === "orphan" ? "orphan" : "");
    if (!kind || !key) return;
    // Hanya unit tingkat atas (bukan section bersarang di dalam unit lain).
    if (el.parentElement?.closest("section[data-unit]")) return;
    out.push({ key, kind, label: unitLabel(kind, key) });
  });
  return out;
}

/** 1 mm dalam px CSS (96 px per inci). */
export const PX_PER_MM = 96 / 25.4;

/**
 * UI-02 (UA-M01): lebar halaman terlebar (mm) dari atribut `data-page-mm="<lebar> <tinggi>"`
 * unit halaman; null bila tidak ada (HTML lama). Halaman mendatar ikut terhitung.
 */
export function maxPageWidthMm(html: string): number | null {
  let max = 0;
  const re = /data-page-mm="\s*([0-9]+(?:\.[0-9]+)?)\s+[0-9]+(?:\.[0-9]+)?\s*"/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const w = Number(m[1]);
    if (Number.isFinite(w) && w > max) max = w;
  }
  return max > 0 ? max : null;
}

/**
 * Faktor skala agar halaman muat di lebar panel (<= 1; tidak memperbesar). Dibulatkan ke
 * bawah per 0,01 agar srcdoc tidak berganti pada setiap piksel perubahan ukuran panel.
 */
export function fitZoom(panelWidthPx: number, pageWidthMm: number | null): number {
  if (!pageWidthMm || !Number.isFinite(panelWidthPx) || panelWidthPx <= 0) return 1;
  const z = panelWidthPx / (pageWidthMm * PX_PER_MM);
  if (z >= 1) return 1;
  return Math.max(0.1, Math.floor(z * 100) / 100);
}

/** Sisipkan aturan skala `html{zoom}` ke dokumen (tanpa skrip; iframe tetap ber-sandbox). */
function applyZoom(doc: Document, zoom: number): void {
  if (!(zoom > 0 && zoom < 1)) return;
  const style = doc.createElement("style");
  style.setAttribute("data-studio-preview-fit", "");
  style.textContent = `html{zoom:${zoom}}`;
  (doc.head ?? doc.documentElement).appendChild(style);
}

/**
 * srcdoc dengan satu unit saja (unit lain dibuang). `unitKey = null` atau
 * unit tidak ditemukan -> semua unit. `zoom < 1` (UI-02, UA-M01) menyisipkan skala
 * agar halaman muat di lebar panel; `zoom = 1` dan tanpa unit -> HTML utuh apa adanya.
 */
export function previewSrcDoc(html: string, unitKey: string | null, zoom = 1): string {
  const scaled = zoom > 0 && zoom < 1;
  if (!unitKey && !scaled) return html;
  const doc = parse(html);
  if (!doc) return html;
  if (unitKey) {
    const units = Array.from(doc.querySelectorAll("section[data-unit]")).filter(
      (el) => !el.parentElement?.closest("section[data-unit]"),
    );
    const keyOf = (el: Element) => el.getAttribute("data-unit-key") ?? (el.getAttribute("data-unit") === "orphan" ? "orphan" : "");
    if (units.some((el) => keyOf(el) === unitKey)) {
      for (const el of units) if (keyOf(el) !== unitKey) el.remove();
    } else if (!scaled) return html;
  }
  applyZoom(doc, zoom);
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}
