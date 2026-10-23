"use client";

/*
 * Pratinjau dan daftar berkas artefak (S62; FIX-4b: `fileUrl` bersama, Buka =
 * pratinjau di tab baru, Unduh = attachment; S86 R06, SEC-3).
 * - SVG dan PNG ditampilkan lewat <img> dari R10 `?inline=1` (SVG TIDAK
 *   disisipkan ke DOM, jadi skrip/tautan di dalamnya tidak pernah aktif).
 * - Halaman web dalam <iframe sandbox=""> (tanpa allow-scripts, tanpa same-origin; SEC-1).
 * - Word hanya ditawarkan untuk diunduh.
 * Latar putih: artefak DATUM dirancang untuk halaman cetak terang.
 */

import { useState } from "react";
import { Download, ExternalLink, ImageOff } from "lucide-react";
import type { OutputFileDto } from "@/lib/studio/contract/types/api";
import { reportClientError } from "@/components/studio/shared/client-log";
import { canOpenInline } from "@/components/studio/shared/file-url";
import { FORMAT_LABEL, formatBytes } from "@/components/studio/shared/labels";
import { fileUrl, previewFileOf, src } from "./api";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function formatName(f: OutputFileDto): string {
  return FORMAT_LABEL[f.format] ?? f.format;
}

export function ArtifactPreview({
  files,
  title,
  size = "card",
}: {
  files: readonly OutputFileDto[];
  title: string;
  size?: "card" | "large";
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const file = previewFileOf(files);
  const box = size === "large" ? "aspect-[4/3] w-full max-h-[70vh]" : "aspect-[4/3] w-full";
  const url = file ? fileUrl(file, "inline") : null;

  if (!file || !url || failed === file.id) {
    return (
      <div
        className={`${box} flex flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface-2)] text-[12px] text-[var(--text-2)]`}
        role="img"
        aria-label={`Pratinjau ${title} tidak tersedia`}
      >
        <ImageOff className="h-5 w-5" strokeWidth={2} aria-hidden />
        {failed ? "Pratinjau gagal dimuat" : "Pratinjau belum tersedia"}
      </div>
    );
  }

  if (file.format === "HTML") {
    return (
      <div className={`${box} overflow-hidden rounded-[10px] border border-[var(--line)] bg-white`}>
        <iframe src={url} title={`Pratinjau halaman web: ${title}`} sandbox="" referrerPolicy="no-referrer" loading="lazy" className="h-full w-full border-0" />
      </div>
    );
  }
  return (
    <div className={`${box} flex items-center justify-center overflow-hidden rounded-[10px] border border-[var(--line)] bg-white p-2`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- berkas R10 bersesi, dinamis, bukan aset statis */}
      <img
        src={url}
        alt={`Pratinjau ${formatName(file)}: ${title}`}
        loading="lazy"
        decoding="async"
        className="max-h-full max-w-full object-contain"
        onError={() => {
          reportClientError(`studio.ui.${src("preview")}`, new Error("preview image failed to load"), { fileId: file.id, format: file.format }, { level: "warn" });
          setFailed(file.id);
        }}
      />
    </div>
  );
}

/** Tombol Buka (pratinjau, bila formatnya dapat dipratinjau) dan Unduh per berkas. */
export function FileList({ files, title }: { files: readonly OutputFileDto[]; title: string }) {
  if (files.length === 0) {
    return <p className="text-[12px] text-[var(--text-2)]">Belum ada berkas.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={`Berkas ${title}`}>
      {files.map((f) => {
        const open = canOpenInline(f.format) ? fileUrl(f, "inline") : null;
        const download = fileUrl(f, "download");
        const name = formatName(f);
        return (
          <li key={f.id} className="inline-flex flex-wrap items-center gap-1">
            {open && (
              <a
                href={open}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] ${FOCUS}`}
                aria-label={`Buka ${name} ${f.fileName} di tab baru`}
                title={f.fileName}
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                <span className="font-medium">Buka {name}</span>
              </a>
            )}
            {download && (
              <a
                href={download}
                download={f.fileName}
                className={`btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] ${FOCUS}`}
                aria-label={`Unduh ${name} ${f.fileName} (${formatBytes(f.bytes)})`}
                title={f.fileName}
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                <span className="font-medium">{open ? "Unduh" : `Unduh ${name}`}</span>
                <span className="num text-[var(--text-2)]">{formatBytes(f.bytes)}</span>
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
