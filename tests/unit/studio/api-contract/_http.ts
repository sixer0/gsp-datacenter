/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// DC-36: pembuat permintaan untuk handler route yang dipanggil langsung (pola S74/SR-45).
// Identitas ditandatangani dengan secret UJI dari _env.ts (hanya sah di proses uji ini).
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { RUN_ID, TEST_INTERNAL_SECRET, TEST_NEXTAUTH_SECRET } from './_env';

export const BASE_URL = 'https://127.0.0.1:9021';
export const AGENT_ID = `dc36-agen-${RUN_ID}`;
export const ADMIN_USER = `dc36-admin-${RUN_ID}`;
export const PLAIN_USER = `dc36-user-${RUN_ID}`;

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function hqCookie(u: string, r: string): string {
  const payload = b64url(Buffer.from(JSON.stringify({ u, r, p: 'gsp-test', exp: Math.floor(Date.now() / 1000) + 3600 })));
  const sig = b64url(crypto.createHmac('sha256', TEST_NEXTAUTH_SECRET).update(payload).digest());
  return `gsp_hq_session=${payload}.${sig}`;
}

export type Auth = 'none' | 'admin' | 'user' | 'google' | 'agent';

export async function authHeaders(auth: Auth): Promise<Record<string, string>> {
  switch (auth) {
    case 'admin':
      return { cookie: hqCookie(ADMIN_USER, 'ADMINISTRATOR') };
    case 'user':
      return { cookie: hqCookie(PLAIN_USER, 'USER') };
    case 'google': {
      const token = await encode({ token: { email: `dc36-${RUN_ID}@gsp.test`, sub: `dc36-g-${RUN_ID}` }, secret: TEST_NEXTAUTH_SECRET });
      return { cookie: `__Secure-next-auth.session-token=${token}` };
    }
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

/** Badan agen membawa agentId (identitas mesin wajib membawa agentId untuk tulis). */
export function withAgent<T extends Record<string, unknown>>(body: T): T {
  return { ...body, agentId: AGENT_ID };
}

export interface Called {
  status: number;
  body: any;
  text: string;
  headers: Headers;
}

export async function call(res: Response | Promise<Response>): Promise<Called> {
  const r = await res;
  const text = await r.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* bukan JSON */
  }
  return { status: r.status, body, text, headers: r.headers };
}

export const QUOTA_BUCKET = 'x-studio-quota-bucket';
export const QUOTA_REMAINING = 'x-studio-quota-remaining';

export function quotaOf(h: Headers): [string | null, string | null] {
  return [h.get(QUOTA_BUCKET), h.get(QUOTA_REMAINING)];
}
