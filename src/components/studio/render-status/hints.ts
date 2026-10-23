/*
 * Petunjuk perbaikan kesiapan mesin cetak (S102), diturunkan dari respons R11.
 * Bahasa awam (FIX-4b, kamus UX-01 §1.2); setiap petunjuk menyebut langkah yang
 * bisa dilakukan operator. Rincian teknis (jalur berkas, variabel lingkungan,
 * perintah, kunci Windows) ada di `technical` dan hanya ditampilkan di Info
 * teknis (ADMIN). Studio sendiri tidak pernah memasang huruf atau mengubah
 * pengaturan Windows (KT-17).
 */

import type { RenderEnvStatusResponse } from "./types";

export type HintSeverity = "error" | "warn" | "info";

export interface FixHint {
  id: string;
  severity: HintSeverity;
  title: string;
  detail?: string;
  steps: string[];
  /** Rincian untuk admin (Info teknis): jalur, variabel, perintah. */
  technical?: string[];
}

const RECHECK_STEP =
  "Kembali ke halaman ini lalu minta administrator menekan “Periksa ulang kesiapan” (hasil pemeriksaan disimpan 5 menit).";

function fontList(names: string[], max = 6): string {
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")}, dan ${names.length - max} lainnya`;
}

export function deriveHints(data: RenderEnvStatusResponse): FixHint[] {
  const hints: FixHint[] = [];
  const { readiness, fonts, manifest } = data;
  const errors = readiness.errors;

  const manifestBroken = !manifest.readable || errors.some((e) => /manifest/i.test(e));
  if (manifestBroken) {
    hints.push({
      id: "manifest",
      severity: "error",
      title: "Daftar acuan lingkungan cetak tidak terbaca",
      detail: "Berkas daftar acuan hilang, rusak, atau tidak sesuai bentuk yang diharapkan.",
      steps: [
        "Pastikan berkas daftar acuan ada di repo HQ atau pengaturan lingkungan menunjuk berkas yang benar.",
        "Bila daftar acuan perlu disusun ulang, administrator menjalankan skrip penyusunnya (lihat Info teknis).",
        RECHECK_STEP,
      ],
      technical: [`Berkas: ${manifest.path}`, "Variabel: STUDIO_RENDER_ENV_MANIFEST", "Skrip: node render-env/build_manifest.mjs (render-env/README.md)"],
    });
  }

  if (!readiness.soffice.found) {
    hints.push({
      id: "soffice-missing",
      severity: "error",
      title: "Mesin cetak Word/PDF (LibreOffice) tidak ditemukan",
      detail: "Tanpa LibreOffice, PDF tidak dibuat. Word dan halaman web tetap dibuat.",
      steps: [
        "Pasang LibreOffice 24.2.3.2 di lokasi yang tercatat di daftar acuan, atau arahkan pengaturan lingkungan ke LibreOffice yang terpasang.",
        "Mulai ulang layanan HQ bila pengaturan lingkungan diubah.",
        RECHECK_STEP,
      ],
      technical: ["Variabel: SOFFICE_PATH (menunjuk soffice.com)"],
    });
  } else if (!readiness.soffice.versionOk) {
    hints.push({
      id: "soffice-version",
      severity: "error",
      title: "Versi LibreOffice tidak sesuai",
      detail: `Terpasang ${readiness.soffice.version ?? "tidak diketahui"}; konfigurasi cetak B memerlukan ${manifest.sofficeVersion ?? "24.2.3.2"} agar hasil PDF identik dengan kalibrasi.`,
      steps: [
        "Pasang LibreOffice dengan versi yang tepat (jangan memperbarui otomatis).",
        "Bila versi tidak terbaca, pastikan LibreOffice tidak sedang macet lalu periksa ulang.",
        RECHECK_STEP,
      ],
    });
  }

  const required = fonts.filter((f) => f.required);
  const missing = required.filter((f) => !f.fileExists);
  const mismatch = required.filter((f) => f.fileExists && !f.sha256Ok);
  const unregistered = required.filter((f) => f.fileExists && !f.registered);
  const tag = (f: { family: string; style: string }) => `${f.family} ${f.style}`;

  if (missing.length > 0) {
    hints.push({
      id: "fonts-missing",
      severity: "error",
      title: `${missing.length} berkas huruf tidak ada di disk`,
      detail: fontList(missing.map(tag)),
      steps: [
        "Pasang ulang huruf untuk akun Windows yang menjalankan HQ (klik kanan berkas .ttf, pilih “Instal”, bukan “Instal untuk semua pengguna”).",
        "Sumber berkas: bundel huruf DATUM (lihat Info teknis).",
        "Keluar (sign out) dari Windows lalu masuk kembali agar huruf dimuat.",
        RECHECK_STEP,
      ],
      technical: ["Panduan: bagian Fon di render-env/README.md"],
    });
  }

  if (mismatch.length > 0) {
    hints.push({
      id: "fonts-hash",
      severity: "error",
      title: `${mismatch.length} berkas huruf berbeda dari yang dikalibrasi`,
      detail: `${fontList(mismatch.map(tag))}. Isi berkas tidak cocok dengan sidik berkas di daftar acuan, sehingga tata letak PDF bisa bergeser.`,
      steps: [
        "Ganti berkas huruf dengan versi yang dipakai saat kalibrasi konfigurasi B.",
        "Bila huruf memang sengaja diperbarui, administrator mengkalibrasi ulang lalu menyusun ulang daftar acuan.",
        RECHECK_STEP,
      ],
      technical: ["Panduan: render-env/README.md"],
    });
  }

  if (unregistered.length > 0) {
    hints.push({
      id: "fonts-unregistered",
      severity: "error",
      title: `${unregistered.length} huruf belum dimuat untuk akun Windows ini`,
      detail: `${fontList(unregistered.map(tag))}. Berkasnya ada, tetapi belum dimuat Windows untuk pengguna ini.`,
      steps: [
        "Keluar (sign out) dari Windows lalu masuk kembali dengan akun yang menjalankan HQ. Windows memuat huruf per pengguna saat masuk.",
        "Bila masih belum dimuat, pasang ulang huruf tersebut untuk pengguna ini lalu masuk ulang.",
        "Studio tidak mengubah pengaturan Windows dan tidak memuat huruf sendiri.",
        RECHECK_STEP,
      ],
      technical: ["Kunci: HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts (hanya dibaca)"],
    });
  }

  const regFailed = errors.some((e) => /reg\.exe|registry check requires/i.test(e));
  if (regFailed) {
    hints.push({
      id: "registry-read",
      severity: "warn",
      title: "Daftar huruf Windows tidak dapat dibaca",
      detail: "Pemeriksaan pemuatan huruf gagal dijalankan, sehingga semua huruf dianggap belum dimuat.",
      steps: ["Pastikan HQ berjalan di Windows dengan akun pengguna biasa (bukan layanan sistem).", RECHECK_STEP],
      technical: ["Pemeriksaan memakai reg.exe query (hanya baca)"],
    });
  }

  if (!readiness.chromium.found) {
    hints.push({
      id: "chromium",
      severity: "info",
      title: "Pembuat PDF dari halaman web (Chromium) tidak ditemukan",
      detail: "Tahap yang memakai peramban (pratinjau dan pengubahan gambar) dapat gagal. Kesiapan PDF utama tidak bergantung padanya.",
      steps: [
        `Pasang Chromium versi yang tercatat di daftar acuan${manifest.chromiumVersion ? ` (${manifest.chromiumVersion})` : ""}, atau arahkan pengaturan lingkungan ke Chromium yang terpasang.`,
        RECHECK_STEP,
      ],
      technical: ["Variabel: STUDIO_CHROMIUM_PATH (menunjuk chrome.exe)"],
    });
  }

  if (!readiness.ready && hints.every((h) => h.severity === "info")) {
    hints.push({
      id: "generic",
      severity: "error",
      title: "Lingkungan cetak belum siap",
      detail: "Lihat Info teknis di bawah untuk penyebabnya.",
      steps: [RECHECK_STEP],
    });
  }
  return hints;
}
