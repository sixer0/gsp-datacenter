/**
 * Titik mount UI dan navigasi Studio (01_specs.md §9, U71-U72).
 * Ikon terverifikasi di node_modules/lucide-react/dist/lucide-react.d.ts.
 */
import { Activity, FilePlus2, FileStack, FileText, FlaskConical, LayoutTemplate, Shapes, type LucideIcon } from "lucide-react";
import type { ParamValue } from "./types/common";
import type { StudioDocV1 } from "./types/doc";
import type { StudioTemplateV2 } from "./types/v2/template";

/** U71 — props `TemplatePreviewPane` (src/components/studio/template-preview, isi S101). */
export interface TemplatePreviewPaneProps {
  templateId: string;
  versionNo?: number;
  /**
   * @deprecated Jalur pratinjau v1 (override datar di `document.overrides`). Jalur v2
   * memakai `draftTemplate` dan mengabaikan medan ini; dibiarkan opsional untuk pemanggil lama.
   */
  draftOverrides?: Readonly<Record<string, ParamValue>>;
  /**
   * Draf `studio.template/v2` yang AKAN disimpan (preset + esensial + lanjutan ADMIN +
   * roleFormats ADMIN + kerangka beserta kenop slot), dikirim ke R08 sebagai `draftTemplate`
   * (FIX-V M5, FIX-Y). Bila kerangkanya berisi, pratinjau memakai jalur v2.
   */
  draftTemplate?: StudioTemplateV2;
  sampleDocument?: StudioDocV1;
  debounceMs?: number;
}

/** Siapa yang melihat entri navigasi (UX-01 §2.2). Penegakan tetap di server. */
export type StudioNavAudience = "all" | "admin";

export interface StudioNavEntry {
  href: string;
  /** Nama halaman lengkap (judul, remah roti). */
  label: string;
  /** Label ringkas untuk subnav Studio dan sidebar HQ (FIX-4a, UX-01 §2.3). */
  shortLabel: string;
  /** Label palet perintah, berawalan "Studio:" agar mudah dicari. */
  paletteLabel: string;
  /** `admin` = hanya ADMINISTRATOR (grup "Alat admin"). */
  audience: StudioNavAudience;
  /** Aktif hanya bila path persis sama (Beranda). */
  exact?: boolean;
  icon: LucideIcon;
  /** Nama ekspor lucide-react, untuk konsumen yang tidak bisa memakai komponen. */
  iconName: "FileStack" | "LayoutTemplate" | "FileText" | "Shapes" | "FlaskConical" | "Activity" | "FilePlus2";
}

/**
 * U72 — satu sumber navigasi Studio (FIX-4a; menutup S86 R14). Sidebar HQ,
 * palet perintah, dan subnav Studio diturunkan dari sini. Urutan UX-01 §2.1:
 * Beranda, Dokumen, Templat, Galeri artefak, lalu Alat admin.
 */
export const STUDIO_NAV: readonly StudioNavEntry[] = [
  { href: "/studio", label: "Beranda Studio", shortLabel: "Beranda", paletteLabel: "Studio: Beranda", audience: "all", exact: true, icon: FileStack, iconName: "FileStack" },
  { href: "/studio/documents", label: "Dokumen", shortLabel: "Dokumen", paletteLabel: "Studio: Dokumen", audience: "all", icon: FileText, iconName: "FileText" },
  { href: "/studio/templates", label: "Templat", shortLabel: "Templat", paletteLabel: "Studio: Templat", audience: "all", icon: LayoutTemplate, iconName: "LayoutTemplate" },
  { href: "/studio/artifacts", label: "Galeri artefak", shortLabel: "Galeri artefak", paletteLabel: "Studio: Galeri artefak", audience: "all", icon: Shapes, iconName: "Shapes" },
  { href: "/studio/playground", label: "Alat developer", shortLabel: "Alat developer", paletteLabel: "Studio: Alat developer", audience: "admin", icon: FlaskConical, iconName: "FlaskConical" },
  { href: "/studio/system", label: "Sistem", shortLabel: "Sistem", paletteLabel: "Studio: Sistem", audience: "admin", icon: Activity, iconName: "Activity" },
];

/**
 * Entri tindakan palet perintah (bukan halaman navigasi; UX-01 §2.3). Rute
 * `?buat=1` membuka dialog "Buat dokumen" di W5 (diimplementasikan SR-30).
 */
export const STUDIO_PALETTE_ACTIONS: readonly StudioNavEntry[] = [
  { href: "/studio/documents?buat=1", label: "Buat dokumen untuk misi", shortLabel: "Buat dokumen", paletteLabel: "Studio: Buat dokumen untuk misi…", audience: "all", icon: FilePlus2, iconName: "FilePlus2" },
];

/** Entri yang boleh tampil untuk peran tertentu (UI saja; server tetap menegakkan). */
export function studioNavFor(isAdmin: boolean, entries: readonly StudioNavEntry[] = STUDIO_NAV): StudioNavEntry[] {
  return entries.filter((e) => e.audience === "all" || isAdmin);
}

/** Judul metadata seragam UX-01 §2.3: "<Halaman> · Studio · GSP Swarm HQ". */
export function studioPageTitle(page: string): string {
  return `${page} · Studio · GSP Swarm HQ`;
}
