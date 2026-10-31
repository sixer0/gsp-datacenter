/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan kiriman JSON dinamis */
// DC-36: fixture kiriman kontrak (register 05 §5.8, §6.3) + pembuat dokumen lewat handler
// R12/R13/R04 NYATA. Semua nilai unik per run berasal dari RUN_ID (deterministik di dalam run).
import crypto from 'node:crypto';
import { RUN_ID } from './_env';
import { call, req, withAgent, type Called } from './_http';
import { POST as postSlot } from '@/app/api/studio/slots/route';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postDocuments } from '@/app/api/studio/documents/route';

export const TEMPLATE = 'laporan-kerja-agen';
export const CHANGE = { what: 'Perbarui isi uji DC-36', why: 'Uji API + DB fase document contract', impact: 'Satu lingkup saja' };

/** 8 heksa unik per run + label (pola C34 `t_` + 8 heksa). */
export function hex8(tag: string): string {
  return crypto.createHash('sha256').update(`${RUN_ID}:${tag}`).digest('hex').slice(0, 8);
}
export function cardId(tag: string): string {
  return `t_${hex8(tag)}`;
}
/** Token teks unik per run untuk kueri teks penuh (huruf kecil, satu kata). */
export function token(tag: string): string {
  return `zq${hex8(`tok:${tag}`)}`;
}

export function missionFolder(tag: string): string {
  return `2099-01-01_dc36-${tag}-${RUN_ID}`.toLowerCase();
}

export function docNumber(tag: string): string {
  return `DC36/${RUN_ID}/${tag}`;
}

export function chapter(key: string, first = `Isi bab ${key} untuk uji kontrak.`, second = `Paragraf kedua bab ${key}.`): Record<string, unknown> {
  return { key, title: { text: `Bab ${key} laporan` }, sections: [{ title: { text: `Bagian bab ${key}` }, blocks: [{ type: 'paragraph', text: first }, { type: 'paragraph', text: second }] }] };
}

export function record(over: Record<string, unknown> = {}): Record<string, any> {
  return { type: 'contractRecord', status: 'complete', reportedAt: '2026-10-30T19:30+07:00', ...over };
}

export interface Created {
  id: string;
  docNumber: string;
  revisionNo: number;
  res: Called;
}

function created(res: Called): Created {
  if (res.status !== 201) throw new Error(`kiriman fixture gagal ${res.status}: ${res.text.slice(0, 600)}`);
  return { id: res.body.document.id, docNumber: res.body.document.docNumber, revisionNo: res.body.revision.revisionNo, res };
}

/** R13: dokumen kontrak baru di misi dengan slot record terisi. */
export async function createWithRecord(folder: string, docKey: string, number: string, payload: Record<string, unknown>, title = `Laporan ${docKey}`, templateVersion?: number): Promise<Created> {
  const template = templateVersion ? { slug: TEMPLATE, version: templateVersion } : { slug: TEMPLATE };
  const body = { $schema: 'studio.slot/v2', target: { mission: { folder }, docKey }, template, meta: { title, docNumber: number }, slot: 'record', payload };
  return created(await call(postSlot(await req('/api/studio/slots', { auth: 'agent', body: withAgent(body) }))));
}

/** R12: dokumen baru di misi lewat bab (slot record kosong untuk templat kontrak). */
export async function createWithChapter(folder: string, docKey: string, number: string, ch: Record<string, unknown>, template = TEMPLATE, title = `Dokumen ${docKey}`, templateVersion?: number): Promise<Created> {
  const tpl = templateVersion ? { slug: template, version: templateVersion } : { slug: template };
  const body = { $schema: 'studio.chapter/v2', target: { mission: { folder }, docKey }, template: tpl, meta: { title, docNumber: number }, chapter: ch };
  return created(await call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body: withAgent(body) }))));
}

/** R12 ke dokumen yang ada. */
export async function submitChapter(documentId: string, ch: Record<string, unknown>, extra: Record<string, unknown> = {}): Promise<Called> {
  return call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body: withAgent({ $schema: 'studio.chapter/v2', target: { documentId }, chapter: ch, ...extra }) })));
}

/** R13 ke dokumen yang ada. */
export async function submitRecord(documentId: string, payload: Record<string, unknown>, extra: Record<string, unknown> = {}): Promise<Called> {
  return call(postSlot(await req('/api/studio/slots', { auth: 'agent', body: withAgent({ $schema: 'studio.slot/v2', target: { documentId }, slot: 'record', payload, ...extra }) })));
}

/** R04 POST `studio.doc/v2` dokumen penuh. */
export async function postDocV2(doc: Record<string, unknown>): Promise<Called> {
  return call(postDocuments(await req('/api/studio/documents', { auth: 'agent', body: withAgent(doc) })));
}
