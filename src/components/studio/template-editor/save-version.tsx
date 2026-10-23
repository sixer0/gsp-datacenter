"use client";

/**
 * Langkah 4 "Simpan versi" (UX-01 §3a, W3/W4 bawah; dibuat SR-29, dipakai
 * SR-28). Ringkasan perubahan berbahasa awam, catatan perubahan wajib, info
 * tetap D-153, satu tombol utama "Simpan versi n". Penyimpanan dilakukan
 * pemanggil (`onSave`); galat tindakan tampil inline dekat tombol (`role="alert"`).
 */
import { useId, useState, type ReactNode } from "react";
import { Save } from "lucide-react";
import { Button, Panel } from "@/components/ui/kit";

export const CHANGE_NOTE_MAX = 4000;

export interface SaveVersionProps {
  /** Baris perubahan awam, mis. "Ukuran kertas: A4 jadi F4". */
  changes: readonly string[];
  /** Versi yang sedang dipakai dokumen yang sudah dibuat. */
  currentVersionNo: number;
  /** Lempar galat bila gagal; pemanggil mengisi `error`. */
  onSave: (changeNote: string) => Promise<void>;
  /** Galat tindakan (teks awam dari `errorMessages`). */
  error?: string | null;
  /** Alasan tidak dapat menyimpan (baca saja, kerangka belum terbaca). */
  blockedReason?: string | null;
  /** Tindakan sekunder di samping tombol utama (mis. "Kembali ke Pengaturan"). */
  secondary?: ReactNode;
  className?: string;
}

export function SaveVersion({ changes, currentVersionNo, onSave, error, blockedReason, secondary, className = "" }: SaveVersionProps) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const noteId = useId();
  const noteErrId = useId();
  const reasonId = useId();
  const errId = useId();
  const next = currentVersionNo + 1;
  const empty = changes.length === 0;
  const reason = blockedReason ?? (empty ? "Belum ada perubahan untuk disimpan." : null);

  const submit = async () => {
    if (busy || reason) return;
    const trimmed = note.trim();
    if (!trimmed) {
      setNoteError("Tulis catatan singkat apa yang diubah dan mengapa.");
      return;
    }
    setNoteError(null);
    setBusy(true);
    try {
      await onSave(trimmed);
      setNote("");
    } catch {
      /* pemanggil menampilkan galat lewat `error` */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className={`p-5 ${className}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text)]">Simpan versi</h2>
          <p className="mt-1 text-[12.5px] text-[var(--text-2)]">Setiap simpan menjadi versi baru. Versi lama tetap utuh.</p>
        </div>

        <section aria-label="Perubahan yang akan disimpan">
          <h3 className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-[var(--text-2)]">Perubahan</h3>
          {empty ? (
            <p className="text-[13px] text-[var(--text-2)]">Belum ada perubahan.</p>
          ) : (
            <ul className="space-y-1 text-[13px] text-[var(--text)]">
              {changes.map((c) => (
                <li key={c} className="flex gap-2">
                  <span aria-hidden className="text-[var(--accent)]">
                    •
                  </span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div>
          <label htmlFor={noteId} className="mb-1 block text-[12.5px] font-medium text-[var(--text)]">
            Catatan perubahan <span className="text-[var(--text-2)]">(wajib)</span>
          </label>
          <textarea
            id={noteId}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={CHANGE_NOTE_MAX}
            rows={3}
            required
            aria-required="true"
            aria-invalid={noteError ? true : undefined}
            aria-describedby={noteError ? noteErrId : undefined}
            placeholder="Mis. kertas F4 untuk laporan lapangan klien A"
            className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
          />
          {noteError && (
            <p id={noteErrId} className="mt-1 text-[12.5px] text-[var(--down)]">
              {noteError}
            </p>
          )}
        </div>

        <p className="text-[12.5px] text-[var(--text-2)]">
          Dokumen yang sudah dibuat tetap memakai versi {currentVersionNo.toLocaleString("id-ID")}. Dokumen baru memakai versi ini.
        </p>

        {error && (
          <p id={errId} role="alert" className="text-[12.5px] text-[var(--down)]">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {secondary}
          <Button
            type="submit"
            variant="primary"
            ariaDisabled={busy || !!reason}
            ariaDescribedBy={[reason ? reasonId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined}
            className="whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
            {busy ? "Menyimpan…" : `Simpan versi ${next.toLocaleString("id-ID")}`}
          </Button>
        </div>
        {reason && (
          <p id={reasonId} className="text-right text-[12.5px] text-[var(--text-2)]">
            {reason}
          </p>
        )}
      </form>
    </Panel>
  );
}
