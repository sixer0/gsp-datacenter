"use client";

/*
 * Hook muat data UI Studio (FIX-4a; UX-01 §5.1, §6.2-§6.3).
 *
 * - Satu permintaan per kunci selama masih berjalan (dedupe lintas komponen;
 *   aman StrictMode: pembatalan ditunda satu tick sehingga pasang-lepas-pasang
 *   memakai permintaan yang sama).
 * - `AbortController` per permintaan; dibatalkan bila tidak ada pelanggan lagi.
 * - Memuat ulang mempertahankan data lama (`isRefreshing`), tidak berkedip ke
 *   kerangka (pola §5.1 "Memuat ulang").
 * - Galat yang layak diulang mempersenjatai `useCooldown` (3/6/12 s, maks 3);
 *   `retry()` hanya berjalan bila jeda selesai. `refetch()` = "Perbarui" manual.
 * - Galat dari `requestJson` sudah dicatat `client-log`; galat lain dari
 *   fetcher dicatat di sini dengan `source`.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { reportClientError } from "./client-log";
import { isAbortError, isStudioApiError, studioSource, type StudioApiError } from "./http";
import { useCooldown, type CooldownState } from "./use-cooldown";

export type QueryStatus = "idle" | "loading" | "success" | "error";

export type StudioFetcher<T> = (signal: AbortSignal) => Promise<T>;

export interface StudioQueryOptions {
  /** Sumber log `studio.ui.<modul>.<sumber>`. */
  source: string;
  /** `false` = jangan memuat (mis. menunggu parameter). Bawaan `true`. */
  enabled?: boolean;
}

export interface StudioQueryResult<T> {
  data: T | undefined;
  error: StudioApiError | Error | null;
  status: QueryStatus;
  /** Memuat pertama (belum ada data). */
  isLoading: boolean;
  /** Memuat ulang dengan data lama tetap tampil. */
  isRefreshing: boolean;
  /** Muat ulang manual ("Perbarui"); tidak memakai kuota coba ulang. */
  refetch: () => void;
  /** Coba ulang setelah galat; hormati jeda. `false` bila belum boleh. */
  retry: () => boolean;
  /** Status jeda coba ulang untuk `error-view`. */
  cooldown: CooldownState;
  /** Ganti data lokal (mis. setelah mutasi sukses). */
  setData: (updater: T | ((prev: T | undefined) => T)) => void;
}

interface Inflight {
  promise: Promise<unknown>;
  controller: AbortController;
  subscribers: number;
}

const inflight = new Map<string, Inflight>();

/** Hanya untuk uji. */
export function __inflightKeys(): string[] {
  return [...inflight.keys()];
}

function acquire<T>(key: string, fetcher: StudioFetcher<T>): { promise: Promise<T>; release: () => void } {
  let entry = inflight.get(key);
  if (!entry) {
    const controller = new AbortController();
    const promise = fetcher(controller.signal);
    const created: Inflight = { promise, controller, subscribers: 0 };
    inflight.set(key, created);
    const done = () => {
      if (inflight.get(key) === created) inflight.delete(key);
    };
    promise.then(done, done);
    entry = created;
  }
  const e = entry;
  e.subscribers += 1;
  let released = false;
  return {
    promise: e.promise as Promise<T>,
    release: () => {
      if (released) return;
      released = true;
      e.subscribers -= 1;
      // Tunda satu tick: StrictMode memasang ulang segera dan ikut berlangganan lagi.
      setTimeout(() => {
        if (e.subscribers <= 0 && inflight.get(key) === e) {
          inflight.delete(key);
          e.controller.abort();
        }
      }, 0);
    },
  };
}

export function useStudioQuery<T>(
  key: string | null,
  fetcher: StudioFetcher<T>,
  opts: StudioQueryOptions,
): StudioQueryResult<T> {
  const enabled = (opts.enabled ?? true) && key !== null;
  const source = studioSource(opts.source);
  // Data dan galat diikat ke kunci: ganti kunci tidak menampilkan data kunci lama.
  const [dataEntry, setDataEntry] = useState<{ key: string; value: T } | null>(null);
  const [errorEntry, setErrorEntry] = useState<{ key: string; error: StudioApiError | Error } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const cooldown = useCooldown();
  const { arm, reset: resetCooldown, holdFor, trigger } = cooldown;

  // Fetcher terbaru tanpa memicu efek ulang setiap render.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (!enabled || key === null) return;
    let alive = true;
    const { promise, release } = acquire<T>(key, (signal) => fetcherRef.current(signal));
    // Ditunda ke microtask agar tidak ada setState sinkron di badan efek.
    queueMicrotask(() => {
      if (alive) setBusyKey(key);
    });
    promise.then(
      (value) => {
        if (!alive) return;
        setDataEntry({ key, value });
        setErrorEntry(null);
        setBusyKey(null);
        resetCooldown();
      },
      (e: unknown) => {
        if (!alive || isAbortError(e)) return;
        const err = e instanceof Error ? e : new Error(String(e));
        if (!isStudioApiError(err)) reportClientError(source, err, { key });
        setErrorEntry({ key, error: err });
        setBusyKey(null);
        if (isStudioApiError(err) && err.retryable) {
          arm();
          if (err.retryAfterSec) holdFor(err.retryAfterSec);
        }
      },
    );
    return () => {
      alive = false;
      release();
    };
    // `tick` memaksa muat ulang; fungsi cooldown stabil per persistKey.
  }, [enabled, key, tick, source, arm, holdFor, resetCooldown]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  const retry = useCallback((): boolean => {
    if (!trigger()) return false;
    setTick((n) => n + 1);
    return true;
  }, [trigger]);

  const setData = useCallback(
    (updater: T | ((prev: T | undefined) => T)) => {
      if (key === null) return;
      setDataEntry((prev) => {
        const old = prev && prev.key === key ? prev.value : undefined;
        const value = typeof updater === "function" ? (updater as (p: T | undefined) => T)(old) : updater;
        return { key, value };
      });
    },
    [key],
  );

  const data = dataEntry && dataEntry.key === key ? dataEntry.value : undefined;
  const error = errorEntry && errorEntry.key === key ? errorEntry.error : null;
  const busy = busyKey !== null && busyKey === key;
  const status: QueryStatus = !enabled
    ? "idle"
    : busy || (data === undefined && !error)
      ? "loading"
      : error
        ? "error"
        : "success";

  return {
    data,
    error,
    status,
    isLoading: enabled && data === undefined && (busy || !error),
    isRefreshing: enabled && busy && data !== undefined,
    refetch,
    retry,
    cooldown,
    setData,
  };
}
