"use client";

/*
 * Satu hook jeda coba ulang UI Studio (FIX-4a; UX-01 §5.1; menutup S86 R10).
 *
 * Model "jeda dulu, baru coba": setiap kegagalan memanggil `arm()` yang memulai
 * hitung mundur `delays[attempt]` (bawaan 3, 6, 12 s). Selama jeda tombol
 * coba ulang nonaktif dan menampilkan sisa detik. Setelah jeda, `trigger()`
 * memakai satu percobaan (maks `delays.length`, bawaan 3) dan mengembalikan
 * `true` bila pemanggil boleh mencoba lagi. Setelah percobaan habis,
 * `exhausted = true` ("Masih gagal. Muat ulang halaman atau hubungi admin.").
 *
 * `holdFor(n)` memaksa jeda n detik (429 `Retry-After`, 503 antrean).
 * `persistKey` menyimpan status di tingkat modul agar tidak hilang saat
 * komponen dipasang ulang (fallback error boundary dipasang ulang setiap kali
 * `reset()` gagal lagi). Status tersimpan kedaluwarsa 2 menit tanpa aktivitas.
 */
import { useCallback, useEffect, useState } from "react";
import { RETRY_DELAYS_S } from "./retry";

export interface CooldownState {
  /** Sisa detik jeda (0 = tidak sedang jeda). */
  secondsLeft: number;
  /** Jumlah percobaan ulang yang sudah dipakai. */
  attempt: number;
  /** Boleh mencoba sekarang (tidak sedang jeda, percobaan belum habis). */
  canRetry: boolean;
  /** Percobaan habis. */
  exhausted: boolean;
  /** Mulai jeda untuk percobaan berikutnya (panggil saat gagal). */
  arm: () => void;
  /** Pakai satu percobaan; `true` bila diizinkan. */
  trigger: () => boolean;
  /** Paksa jeda n detik tanpa memakai percobaan (Retry-After). */
  holdFor: (seconds: number) => void;
  /** Kembali ke awal (setelah sukses). */
  reset: () => void;
}

interface Snapshot {
  attempt: number;
  /** epoch ms akhir jeda; 0 = tidak jeda. */
  until: number;
  touched: number;
}

const PERSIST_TTL_MS = 120_000;
const persisted = new Map<string, Snapshot>();

function readPersisted(key: string | undefined, now: number): Snapshot | null {
  if (!key) return null;
  const s = persisted.get(key);
  if (!s) return null;
  if (now - s.touched > PERSIST_TTL_MS) {
    persisted.delete(key);
    return null;
  }
  return s;
}

/** Hanya untuk uji: hapus status tersimpan. */
export function __resetCooldownStore(): void {
  persisted.clear();
}

/** Logika murni (dapat diuji tanpa React): sisa detik pada waktu `now`. */
export function secondsUntil(until: number, now: number): number {
  return until > now ? Math.ceil((until - now) / 1000) : 0;
}

export function useCooldown(
  delaysS: readonly number[] = RETRY_DELAYS_S,
  opts: { persistKey?: string } = {},
): CooldownState {
  const { persistKey } = opts;
  const [snap, setSnap] = useState<Snapshot>(() => readPersisted(persistKey, Date.now()) ?? { attempt: 0, until: 0, touched: 0 });
  const [now, setNow] = useState(() => Date.now());

  const commit = useCallback(
    (next: Snapshot) => {
      if (persistKey) persisted.set(persistKey, next);
      setSnap(next);
    },
    [persistKey],
  );

  // Detak selama jeda saja; berhenti sendiri saat jeda selesai.
  useEffect(() => {
    if (snap.until <= Date.now()) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= snap.until) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [snap.until]);

  const secondsLeft = secondsUntil(snap.until, now);
  const max = delaysS.length;
  const exhausted = snap.attempt >= max;
  const canRetry = !exhausted && secondsLeft === 0;

  const arm = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setSnap((s) => {
      if (s.attempt >= delaysS.length) return s;
      // Jangan memperpendek jeda yang sedang berjalan (mis. Retry-After lebih panjang).
      const until = Math.max(s.until, t + delaysS[s.attempt] * 1000);
      const next = { ...s, until, touched: t };
      if (persistKey) persisted.set(persistKey, next);
      return next;
    });
  }, [delaysS, persistKey]);

  const trigger = useCallback((): boolean => {
    const t = Date.now();
    if (snap.attempt >= delaysS.length || snap.until > t) return false;
    commit({ attempt: snap.attempt + 1, until: 0, touched: t });
    return true;
  }, [commit, delaysS.length, snap.attempt, snap.until]);

  const holdFor = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds <= 0) return;
      const t = Date.now();
      setNow(t);
      setSnap((s) => {
        const next = { ...s, until: Math.max(s.until, t + Math.ceil(seconds) * 1000), touched: t };
        if (persistKey) persisted.set(persistKey, next);
        return next;
      });
    },
    [persistKey],
  );

  const reset = useCallback(() => {
    if (persistKey) persisted.delete(persistKey);
    setSnap({ attempt: 0, until: 0, touched: 0 });
  }, [persistKey]);

  return { secondsLeft, attempt: snap.attempt, canRetry, exhausted, arm, trigger, holdFor, reset };
}
