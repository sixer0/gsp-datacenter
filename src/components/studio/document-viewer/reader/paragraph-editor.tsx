"use client";

/*
 * Sunting paragraf di tempat (SR-30; UX-01 §3c, W7).
 *
 * Area teks setinggi isi + bilah penanda makna v2 (Tebal, Miring, Kode,
 * Superskrip, Subskrip). Tidak ada pilihan huruf, warna, atau ukuran (D-139).
 * Penanda disimpan sebagai teks ringan (`**`, `*`, `` ` ``, `^`, `~`) lalu
 * diubah ke `runs` saat disimpan (doc-model `editorTextToRuns`).
 * Esc = batal (konfirmasi K-7 bila ada perubahan, oleh pemanggil);
 * Ctrl/Cmd+Enter = Simpan perubahan. Draf disimpan di localStorage (try/catch)
 * agar tidak hilang bila sesi berakhir.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Bold, Code, Italic, Subscript, Superscript } from "lucide-react";
import { Button } from "@/components/ui/kit";

const MARKS = [
  { mark: "**", label: "Tebal", Icon: Bold },
  { mark: "*", label: "Miring", Icon: Italic },
  { mark: "`", label: "Kode", Icon: Code },
  { mark: "^", label: "Superskrip", Icon: Superscript },
  { mark: "~", label: "Subskrip", Icon: Subscript },
] as const;

function readDraft(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeDraft(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* penyimpanan peramban tidak tersedia: abaikan (kenyamanan saja) */
  }
}

export function clearDraft(key: string): void {
  writeDraft(key, null);
}

export interface ParagraphEditorProps {
  /** "Paragraf 3.2.2" atau "Paragraf baru". */
  label: string;
  initialText: string;
  /** Kunci draf localStorage. */
  draftKey: string;
  /** Daftar: satu butir per baris. */
  listMode?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: (dirty: boolean) => void;
  onSave: (text: string) => void;
}

export function ParagraphEditor({ label, initialText, draftKey, listMode, onDirtyChange, onCancel, onSave }: ParagraphEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();
  const [restored] = useState(() => {
    const d = typeof window === "undefined" ? null : readDraft(draftKey);
    return d !== null && d !== initialText ? d : null;
  });
  const [text, setText] = useState(restored ?? initialText);
  const [empty, setEmpty] = useState(false);
  const dirty = text !== initialText;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    writeDraft(draftKey, dirty ? text : null);
  }, [draftKey, dirty, text]);

  // Tinggi mengikuti isi.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 72)}px`;
  }, [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  function wrap(mark: string) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b);
    const next = value.slice(0, a) + mark + sel + mark + value.slice(b);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + mark.length, b + mark.length);
    });
  }

  function save() {
    if (!text.trim()) {
      setEmpty(true);
      ref.current?.focus();
      return;
    }
    onSave(text);
  }

  return (
    <div
      className="rounded-[8px] border border-[var(--accent)] bg-[var(--surface-1)] p-3 text-[var(--text)] shadow-lg motion-safe:animate-[studio-notice-in_200ms_var(--ease,ease-out)]"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onCancel(dirty);
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          save();
        }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] font-medium">{label}</p>
        <div role="toolbar" aria-label="Penanda teks" className="flex items-center gap-1">
          {MARKS.map(({ mark, label: l, Icon }) => (
            <button
              key={mark}
              type="button"
              onClick={() => wrap(mark)}
              aria-label={l}
              title={l}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          ))}
        </div>
      </div>
      {restored !== null && <p className="mt-1 text-[12px] text-[var(--warn)]">Draf yang belum disimpan dipulihkan dari peramban ini.</p>}
      <label className="sr-only" htmlFor={`${hintId}-ta`}>
        Isi {label}
      </label>
      <textarea
        id={`${hintId}-ta`}
        ref={ref}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (empty) setEmpty(false);
        }}
        aria-describedby={hintId}
        aria-invalid={empty || undefined}
        className="mt-2 w-full resize-none rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[14px] leading-relaxed text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      />
      <p id={hintId} className="mt-1 text-[12px] text-[var(--text-2)]">
        {empty
          ? "Isi tidak boleh kosong. Untuk menghapus, pakai Hapus paragraf di menu."
          : listMode
            ? "Satu butir per baris. Penanda: **tebal**, *miring*, `kode`, ^atas^, ~bawah~."
            : "Penanda: **tebal**, *miring*, `kode`, ^atas^, ~bawah~. Ctrl+Enter untuk menyimpan, Esc untuk batal."}
      </p>
      <div className="sticky bottom-0 mt-3 flex flex-wrap items-center justify-end gap-2 bg-[var(--surface-1)] pb-[env(safe-area-inset-bottom,0px)]">
        <Button size="sm" onClick={() => onCancel(dirty)} className="whitespace-nowrap">
          Batal
        </Button>
        <Button size="sm" variant="primary" onClick={save} className="whitespace-nowrap">
          Simpan perubahan…
        </Button>
      </div>
    </div>
  );
}
