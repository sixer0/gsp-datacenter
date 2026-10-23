/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// SR-45: pembuat permintaan untuk handler route yang dipanggil langsung (pola S74).
// Identitas ditandatangani dengan secret UJI dari _env.ts (hanya sah di proses uji ini).
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { RUN_ID, TEST_INTERNAL_SECRET, TEST_NEXTAUTH_SECRET } from './_env';

export const BASE_URL = 'https://127.0.0.1:9021';
// Identitas memuat RUN_ID: pembersihan hanya menyentuh fixture run ini (suite dapat berjalan
// bersamaan di proses lain, mis. `vitest run tests/unit/studio`).
export const AGENT_ID = `sr45-agen-01-${RUN_ID}`;
export const AGENT_ID_2 = `sr45-agen-02-${RUN_ID}`;
export const ADMIN_USER = `sr45-admin-${RUN_ID}`;
export const PLAIN_USER = `sr45-user-${RUN_ID}`;
export const GOOGLE_EMAIL = `sr45-${RUN_ID}@gsp.test`;

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const TEST_SECRET_HEADER = 'x-internal-secret';

export function hqCookie(u: string, r: string, expOffsetSec = 3600, secret = TEST_NEXTAUTH_SECRET): string {
  const payload = b64url(Buffer.from(JSON.stringify({ u, r, p: 'gsp-test', exp: Math.floor(Date.now() / 1000) + expOffsetSec })));
  const sig = b64url(crypto.createHmac('sha256', secret).update(payload).digest());
  return `gsp_hq_session=${payload}.${sig}`;
}

export async function nextAuthCookie(): Promise<string> {
  const token = await encode({ token: { email: GOOGLE_EMAIL, sub: `sr45-g-${RUN_ID}` }, secret: TEST_NEXTAUTH_SECRET });
  return `__Secure-next-auth.session-token=${token}`;
}

export type Auth = 'none' | 'admin' | 'user' | 'google' | 'agent';
export const AUTHS_3: Auth[] = ['user', 'google', 'agent'];

export async function authHeaders(auth: Auth): Promise<Record<string, string>> {
  switch (auth) {
    case 'admin':
      return { cookie: hqCookie(ADMIN_USER, 'ADMINISTRATOR') };
    case 'user':
      return { cookie: hqCookie(PLAIN_USER, 'USER') };
    case 'google':
      return { cookie: await nextAuthCookie() };
    case 'agent':
      return { 'x-internal-secret': TEST_INTERNAL_SECRET };
    default:
      return {};
  }
}

export interface ReqOpts {
  method?: string;
  auth?: Auth;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function req(path: string, opts: ReqOpts = {}): Promise<NextRequest> {
  const headers: Record<string, string> = { ...(await authHeaders(opts.auth ?? 'none')), ...(opts.headers ?? {}) };
  const init: RequestInit = { method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'), headers };
  if (opts.body !== undefined) {
    if (typeof opts.body === 'string' || opts.body instanceof Uint8Array) init.body = opts.body as BodyInit;
    else {
      init.body = JSON.stringify(opts.body);
      if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) headers['content-type'] = 'application/json';
    }
  }
  return new NextRequest(new URL(path, BASE_URL), init as ConstructorParameters<typeof NextRequest>[1]);
}

export function params<T extends Record<string, string>>(p: T): { params: Promise<T> } {
  return { params: Promise.resolve(p) };
}

/** Badan agen: tambahkan agentId bila pemanggil agen (identitas mesin wajib membawa agentId). */
export function withAgent<T extends Record<string, unknown>>(auth: Auth, body: T, agentId = AGENT_ID): T {
  return auth === 'agent' ? { ...body, agentId } : body;
}

export async function call(res: Response | Promise<Response>): Promise<{ status: number; body: any; headers: Headers }> {
  const r = await res;
  const text = await r.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* bukan JSON */
  }
  return { status: r.status, body, headers: r.headers };
}
