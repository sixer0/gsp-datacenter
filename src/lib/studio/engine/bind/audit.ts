/**
 * Audit angka teks terhadap register (port `Register.audit_text` dan
 * `audit_retired` datumbind.py). Ekstraksi teks dari DOCX (`_text_of`) bukan
 * bagian modul ini: pemanggil (lint, layanan) menyerahkan teks polos.
 */
import type { AuditFinding, RegisterApi } from "../../contract";
import { BindDefect } from "./defect";
import { fmt } from "./format";
import { Register } from "./register";

/**
 * Pola angka beban keputusan (Python `Register.PAT`): angka berpemisah ribuan
 * "." (opsional desimal ",") atau angka berdesimal ",". `\w`/`\d` Python 3
 * sadar-Unicode, maka di sini `[\p{L}\p{N}_]` dan `\p{Nd}`. Bilangan bulat
 * polos < 1000 tanpa pemisah tidak diaudit (semantik arsip).
 */
const W = "[\\p{L}\\p{N}_";
export const BIND_NUMBER_PATTERN_SOURCE =
  `(?<!${W},.])\\p{Nd}{1,3}(?:\\.\\p{Nd}{3})+(?:,\\p{Nd}+)?(?!${W}.])|` +
  `(?<!${W},.])\\p{Nd}+,\\p{Nd}+(?!${W}.])`;

function knownForms(reg: RegisterApi): Set<string> {
  if (reg instanceof Register) return reg.knownForms();
  const out = new Set<string>();
  for (const k of reg.keys()) {
    const v = reg.get(k).v;
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    for (let dec = 0; dec < 4; dec++) out.add(fmt(v, dec));
  }
  return out;
}

/**
 * Setiap angka beban keputusan di `text` wajib tertelusur ke register.
 * Satu temuan per bentuk unik (indeks kemunculan pertama), urut seperti
 * Python `sorted(set(...))`.
 */
export function auditText(text: string, reg: RegisterApi, allow: readonly string[] = []): AuditFinding[] {
  const known = knownForms(reg);
  const allowed = new Set(allow);
  const first = new Map<string, number>();
  const re = new RegExp(BIND_NUMBER_PATTERN_SOURCE, "gu");
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    if (!first.has(m[0])) first.set(m[0], m.index);
  }
  return [...first.keys()]
    .filter((s) => !known.has(s) && !allowed.has(s))
    .sort()
    .map((s) => ({
      kind: "unregistered" as const,
      text: s,
      index: first.get(s) ?? 0,
      detail: `angka "${s}" tidak tertelusur ke register`,
    }));
}

/**
 * Tolak teks yang masih memuat nilai yang sudah ditarik model. Urutan dan
 * duplikat mengikuti daftar `retired` (Python list comprehension).
 */
export function auditRetired(text: string, retired: readonly string[]): AuditFinding[] {
  const out: AuditFinding[] = [];
  for (const s of retired) {
    if (typeof s !== "string" || s === "") {
      throw new BindDefect("daftar nilai ditarik memuat entri kosong; setiap entri wajib teks angka tercetak.");
    }
    const index = text.indexOf(s);
    if (index >= 0) out.push({ kind: "retired", text: s, index, detail: `memuat angka yang sudah ditarik: ${s}` });
  }
  return out;
}
