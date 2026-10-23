"use client";

/*
 * Peran penonton Studio (FIX-4a; UX-01 §2.2). Menggantikan `getSessionUser`
 * lokal (`section-composer/api.ts`) untuk modul baru.
 *
 * - Sumber: `GET /api/auth/me` -> `{ user: { username, role, displayName } }`
 *   (200) atau `{ user: null }` (401) — diverifikasi curl 2026-10-23.
 * - `role === "ADMINISTRATOR"` -> ADMIN; selain itu USER.
 * - Dimuat sekali per sesi halaman: satu janji bersama di tingkat modul
 *   (kedaluwarsa 5 menit agar ganti akun tanpa muat ulang tetap terbaca) dan
 *   dibagikan lewat `ViewerProvider` di `app/studio/layout.tsx`. Komponen di
 *   luar Studio (sidebar, palet perintah) memakai `useViewer()` tanpa provider
 *   dan tetap berbagi janji yang sama.
 * - Penyembunyian di UI hanya kenyamanan; penegakan tetap di server (403).
 *   Selama memuat atau bila gagal, `isAdmin = false` (aman: alat admin
 *   disembunyikan, bukan ditampilkan).
 */
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { isStudioApiError, requestJson, type StudioApiError } from "./http";

export type ViewerRole = "ADMIN" | "USER";

export interface Viewer {
  username: string;
  displayName: string | null;
  /** Peran Studio yang dinormalkan. */
  role: ViewerRole;
  /** Peran HQ mentah (Info teknis). */
  rawRole: string;
}

export interface ViewerState {
  /** `null` = tidak bersesi (atau belum dimuat). */
  viewer: Viewer | null;
  isAdmin: boolean;
  loading: boolean;
  error: StudioApiError | Error | null;
}

const ME_URL = "/api/auth/me";
const CACHE_TTL_MS = 5 * 60_000;

let cached: { at: number; promise: Promise<Viewer | null> } | null = null;

interface MeResponse {
  user: { username?: unknown; role?: unknown; displayName?: unknown } | null;
}

export function toViewer(user: MeResponse["user"]): Viewer | null {
  if (!user || typeof user.username !== "string") return null;
  const rawRole = typeof user.role === "string" ? user.role : "USER";
  return {
    username: user.username,
    displayName: typeof user.displayName === "string" ? user.displayName : null,
    role: rawRole.toUpperCase() === "ADMINISTRATOR" ? "ADMIN" : "USER",
    rawRole,
  };
}

/** Muat penonton (janji bersama). 401 -> `null`; galat lain dilempar. */
export function loadViewer(): Promise<Viewer | null> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.promise;
  const promise = requestJson<MeResponse>(ME_URL, { source: "shared.viewer", quietStatuses: [401] }).then(
    (r) => toViewer(r?.user ?? null),
    (e: unknown) => {
      if (isStudioApiError(e) && e.status === 401) return null;
      cached = null; // galat sementara: izinkan percobaan berikutnya
      throw e;
    },
  );
  cached = { at: now, promise };
  return promise;
}

/** Lupakan penonton tersimpan (mis. setelah keluar/masuk). */
export function invalidateViewer(): void {
  cached = null;
}

const INITIAL: ViewerState = { viewer: null, isAdmin: false, loading: true, error: null };

function useLoadedViewer(enabled: boolean): ViewerState {
  const [state, setState] = useState<ViewerState>(INITIAL);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadViewer().then(
      (viewer) => {
        if (alive) setState({ viewer, isAdmin: viewer?.role === "ADMIN", loading: false, error: null });
      },
      (e: unknown) => {
        if (alive) setState({ viewer: null, isAdmin: false, loading: false, error: e instanceof Error ? e : new Error(String(e)) });
      },
    );
    return () => {
      alive = false;
    };
  }, [enabled]);
  return state;
}

const ViewerContext = createContext<ViewerState | null>(null);

/** Dipasang sekali di `app/studio/layout.tsx`. */
export function ViewerProvider({ children }: { children: ReactNode }) {
  const state = useLoadedViewer(true);
  return createElement(ViewerContext.Provider, { value: state }, children);
}

/**
 * Peran penonton. Di dalam Studio memakai context layout; di luar (sidebar,
 * palet) memuat sendiri lewat janji bersama yang sama.
 */
export function useViewer(): ViewerState {
  const ctx = useContext(ViewerContext);
  const own = useLoadedViewer(ctx === null);
  return ctx ?? own;
}
