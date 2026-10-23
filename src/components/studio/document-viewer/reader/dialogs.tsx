"use client";

/*
 * Dialog tab Baca & sunting (SR-30; UX-01 W7, §3c, §5.3). Semua di atas
 * `<dialog>` bawaan lewat `shared/dialog` (Sheet/ConfirmDialog).
 *
 * - `ChangeSheet`   lembar perubahan: Apa yang diubah / Mengapa / Dampaknya (wajib, D-06)
 *                   + "Buat ulang berkas lengkap setelah disimpan" bila dokumen Lengkap.
 * - `ImageDialog`   ganti/sisip gambar: unggah PNG/JPG (R18), pratinjau lokal,
 *                   keterangan + sumber; tanpa medan ukuran (lebar dari templat).
 * - `MoveDialog`    pindahkan blok: tujuan dipilih dari daftar isi.
 * - `ConflictDialog` 409 SCOPE_CONFLICT dijelaskan awam: teks terbaru vs teks Anda,
 *                   Pakai teks terbaru / Tetap simpan teks saya (K-5) / Batal.
 */
import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/kit";
import { ConfirmDialog, Sheet } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { formatBytes } from "@/components/studio/shared/labels";
import { STUDIO_MAX_ASSET_BYTES } from "@/lib/studio/contract/env";
import { TextDiff } from "@/components/studio/revision/text-diff";

const FIELD =
  "w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-[invalid=true]:border-[var(--down)]";

function Field({
  label,
  value,
  onChange,
  invalid,
  hint,
  required = true,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : null, invalid ? errId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[12.5px] font-medium text-[var(--text)]">
        {label}
        {required ? <span className="text-[var(--text-2)]"> (wajib)</span> : <span className="text-[var(--text-2)]"> (opsional)</span>}
      </label>
      {multiline ? (
        <textarea id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} aria-describedby={describedBy} className={FIELD} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} aria-describedby={describedBy} className={FIELD} />
      )}
      {hint && (
        <p id={hintId} className="text-[12px] text-[var(--text-2)]">
          {hint}
        </p>
      )}
      {invalid && (
        <p id={errId} className="text-[12px] text-[var(--down)]">
          {label} wajib diisi.
        </p>
      )}
    </div>
  );
}

// ── Lembar perubahan ─────────────────────────────────────────────────────

export interface ChangeValues {
  what: string;
  why: string;
  impact: string;
  rerender: boolean;
}

export function ChangeSheet({
  open,
  title,
  defaultWhat,
  defaultImpact,
  canRerender,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  title: string;
  defaultWhat: string;
  defaultImpact: string;
  /** Dokumen Lengkap -> tampilkan kotak centang buat ulang berkas lengkap. */
  canRerender: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (v: ChangeValues) => void;
}) {
  const [what, setWhat] = useState(defaultWhat);
  const [why, setWhy] = useState("");
  const [impact, setImpact] = useState(defaultImpact);
  const [rerender, setRerender] = useState(false);
  const [tried, setTried] = useState(false);
  const errId = useId();

  function submit() {
    setTried(true);
    if (!what.trim() || !why.trim() || !impact.trim()) return;
    onSubmit({ what: what.trim(), why: why.trim(), impact: impact.trim(), rerender: canRerender && rerender });
  }

  return (
    <Sheet
      open={open}
      title={title}
      description="Catatan ini tersimpan di Riwayat dan dibaca peninjau berikutnya."
      onClose={onCancel}
      placement="center"
      dismissible={!busy}
      footer={
        <>
          <Button size="sm" onClick={onCancel} ariaDisabled={busy} className="whitespace-nowrap">
            Batal
          </Button>
          <Button size="sm" variant="primary" onClick={submit} ariaDisabled={busy} ariaDescribedBy={error ? errId : undefined} className="whitespace-nowrap">
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Apa yang diubah" value={what} onChange={setWhat} invalid={tried && !what.trim()} />
        <Field label="Mengapa" value={why} onChange={setWhy} invalid={tried && !why.trim()} hint="Misalnya: hasil inspeksi ulang 22 Okt 2026." />
        <Field label="Dampaknya" value={impact} onChange={setImpact} invalid={tried && !impact.trim()} />
        {canRerender && (
          <label className="flex items-start gap-2 text-[12.5px] text-[var(--text)]">
            <input type="checkbox" checked={rerender} onChange={(e) => setRerender(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
            Buat ulang berkas lengkap (PDF dan Word) setelah disimpan
          </label>
        )}
        {error && (
          <p id={errId} role="alert" className="text-[12.5px] text-[var(--down)]">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  );
}

// ── Gambar ───────────────────────────────────────────────────────────────

const IMAGE_TYPES = new Set(["image/png", "image/jpeg"]);

export interface ImageDialogResult {
  file: File | null;
  caption: string;
  source: string;
}

export function ImageDialog({
  open,
  title,
  initialCaption = "",
  initialSource = "",
  requireFile,
  busy,
  error,
  onCancel,
  onContinue,
}: {
  open: boolean;
  title: string;
  initialCaption?: string;
  initialSource?: string;
  /** Ganti paragraf / sisip = wajib berkas; ubah keterangan gambar = opsional. */
  requireFile: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onContinue: (r: ImageDialogResult) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [caption, setCaption] = useState(initialCaption);
  const [source, setSource] = useState(initialSource);
  const [tried, setTried] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);
  const maxLabel = formatBytes(STUDIO_MAX_ASSET_BYTES);

  function pick(f: File | null | undefined) {
    if (!f) return;
    if (!IMAGE_TYPES.has(f.type)) {
      setFileError("Gunakan berkas PNG atau JPG. Gambar SVG belum dapat dipakai di dokumen.");
      return;
    }
    if (f.size > STUDIO_MAX_ASSET_BYTES) {
      setFileError(`Ukuran berkas ${formatBytes(f.size)} melebihi batas ${maxLabel}.`);
      return;
    }
    setFileError(null);
    setFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files?.[0]);
  }

  function next() {
    setTried(true);
    if (requireFile && !file) {
      setFileError("Pilih gambar lebih dulu.");
      return;
    }
    if (!caption.trim() || !source.trim()) return;
    onContinue({ file, caption: caption.trim(), source: source.trim() });
  }

  return (
    <Sheet
      open={open}
      title={title}
      onClose={onCancel}
      placement="center"
      dismissible={!busy}
      footer={
        <>
          <Button size="sm" onClick={onCancel} ariaDisabled={busy} className="whitespace-nowrap">
            Batal
          </Button>
          <Button size="sm" variant="primary" onClick={next} ariaDisabled={busy} className="whitespace-nowrap">
            {busy ? "Mengunggah…" : "Lanjut"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-6 text-center ${
            drag ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : "border-[var(--line-strong)]"
          }`}
        >
          <ImagePlus className="h-6 w-6 text-[var(--text-2)]" strokeWidth={2} aria-hidden />
          <p className="text-[13px] text-[var(--text)]">
            Tarik berkas ke sini atau{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-[var(--accent)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              pilih berkas
            </button>
          </p>
          <p className="text-[12px] text-[var(--text-2)]">PNG atau JPG, maksimal {maxLabel}</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>
        {fileError && (
          <p role="alert" className="text-[12.5px] text-[var(--down)]">
            {fileError}
          </p>
        )}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal (object URL), bukan aset statis
          <img src={preview} alt="Pratinjau gambar yang dipilih" className="mx-auto max-h-56 max-w-full rounded-[8px] bg-white" />
        )}
        {!requireFile && !file && <p className="text-[12px] text-[var(--text-2)]">Biarkan kosong untuk tetap memakai gambar yang sama.</p>}
        <Field label="Keterangan gambar" value={caption} onChange={setCaption} invalid={tried && !caption.trim()} />
        <Field
          label="Sumber"
          value={source}
          onChange={setSource}
          invalid={tried && !source.trim()}
          hint="Standar DATUM mewajibkan sumber gambar, misalnya: Inspeksi lapangan 22 Okt 2026."
        />
        <p className="text-[12px] text-[var(--text-2)]">Ukuran dan nomor gambar diatur otomatis oleh templat.</p>
        {error && (
          <p role="alert" className="text-[12.5px] text-[var(--down)]">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

// ── Pindah ───────────────────────────────────────────────────────────────

export interface MoveTarget {
  value: string;
  label: string;
  group: string;
  to: { before?: string; after?: string; section?: { chapterKey: string; sectionNo: number; at: number } };
}

export function MoveDialog({
  open,
  title,
  targets,
  onCancel,
  onPick,
}: {
  open: boolean;
  title: string;
  targets: MoveTarget[];
  onCancel: () => void;
  onPick: (t: MoveTarget) => void;
}) {
  const [value, setValue] = useState("");
  const id = useId();
  const groups = useMemo(() => [...new Set(targets.map((t) => t.group))], [targets]);
  const chosen = targets.find((t) => t.value === value) ?? null;
  return (
    <Sheet
      open={open}
      title={title}
      description="Pilih tujuan dari daftar isi dokumen. Penomoran akan menyesuaikan."
      onClose={onCancel}
      placement="center"
      footer={
        <>
          <Button size="sm" onClick={onCancel} className="whitespace-nowrap">
            Batal
          </Button>
          <Button size="sm" variant="primary" ariaDisabled={!chosen} onClick={() => chosen && onPick(chosen)} className="whitespace-nowrap">
            Lanjut
          </Button>
        </>
      }
    >
      <label htmlFor={id} className="block text-[12.5px] font-medium text-[var(--text)]">
        Tujuan
      </label>
      <select id={id} value={value} onChange={(e) => setValue(e.target.value)} className={`${FIELD} mt-1`}>
        <option value="">Pilih tujuan…</option>
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {targets
              .filter((t) => t.group === g)
              .map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </Sheet>
  );
}

// ── Konflik ──────────────────────────────────────────────────────────────

export function ConflictDialog({
  open,
  changedBy,
  changedInVersion,
  latestText,
  myText,
  error,
  onUseLatest,
  onKeepMine,
  onCancel,
}: {
  open: boolean;
  changedBy: string | null;
  changedInVersion: number | null;
  latestText: string;
  myText: string;
  error: string | null;
  onUseLatest: () => void;
  onKeepMine: () => Promise<void>;
  onCancel: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const who = changedBy ?? "pengguna lain";
  const msg = errorMessages({ code: "SCOPE_CONFLICT", status: 409 }, { changedBy: who, changedInVersion });
  return (
    <>
      <Sheet
        open={open && !confirm}
        title={msg.title}
        description={msg.body}
        onClose={onCancel}
        placement="center"
        footer={
          <>
            <Button size="sm" onClick={onCancel} className="whitespace-nowrap">
              Batal
            </Button>
            <Button size="sm" onClick={() => setConfirm(true)} className="whitespace-nowrap">
              Tetap simpan teks saya
            </Button>
            <Button size="sm" variant="primary" onClick={onUseLatest} className="whitespace-nowrap">
              Pakai teks terbaru
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="space-y-1">
            <h3 className="text-[12.5px] font-medium text-[var(--text)]">Teks terbaru</h3>
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-[13px] leading-relaxed text-[var(--text)]">
              <TextDiff before={myText} after={latestText} />
            </div>
          </section>
          <section className="space-y-1">
            <h3 className="text-[12.5px] font-medium text-[var(--text)]">Teks Anda</h3>
            <div className="whitespace-pre-wrap rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-[13px] leading-relaxed text-[var(--text)]">{myText}</div>
          </section>
        </div>
        <p className="mt-3 text-[12px] text-[var(--text-2)]">
          Pakai teks terbaru mengisi editor dengan teks terbaru; teks Anda disalin ke papan klip agar dapat ditempel kembali.
        </p>
        {error && (
          <p role="alert" className="mt-2 text-[12.5px] text-[var(--down)]">
            {error}
          </p>
        )}
      </Sheet>
      <ConfirmDialog
        open={open && confirm}
        title="Simpan teks Anda?"
        description={`Teks ${who}${changedInVersion ? ` di versi ${changedInVersion}` : ""} akan diganti teks Anda. Teks mereka tetap ada di Riwayat.`}
        confirmLabel="Simpan teks saya"
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await onKeepMine();
          setConfirm(false);
        }}
        error={error}
      />
    </>
  );
}
