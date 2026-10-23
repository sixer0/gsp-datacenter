"use client";

/*
 * Mode Unggah aset (SR-31; UX-01 W11; R18): pilih PNG/JPEG, unggah
 * beralamat isi (sha256, idempoten), lalu salin `assetRef` atau pasang ke
 * kiriman bab di editor ("Pakai di kiriman bab"). Batas jenis dan ukuran
 * diperiksa di klien sebelum mengirim; server tetap menegakkan (413/415).
 */

import { useId, useRef } from "react";
import { CheckCircle2, ImageUp, Loader2 } from "lucide-react";
import { STUDIO_MAX_ASSET_BYTES } from "@/lib/studio/contract/env";
import { Button, Panel } from "@/components/ui/kit";
import { formatBytes, formatDateTime } from "@/components/studio/shared/labels";
import type { CooldownState } from "@/components/studio/shared/use-cooldown";
import { CopyText, RawResponse } from "./panels";
import type { AssetUploadResult } from "./types";

export function AssetPanel({
  busy,
  cooldown,
  missionFolder,
  result,
  onUpload,
  onUseInChapter,
  useTargetKey,
}: {
  busy: boolean;
  cooldown: CooldownState;
  missionFolder: string;
  result: AssetUploadResult | null;
  onUpload: (file: File) => void;
  onUseInChapter: (assetRef: string) => void;
  /** Kunci aset di kiriman bab yang akan diisi (null = tidak ada kiriman bab). */
  useTargetKey: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const blocked = cooldown.secondsLeft > 0 || cooldown.exhausted;
  const assetRef = result ? `sha256:${result.asset.sha256.replace(/^sha256:/, "")}` : null;
  return (
    <div className="space-y-4">
      <Panel className="space-y-3 p-4">
        <p id={hintId} className="text-[12.5px] text-[var(--text-2)]">
          PNG atau JPEG, maksimal {formatBytes(STUDIO_MAX_ASSET_BYTES)}. Unggahan berulang berkas yang sama memakai aset yang sudah ada.
          {missionFolder ? ` Aset ditautkan ke folder misi ${missionFolder}.` : ""}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          tabIndex={-1}
          aria-label="Pilih gambar untuk diunggah"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onUpload(f);
          }}
        />
        <Button
          variant="primary"
          onClick={() => {
            if (!busy && !blocked) fileRef.current?.click();
          }}
          ariaDisabled={busy || blocked}
          ariaDescribedBy={hintId}
          className="whitespace-nowrap"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImageUp className="h-4 w-4" aria-hidden />}
          {busy ? "Mengunggah..." : cooldown.secondsLeft > 0 ? `Pilih dan unggah gambar (${cooldown.secondsLeft} dtk)` : "Pilih dan unggah gambar"}
        </Button>
      </Panel>

      {result && assetRef && (
        <Panel className="space-y-3 p-4">
          <p className="flex items-center gap-2 text-[13px] font-medium text-[var(--text)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--up)]" aria-hidden />
            {result.created ? "Aset baru tersimpan" : "Aset sudah ada; dipakai ulang"}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12.5px]">
            <dt className="text-[var(--text-2)]">assetRef</dt>
            <dd className="flex min-w-0 items-center gap-1 font-mono text-[11.5px] text-[var(--text)] break-all">
              {assetRef}
              <CopyText text={assetRef} label="Salin assetRef" />
            </dd>
            <dt className="text-[var(--text-2)]">Ukuran</dt>
            <dd className="num text-[var(--text)]">
              {result.asset.widthPx} x {result.asset.heightPx} px · {formatBytes(result.asset.bytes)} · {result.asset.mime}
            </dd>
            <dt className="text-[var(--text-2)]">Disimpan</dt>
            <dd className="text-[var(--text)]">{formatDateTime(result.asset.createdAt)}</dd>
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onUseInChapter(assetRef)} ariaDisabled={!useTargetKey} className="whitespace-nowrap">
              Pakai di kiriman bab
            </Button>
            <span className="text-[11.5px] text-[var(--text-2)]">
              {useTargetKey ? `Mengisi aset "${useTargetKey}" di editor Kirim bab.` : "Muat kiriman bab yang memuat medan assets terlebih dahulu."}
            </span>
          </div>
          <RawResponse value={result} />
        </Panel>
      )}
    </div>
  );
}
