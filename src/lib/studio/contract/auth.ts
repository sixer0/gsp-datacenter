/**
 * Identitas pemanggil Studio (01_specs.md §6.1, E25, KT-16).
 *
 * Urutan: cookie `gsp_hq_session` valid (r === "ADMINISTRATOR" -> ADMIN_SESSION,
 * selain itu USER_SESSION) -> JWT NextAuth (GOOGLE_SESSION, diperlakukan USER)
 * -> `x-internal-secret` (INTERNAL_AGENT). Hanya ADMIN_SESSION boleh menulis
 * parameter kelas K; kelas T tidak boleh ditulis siapa pun.
 *
 * Route tetap memanggil `requireSession(req)` lebih dulu (§6.1); fungsi ini
 * melempar StudioEngineError("UNAUTHORIZED") bila tidak ada identitas sah.
 * Hanya runtime node (hq-session memakai node:crypto).
 *
 * FIX-1 (S87 L-01, L-02):
 * - `x-internal-secret` dibandingkan sebagai HMAC-SHA256 (kunci acak per
 *   proses) dengan `timingSafeEqual`: waktu tidak bergantung isi MAUPUN panjang.
 * - `requester` (nilai `createdBy`/`requestedBy`) tidak lagi diambil polos dari
 *   `agentId` badan: sesi HQ `user:<username>`, Google `google:<email|sub>`
 *   (identitas JWT terverifikasi), agen internal `agent:<agentId>` (label
 *   klaim pemegang rahasia, bukan identitas) atau `anonymous-internal`.
 *   `callerKind` dicatat terpisah oleh pemanggil log.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRequester, readSessionToken, SESSION_COOKIE } from "@/lib/hq-session";
import type { CallerKind } from "./enums";
import { StudioEngineError } from "./errors";

export const ANONYMOUS_INTERNAL_REQUESTER = "anonymous-internal";

export interface StudioCaller {
  kind: CallerKind;
  /** Nilai `createdBy`/`requestedBy`: getRequester(req, agentId) atau "anonymous-internal". */
  requester: string;
  /** Username WebUiUser (sesi HQ). */
  username?: string;
  /** Peran WebUiUser (sesi HQ). */
  role?: string;
  /** Email akun Google (sesi NextAuth), bila ada. */
  email?: string;
  /** agentId dari badan permintaan (maks 80, A6). */
  agentId?: string;
  /** KT-16: hanya ADMIN_SESSION. */
  canWriteClassK: boolean;
}

function readHqCookie(req: Request): ReturnType<typeof readSessionToken> {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  const raw = match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : undefined;
  return readSessionToken(raw);
}

/** Kunci HMAC acak per proses: digest berpanjang tetap tanpa membocorkan panjang rahasia. */
const SECRET_COMPARE_KEY = randomBytes(32);

function digestOf(v: string): Buffer {
  return createHmac("sha256", SECRET_COMPARE_KEY).update(v, "utf8").digest();
}

/** Perbandingan rahasia waktu-konstan (isi dan panjang) lewat HMAC + timingSafeEqual (S87 L-01). */
export function secretEquals(provided: string, expected: string): boolean {
  return timingSafeEqual(digestOf(provided), digestOf(expected));
}

function internalSecretMatches(req: Request): boolean {
  const provided = req.headers.get("x-internal-secret");
  const expected = process.env.INTERNAL_API_SECRET;
  if (!provided || !expected) return false; // fail-closed tanpa env
  return secretEquals(provided, expected);
}

/** Prefiks requester per jenis pemanggil (S87 L-02). */
export const REQUESTER_PREFIX = { user: "user:", google: "google:", agent: "agent:" } as const;

function googleRequester(token: { email?: unknown; sub?: unknown }): string {
  const id = typeof token.email === "string" && token.email ? token.email : typeof token.sub === "string" && token.sub ? token.sub : "unknown";
  return `${REQUESTER_PREFIX.google}${id.slice(0, 200)}`;
}

function agentRequester(agent: string | undefined): string {
  return agent ? `${REQUESTER_PREFIX.agent}${agent}` : ANONYMOUS_INTERNAL_REQUESTER;
}

function normalizeAgentId(agentId?: string | null): string | undefined {
  const a = (agentId ?? "").toString().trim();
  return a ? a.slice(0, 80) : undefined;
}

export async function getStudioCaller(req: NextRequest | Request, agentId?: string | null): Promise<StudioCaller> {
  const agent = normalizeAgentId(agentId);

  // 1) Sesi HQ terpadu (WebUiUser). Cookie rusak diperlakukan sebagai tidak ada.
  let hq: ReturnType<typeof readSessionToken> = null;
  try {
    hq = readHqCookie(req);
  } catch {
    hq = null;
  }
  if (hq) {
    const isAdmin = hq.r === "ADMINISTRATOR";
    return {
      kind: isAdmin ? "ADMIN_SESSION" : "USER_SESSION",
      // getRequester membaca cookie yang sama -> `user:<username>` (agentId diabaikan).
      requester: getRequester(req, null) ?? `${REQUESTER_PREFIX.user}${hq.u}`,
      username: hq.u,
      role: hq.r,
      agentId: agent,
      canWriteClassK: isAdmin,
    };
  }

  // 2) Sesi NextAuth (Google OAuth), diperlakukan USER.
  let token: Awaited<ReturnType<typeof getToken>> = null;
  try {
    token = await getToken({ req: req as NextRequest, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    token = null;
  }
  if (token) {
    return {
      kind: "GOOGLE_SESSION",
      requester: googleRequester(token),
      email: typeof token.email === "string" ? token.email : undefined,
      agentId: agent,
      canWriteClassK: false,
    };
  }

  // 3) Pemanggil mesin internal.
  if (internalSecretMatches(req)) {
    return { kind: "INTERNAL_AGENT", requester: agentRequester(agent), agentId: agent, canWriteClassK: false };
  }

  throw new StudioEngineError("UNAUTHORIZED", "Unauthorized");
}
