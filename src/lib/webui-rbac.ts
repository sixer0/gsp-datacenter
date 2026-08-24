import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { WebUiUser } from "@prisma/client";

/**
 * WebUI RBAC shared helpers (Brahma WebUI on port 9012).
 *
 * All endpoints under /api/brahma/rbac/* are guarded by a shared secret
 * (x-rbac-token header == WEBUI_RBAC_TOKEN env). Only the Brahma WebUI
 * backend holds this token; browser clients never see it.
 */

export function rbacTokenOk(request: NextRequest): boolean {
  const expected = (process.env.WEBUI_RBAC_TOKEN || "").trim();
  if (!expected) return false;
  const provided = (request.headers.get("x-rbac-token") || "").trim();
  if (!provided) return false;
  // Constant-time compare — both sides are short, timingSafeEqual is fine.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  try {
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= 8;
}

/** Strip the password hash before returning a user record to clients. */
export function publicUser(u: WebUiUser) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    hermesProfile: u.hermesProfile,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}
