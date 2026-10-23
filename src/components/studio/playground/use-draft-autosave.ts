"use client";

/*
 * Hook draf otomatis Alat developer (SR-31; S86 R09; pola S100).
 *
 * - Saat dipasang: pulihkan draf sekali (`onRestore`) atau, tanpa draf,
 *   panggil `onEmpty` (memuat contoh awal). Dijalankan di microtask agar tidak
 *   ada setState sinkron di badan efek.
 * - Setelah siap: simpan ke localStorage 600 ms setelah perubahan terakhir.
 * - `clear()` menghapus draf peramban; isi editor tetap.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { clearDraft, loadDraft, saveDraft, type PlaygroundDraft } from "./draft";
import type { JsonMode, PlaygroundMode, PlaygroundOverrides } from "./types";

const AUTOSAVE_MS = 600;

export type DraftStatus = "idle" | "saved" | "unavailable";

export interface DraftAutosave {
  /** Draf sudah dipulihkan / contoh awal diminta; autosave aktif. */
  ready: boolean;
  status: DraftStatus;
  clear: () => void;
}

export function useDraftAutosave(
  state: { mode: PlaygroundMode; texts: Partial<Record<JsonMode, string>>; overrides: PlaygroundOverrides },
  handlers: { onRestore: (d: PlaygroundDraft) => void; onEmpty: () => void },
): DraftAutosave {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const d = loadDraft();
      if (d && Object.keys(d.texts).length > 0) handlersRef.current.onRestore(d);
      else handlersRef.current.onEmpty();
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { mode, texts, overrides } = state;
  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => {
      const ok = saveDraft({ mode, texts, overrides, savedAt: new Date().toISOString() });
      setStatus(ok ? "saved" : "unavailable");
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [ready, mode, texts, overrides]);

  const clear = useCallback(() => {
    clearDraft();
    setStatus("idle");
  }, []);

  return { ready, status, clear };
}
