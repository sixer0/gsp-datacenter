/**
 * Logika murni tata letak form pengaturan (`ParamEditor`, D-632): kategori yang terbuka
 * sejak awal, Buka/Tutup semua, sorotan kata cari, ringkasan jumlah, dan penanda
 * "Saringan lain". Tanpa React agar dapat diuji langsung; hanya status tampilan, tanpa perubahan nilai.
 */

/** Bentuk minimum view kategori yang dibutuhkan helper ini (lihat `ParamCategoryView`). */
export interface CategoryViewLike {
  id: string;
  open: boolean;
  total: number;
  changed: number;
  category: { id: string; label: string };
  subgroups: ReadonlyArray<{ id: string; changed: number }>;
}

/**
 * Status buka awal: semua tertutup, kecuali kategori yang punya perubahan belum tersimpan
 * ("n diubah") beserta subkelompok yang memuat perubahan itu.
 */
export function defaultOpenIds(view: readonly CategoryViewLike[]): Set<string> {
  const ids = new Set<string>();
  for (const c of view) {
    if (c.changed <= 0) continue;
    ids.add(c.id);
    for (const s of c.subgroups) if (s.changed > 0) ids.add(s.id);
  }
  return ids;
}

/** Semua kategori yang tampil sedang terbuka? Daftar kosong = false. */
export function allCategoriesOpen(view: readonly Pick<CategoryViewLike, "open">[]): boolean {
  return view.length > 0 && view.every((c) => c.open);
}

/** Buka (`expand`) atau tutup semua kategori yang tampil; status subkelompok dipertahankan. */
export function setAllCategoriesOpen(view: readonly Pick<CategoryViewLike, "id">[], open: ReadonlySet<string>, expand: boolean): Set<string> {
  const next = new Set(open);
  for (const c of view) {
    if (expand) next.add(c.id);
    else next.delete(c.id);
  }
  return next;
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

/** Pecah teks menjadi bagian cocok/tidak terhadap kata cari (tanpa beda huruf besar). */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const out: HighlightPart[] = [];
  let i = 0;
  for (let at = lower.indexOf(q); at >= 0; at = lower.indexOf(q, i)) {
    if (at > i) out.push({ text: text.slice(i, at), match: false });
    out.push({ text: text.slice(at, at + q.length), match: true });
    i = at + q.length;
  }
  if (i < text.length) out.push({ text: text.slice(i), match: false });
  return out;
}

/** "Menampilkan 366 pengaturan" atau "Menampilkan 12 dari 366 pengaturan". */
export function resultSummary(shown: number, total: number): string {
  return shown === total ? `Menampilkan ${shown} pengaturan` : `Menampilkan ${shown} dari ${total} pengaturan`;
}

/**
 * Jumlah saringan di balik "Saringan lain" yang tidak pada nilai bawaan (kelas bukan "all",
 * nonaktif disembunyikan), untuk penanda di tombolnya.
 */
export function extraFilterCount(f: { classFilter: string; showInactive: boolean }): number {
  return (f.classFilter !== "all" ? 1 : 0) + (f.showInactive ? 0 : 1);
}
