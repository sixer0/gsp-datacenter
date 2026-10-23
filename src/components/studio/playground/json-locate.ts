/*
 * Pemeta JSON Pointer -> nomor baris teks editor (S100), plus lokasi galat
 * sintaks. Pengurai rekursif kecil yang hanya mencatat posisi; keabsahan JSON
 * tetap ditentukan `JSON.parse`. Tanpa eval.
 */

export interface JsonSyntaxError {
  message: string;
  line: number;
  column: number;
}

export type ParseOutcome = { ok: true; value: unknown } | { ok: false; error: JsonSyntaxError };

/** Escape satu token JSON Pointer (RFC 6901). */
export function escapePointerToken(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}

class Locator {
  private i = 0;
  private line = 1;
  private col = 1;
  readonly lines = new Map<string, number>();

  constructor(private readonly s: string) {}

  fail(message: string): never {
    throw Object.assign(new Error(message), { line: this.line, column: this.col });
  }

  private advance(n = 1) {
    for (let k = 0; k < n; k++) {
      if (this.s.charCodeAt(this.i) === 10) {
        this.line += 1;
        this.col = 1;
      } else {
        this.col += 1;
      }
      this.i += 1;
    }
  }

  private ws() {
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (c === " " || c === "\t" || c === "\n" || c === "\r") this.advance();
      else break;
    }
  }

  run() {
    if (this.s.charCodeAt(0) === 0xfeff) this.advance();
    this.ws();
    this.value("");
    this.ws();
    if (this.i < this.s.length) this.fail("Ada teks setelah akhir JSON");
  }

  private value(ptr: string) {
    if (!this.lines.has(ptr)) this.lines.set(ptr, this.line);
    const c = this.s[this.i];
    if (c === "{") return this.object(ptr);
    if (c === "[") return this.array(ptr);
    if (c === '"') return void this.string();
    if (c === "-" || (c !== undefined && c >= "0" && c <= "9")) return this.number();
    for (const lit of ["true", "false", "null"]) {
      if (this.s.startsWith(lit, this.i)) return this.advance(lit.length);
    }
    if (c === undefined) this.fail("JSON berakhir tiba-tiba");
    this.fail(`Karakter tak terduga ${JSON.stringify(c)}`);
  }

  private object(ptr: string) {
    this.advance();
    this.ws();
    if (this.s[this.i] === "}") return this.advance();
    for (;;) {
      this.ws();
      if (this.s[this.i] !== '"') this.fail("Diharapkan nama properti dalam tanda kutip ganda");
      const keyLine = this.line;
      const key = this.string();
      const child = `${ptr}/${escapePointerToken(key)}`;
      this.lines.set(child, keyLine);
      this.ws();
      if (this.s[this.i] !== ":") this.fail("Diharapkan ':' setelah nama properti");
      this.advance();
      this.ws();
      this.value(child);
      this.ws();
      const c = this.s[this.i];
      if (c === ",") {
        this.advance();
        continue;
      }
      if (c === "}") return this.advance();
      this.fail("Diharapkan ',' atau '}' dalam objek");
    }
  }

  private array(ptr: string) {
    this.advance();
    this.ws();
    if (this.s[this.i] === "]") return this.advance();
    for (let idx = 0; ; idx++) {
      this.ws();
      this.value(`${ptr}/${idx}`);
      this.ws();
      const c = this.s[this.i];
      if (c === ",") {
        this.advance();
        continue;
      }
      if (c === "]") return this.advance();
      this.fail("Diharapkan ',' atau ']' dalam larik");
    }
  }

  private string(): string {
    const start = this.i;
    this.advance();
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (c === "\\") {
        this.advance(2);
        continue;
      }
      if (c === "\n") this.fail("String tidak ditutup sebelum akhir baris");
      if (c === '"') {
        this.advance();
        try {
          return JSON.parse(this.s.slice(start, this.i)) as string;
        } catch {
          this.fail("Escape string tidak valid");
        }
      }
      this.advance();
    }
    this.fail("String tidak ditutup");
  }

  private number() {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(this.s.slice(this.i, this.i + 400));
    if (!m) this.fail("Angka tidak valid");
    this.advance(m[0].length);
  }
}

function locatorError(err: unknown): JsonSyntaxError {
  const e = err as { message?: string; line?: number; column?: number };
  return { message: e.message ?? "JSON tidak valid", line: e.line ?? 1, column: e.column ?? 1 };
}

/** Urai teks editor; galat sintaks membawa baris/kolom. */
export function parseEditorJson(text: string): ParseOutcome {
  if (!text.trim()) return { ok: false, error: { message: "Editor kosong", line: 1, column: 1 } };
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (err) {
    try {
      new Locator(text).run();
    } catch (locErr) {
      return { ok: false, error: locatorError(locErr) };
    }
    return { ok: false, error: { message: err instanceof Error ? err.message : "JSON tidak valid", line: 1, column: 1 } };
  }
}

/** Peta pointer -> baris (null bila teks bukan JSON). */
export function pointerLines(text: string): Map<string, number> | null {
  try {
    const loc = new Locator(text);
    loc.run();
    return loc.lines;
  } catch {
    return null;
  }
}

/** Baris untuk pointer; bila tidak ada, naik ke leluhur terdekat. */
export function lineForPointer(lines: Map<string, number> | null, pointer: string): number | null {
  if (!lines) return null;
  let p = pointer;
  for (;;) {
    const hit = lines.get(p);
    if (hit !== undefined) return hit;
    if (p === "") return null;
    const cut = p.lastIndexOf("/");
    p = cut <= 0 ? "" : p.slice(0, cut);
  }
}
