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

/**
 * srcdoc dengan satu unit saja (unit lain dibuang). `unitKey = null` atau
 * unit tidak ditemukan -> HTML utuh apa adanya.
 */
export function previewSrcDoc(html: string, unitKey: string | null): string {
  if (!unitKey) return html;
  const doc = parse(html);
  if (!doc) return html;
  const units = Array.from(doc.querySelectorAll("section[data-unit]")).filter(
    (el) => !el.parentElement?.closest("section[data-unit]"),
  );
  const keyOf = (el: Element) => el.getAttribute("data-unit-key") ?? (el.getAttribute("data-unit") === "orphan" ? "orphan" : "");
  if (!units.some((el) => keyOf(el) === unitKey)) return html;
  for (const el of units) if (keyOf(el) !== unitKey) el.remove();
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}
