"use client";

/**
 * Sorot perubahan teks per kata (LCS). Untuk teks sangat panjang (> 4000 token
 * per sisi) jatuh ke perbandingan blok utuh agar peramban tetap responsif.
 */
import { useMemo } from "react";

type Op = { kind: "same" | "add" | "del"; text: string };

const MAX_TOKENS = 4000;

function tokenize(s: string): string[] {
  return s.match(/\s+|[^\s]+/g) ?? [];
}

/**
 * Teks polos isi blok apa pun: kumpulkan `text` dan `t` secara berurutan
 * (paragraf, butir, sel, caption, sumber). Paragraf/sel dipisah baris baru.
 */
export function contentPlain(v: unknown): string {
  const parts: string[] = [];
  const walk = (x: unknown, depth: number) => {
    if (depth > 12 || x === null || x === undefined) return;
    if (Array.isArray(x)) {
      for (const e of x) walk(e, depth + 1);
      return;
    }
    if (typeof x !== "object") return;
    const o = x as Record<string, unknown>;
    if (typeof o.text === "string") parts.push(o.text);
    if (Array.isArray(o.runs)) {
      parts.push(
        (o.runs as Array<Record<string, unknown>>)
          .map((r) => (typeof r.t === "string" ? r.t : r.tab ? "\t" : r.br ? "\n" : ""))
          .join(""),
      );
    }
    for (const [k, val] of Object.entries(o)) {
      if (k === "text" || k === "runs" || k === "format" || k === "x") continue;
      if (val && typeof val === "object") walk(val, depth + 1);
    }
  };
  walk(v, 0);
  return parts.filter((p) => p.length > 0).join("\n");
}

export function diffWords(a: string, b: string): Op[] {
  const x = tokenize(a);
  const y = tokenize(b);
  if (x.length > MAX_TOKENS || y.length > MAX_TOKENS) {
    return a === b ? [{ kind: "same", text: a }] : [{ kind: "del", text: a }, { kind: "add", text: b }];
  }
  // Pangkas awalan/akhiran sama untuk mengecilkan tabel LCS.
  let pre = 0;
  while (pre < x.length && pre < y.length && x[pre] === y[pre]) pre++;
  let suf = 0;
  while (suf < x.length - pre && suf < y.length - pre && x[x.length - 1 - suf] === y[y.length - 1 - suf]) suf++;
  const xs = x.slice(pre, x.length - suf);
  const ys = y.slice(pre, y.length - suf);
  const n = xs.length;
  const m = ys.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = xs[i] === ys[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: Op[] = [];
  const push = (kind: Op["kind"], text: string) => {
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({ kind, text });
  };
  if (pre) push("same", x.slice(0, pre).join(""));
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (xs[i] === ys[j]) {
      push("same", xs[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) push("del", xs[i++]);
    else push("add", ys[j++]);
  }
  while (i < n) push("del", xs[i++]);
  while (j < m) push("add", ys[j++]);
  if (suf) push("same", x.slice(x.length - suf).join(""));
  return out;
}

export function TextDiff({ before, after }: { before: string; after: string }) {
  const ops = useMemo(() => diffWords(before, after), [before, after]);
  if (before === after) return <p className="text-[12px] text-[var(--text-3)]">Teks sama; perubahan ada pada format atau struktur.</p>;
  return (
    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-2)]">
      {ops.map((o, k) =>
        o.kind === "same" ? (
          <span key={k}>{o.text}</span>
        ) : o.kind === "add" ? (
          <ins key={k} className="no-underline rounded-[3px] px-0.5 bg-[color-mix(in_srgb,var(--up)_18%,transparent)] text-[var(--up)]">
            <span className="sr-only">[ditambah: </span>
            {o.text}
            <span className="sr-only">]</span>
          </ins>
        ) : (
          <del key={k} className="rounded-[3px] px-0.5 bg-[color-mix(in_srgb,var(--down)_16%,transparent)] text-[var(--down)]">
            <span className="sr-only">[dihapus: </span>
            {o.text}
            <span className="sr-only">]</span>
          </del>
        ),
      )}
    </p>
  );
}
