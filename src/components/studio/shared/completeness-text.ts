/**
 * UI-02 (UA-M05, UA-m13): satu kalimat kelengkapan yang jujur tentang bagian opsional.
 * Murni (tanpa React) agar dapat diuji; dipakai baris daftar dokumen dan bilah `md`.
 *
 * Segmen OPTIONAL_EMPTY = bagian opsional yang sengaja tidak diisi: tidak dihitung kurang,
 * tetapi disebut agar segmen kosong di bilah tidak tampak seperti kekurangan.
 */

export interface ProgressSegment {
  state: "FILLED" | "AUTO_READY" | "PARTIAL" | "EMPTY" | "OPTIONAL_EMPTY";
  required: boolean;
}

export interface RequiredProgress {
  /** Bagian wajib yang sudah terisi (FILLED/AUTO_READY). */
  requiredDone: number;
  /** Semua bagian wajib. */
  requiredTotal: number;
  /** Bagian opsional yang terisi. */
  optionalDone: number;
  /** Bagian opsional kosong. */
  optionalEmpty: number;
}

const DONE = new Set<ProgressSegment["state"]>(["FILLED", "AUTO_READY"]);

export function requiredProgress(segments: readonly ProgressSegment[]): RequiredProgress {
  let requiredDone = 0;
  let requiredTotal = 0;
  let optionalDone = 0;
  let optionalEmpty = 0;
  for (const s of segments) {
    const done = DONE.has(s.state);
    if (s.required && s.state !== "OPTIONAL_EMPTY") {
      requiredTotal += 1;
      if (done) requiredDone += 1;
    } else if (done) optionalDone += 1;
    else if (s.state === "OPTIONAL_EMPTY") optionalEmpty += 1;
  }
  return { requiredDone, requiredTotal, optionalDone, optionalEmpty };
}

const N = (n: number) => n.toLocaleString("id-ID");

/** "6/6 bagian wajib terisi · 1 opsional kosong" (tanpa kata status; status ada di pil). */
export function progressText(p: RequiredProgress): string {
  const head = `${N(p.requiredDone)}/${N(p.requiredTotal)} bagian wajib terisi`;
  return p.optionalEmpty > 0 ? `${head} · ${N(p.optionalEmpty)} opsional kosong` : head;
}
