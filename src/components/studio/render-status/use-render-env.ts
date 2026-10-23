"use client";

/*
 * Data klien halaman Sistem (S102; dimigrasi FIX-4b ke `shared/http` +
 * `shared/use-cooldown`, menutup S86 R05/R10/R17): GET R11 (ADMIN: dengan
 * daftar pembuatan berkas + ekor log; USER: kesiapan saja), pemantauan
 * berkala ringan saat tab terlihat, dan "periksa ulang" (refresh=1, khusus admin).
 *
 * Galat dimuat: dicatat `client-log` oleh `requestJson` (`studio.ui.render-status.<sumber>`);
 * coba ulang berjeda 3/6/12 dtk (maks 3). Data lama tetap ditampilkan saat
 * pemuatan ulang gagal (degradasi anggun).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { STUDIO_ROUTES } from "@/lib/studio/contract/env";
import type { StudioRenderJobStatus } from "@/lib/studio/contract/enums";
import { isAbortError, isStudioApiError, requestJson, StudioApiError, withQuery } from "@/components/studio/shared/http";
import { useCooldown, type CooldownState } from "@/components/studio/shared/use-cooldown";
import type { RenderEnvStatusResponse } from "./types";

export const JOBS_TAKE = 50;
export const LOG_TAIL = 30;
export const POLL_MS = 15000;

const src = (name: string) => `render-status.${name}`;

interface Settled {
  key: string;
  data: RenderEnvStatusResponse | null;
  error: StudioApiError | null;
  at: number;
}

export interface RecheckResult {
  ok: boolean;
  message: string;
}

export interface RenderEnvState {
  data: RenderEnvStatusResponse | null;
  error: StudioApiError | null;
  /** Pemuatan pertama (belum ada data sama sekali). */
  loading: boolean;
  /** Sedang memuat ulang di latar (data lama tetap tampil). */
  reloading: boolean;
  loadedAt: number | null;
  /** Jeda coba ulang bersama (untuk `ErrorView`). */
  cooldown: CooldownState;
  /** Coba ulang setelah galat; hormati jeda. */
  retry: () => void;
  /** Muat ulang manual (tidak memakai jatah coba ulang). */
  reload: () => void;
  rechecking: boolean;
  recheck: () => Promise<RecheckResult>;
}

function toApiError(err: unknown, url: string): StudioApiError {
  return isStudioApiError(err)
    ? err
    : new StudioApiError({ status: 0, code: "NETWORK", message: err instanceof Error ? err.message : String(err), url, method: "GET" });
}

export function useRenderEnv(opts: {
  statuses: readonly StudioRenderJobStatus[];
  autoRefresh: boolean;
  /** ADMIN: sertakan daftar pembuatan berkas + log. */
  includeJobs: boolean;
  /** `false` = tunggu (mis. peran penonton belum dimuat). */
  enabled: boolean;
}): RenderEnvState {
  const { statuses, autoRefresh, includeJobs, enabled } = opts;
  const url = includeJobs
    ? withQuery(STUDIO_ROUTES.R11, { jobs: 1, take: JOBS_TAKE, log: LOG_TAIL, status: statuses.length ? statuses.join(",") : undefined })
    : STUDIO_ROUTES.R11;
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const cooldown = useCooldown();
  const { arm, holdFor, reset, trigger } = cooldown;
  const key = `${url}#${nonce}`;
  const keyRef = useRef(key);

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    const thisKey = `${url}#${nonce}`;
    requestJson<RenderEnvStatusResponse>(url, { source: src("load"), signal: ctrl.signal }).then(
      (data) => {
        setSettled({ key: thisKey, data, error: null, at: Date.now() });
        reset();
      },
      (err: unknown) => {
        if (ctrl.signal.aborted || isAbortError(err)) return;
        const apiErr = toApiError(err, url);
        setSettled((prev) => ({ key: thisKey, data: prev?.data ?? null, error: apiErr, at: prev?.at ?? 0 }));
        if (apiErr.retryable) {
          arm();
          if (apiErr.retryAfterSec) holdFor(apiErr.retryAfterSec);
        }
      },
    );
    return () => ctrl.abort();
  }, [url, nonce, enabled, arm, holdFor, reset]);

  const lastOk = settled !== null && settled.error === null;

  // Pemantauan berkala hanya saat tab terlihat dan muatan terakhir berhasil.
  useEffect(() => {
    if (!enabled || !autoRefresh || !lastOk) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setNonce((n) => n + 1);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, autoRefresh, lastOk]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const retry = useCallback(() => {
    if (trigger()) setNonce((n) => n + 1);
  }, [trigger]);

  const recheck = useCallback(async (): Promise<RecheckResult> => {
    const target = withQuery(url, { refresh: 1 });
    setRechecking(true);
    try {
      const data = await requestJson<RenderEnvStatusResponse>(target, { source: src("recheck") });
      setSettled({ key: keyRef.current, data, error: null, at: Date.now() });
      reset();
      return {
        ok: true,
        message: data.readiness.ready
          ? "Pemeriksaan ulang selesai: mesin cetak siap."
          : `Pemeriksaan ulang selesai: mesin cetak belum siap (${data.readiness.errors.length} masalah).`,
      };
    } catch (err) {
      const apiErr = toApiError(err, target);
      const message =
        apiErr.status === 403
          ? "Hanya administrator yang dapat memaksa pemeriksaan ulang."
          : apiErr.status === 401
            ? "Sesi Anda berakhir. Masuk lagi lalu coba lagi."
            : apiErr.status === 0
              ? "Tidak dapat terhubung ke Studio. Periksa koneksi lalu coba lagi."
              : "Pemeriksaan ulang gagal di server. Coba lagi sebentar lagi.";
      return { ok: false, message };
    } finally {
      setRechecking(false);
    }
  }, [url, reset]);

  const current = settled && settled.key === key ? settled : null;
  return {
    data: settled?.data ?? null,
    error: current?.error ?? null,
    loading: enabled && !settled?.data && !current,
    reloading: enabled && !current,
    loadedAt: settled?.data ? settled.at : null,
    cooldown,
    retry,
    reload,
    rechecking,
    recheck,
  };
}
