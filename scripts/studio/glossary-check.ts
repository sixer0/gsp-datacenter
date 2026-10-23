/**
 * Pemeriksa glosarium layar Studio (UX-01 §1.2 "Kata terlarang di permukaan
 * utama"; IP-58, review SR-56 L7, baris FIX-U D-245).
 *
 *   npx tsx scripts/studio/glossary-check.ts [--json] [--show-excluded] [akar ...]
 *
 * Bawaan akar: `src/components/studio` dan `src/app/studio`. Keluar 1 bila ada
 * hit di permukaan utama (dapat dipakai sebagai gerbang A2), 0 bila bersih,
 * 2 untuk galat pemakaian.
 *
 * Metode (pengganti skrip baris-per-baris FIX-4b/SR-56 yang tidak memindai teks
 * JSX multi-baris): setiap berkas `.ts`/`.tsx` di-parse dengan kompiler
 * TypeScript, lalu diperiksa:
 *   - teks JSX (`JsxText`, termasuk yang terbentang beberapa baris);
 *   - literal string dan template literal (bagian teks; `${...}` diganti spasi);
 *   - nilai atribut JSX berupa string.
 * Yang dilewati karena bukan teks layar: posisi tipe, specifier impor/ekspor,
 * nama properti, operan perbandingan dan label `case`, argumen akses elemen,
 * atribut teknis (`className`, `key`, `id`, `href`, ...), argumen pencatat log
 * (`source`, `reportClientError`, `console.*`), jalur URL ("/..."), dan token
 * tunggal huruf kecil tanpa spasi (kunci/identifier, mis. `kind: "render"`).
 *
 * Pengecualian §1.2 (dihitung terpisah, tidak menggagalkan gerbang):
 *   - INFOTEKNIS: apa pun di dalam elemen `<InfoTeknis>` (anak maupun props),
 *     yang dirender `null` untuk USER (`shared/info-teknis.tsx`), dan nilai
 *     properti `technical` (FixHint, hanya ditampilkan lewat InfoTeknis).
 *   - ADMIN: berkas yang seluruhnya hanya dirender untuk ADMINISTRATOR (daftar
 *     `ADMIN_ONLY` di bawah, masing-masing dengan bukti gerbang `isAdmin`).
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { FORBIDDEN_SURFACE_WORDS } from "../../src/components/studio/shared/labels";

// ── Konfigurasi ──────────────────────────────────────────────────────────

/**
 * UX-01 §1.2: kata terlarang di permukaan utama. Sumber tunggal =
 * `FORBIDDEN_SURFACE_WORDS` di `shared/labels.ts`; ditambah varian "sha256" /
 * "sha-256" (brief FIX-4b) yang tidak tertangkap batas kata "sha".
 */
export const FORBIDDEN_WORDS: readonly string[] = [...FORBIDDEN_SURFACE_WORDS, "sha256", "sha-256"];

/** Variabel yang memuat daftar kata itu sendiri (bukan teks layar). */
const WORD_LIST_DECLS = new Set(["FORBIDDEN_SURFACE_WORDS", "FORBIDDEN_WORDS"]);

/**
 * Konstruktor galat yang `message`-nya hanya tampil di Info teknis
 * (`shared/error-view.tsx`: "Pesan server" di dalam `InfoTeknis`); judul dan
 * isi layar berasal dari katalog awam `shared/error-messages.ts` per kode.
 * Tidak berlaku di berkas yang mendeklarasikan kelas bernama sama sendiri.
 */
const INFOTEKNIS_CONSTRUCTORS = new Set(["StudioApiError"]);

const WORD_RE = new RegExp(
  `(?<![A-Za-z0-9_])(${[...FORBIDDEN_WORDS].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+")).join("|")})(?:s)?(?![A-Za-z0-9_])`,
  "gi",
);

/**
 * Berkas yang seluruh isinya hanya tampil untuk ADMIN (jalur relatif akar repo,
 * pemisah "/"). Bukti gerbang: review SR-56 §1/§4 dan D-139.
 */
const ADMIN_ONLY: ReadonlyArray<{ pattern: RegExp; why: string }> = [
  { pattern: /^src\/components\/studio\/playground\//, why: "Alat developer: layar khusus admin untuk USER (playground.tsx); JSON diizinkan §1.2" },
  { pattern: /^src\/app\/studio\/playground\//, why: "rute Alat developer (ADMIN)" },
  { pattern: /^src\/components\/studio\/template-editor\/param-[^/]+\.tsx?$/, why: "panel Pengaturan lanjutan, hanya isAdmin && def.advancedLoaded (template-editor.tsx)" },
  { pattern: /^src\/components\/studio\/template-editor\/role-formats-editor\.tsx$/, why: "mode gaya hanya ADMIN (template-editor.tsx)" },
  { pattern: /^src\/components\/studio\/render-status\/jobs\.tsx$/, why: "daftar pekerjaan di belakang isAdmin (render-status/index.tsx)" },
];

/** Atribut JSX yang nilainya teknis, bukan teks layar. */
const TECH_ATTRS = new Set([
  "className",
  "key",
  "id",
  "htmlFor",
  "name",
  "href",
  "src",
  "type",
  "role",
  "value",
  "defaultValue",
  "method",
  "action",
  "target",
  "rel",
  "sandbox",
  "referrerPolicy",
  "accept",
  "autoComplete",
  "inputMode",
  "pattern",
  "form",
  "lang",
  "dir",
  "viewBox",
  "d",
  "fill",
  "stroke",
  "mode",
  "variant",
  "size",
  "tone",
  "placement",
  "area",
]);

/** Nama properti objek yang nilainya teknis (sumber log, kunci, kelas CSS). */
const TECH_PROPS = new Set(["source", "className", "key", "id", "code", "kind", "type", "pointer", "keyword", "checkId", "persistKey", "href", "path", "method", "format", "mime"]);

/** Fungsi pencatat/teknis: argumen string-nya bukan teks layar. */
const TECH_CALLS = new Set(["reportClientError", "studioSource", "logSource", "requestJson", "withQuery", "fileUrl", "digest", "querySelector", "querySelectorAll", "getElementById", "addEventListener", "removeEventListener", "matchMedia", "setAttribute", "getAttribute", "startsWith", "endsWith", "includes", "split", "replace", "replaceAll", "join", "indexOf", "get", "has", "set", "delete", "test", "match"]);

// ── Pemindaian ───────────────────────────────────────────────────────────

export type HitScope = "main" | "infoteknis" | "admin";

export interface GlossaryHit {
  file: string;
  line: number;
  word: string;
  text: string;
  scope: HitScope;
}

export interface ScanResult {
  files: number;
  texts: number;
  hits: GlossaryHit[];
}

function isTypePosition(node: ts.Node): boolean {
  for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
    if (ts.isTypeNode(p) || ts.isTypeAliasDeclaration(p) || ts.isInterfaceDeclaration(p)) return true;
    if (ts.isExpression(p) && !ts.isLiteralExpression(p) && !ts.isTemplateExpression(p) && !ts.isTemplateSpan(p)) return false;
    if (ts.isStatement(p) || ts.isSourceFile(p)) return false;
  }
  return false;
}

function calleeName(call: ts.CallExpression | ts.NewExpression): string | null {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) {
    if (ts.isIdentifier(e.expression) && e.expression.text === "console") return "console";
    return e.name.text;
  }
  return null;
}

const COMPARE = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.InKeyword,
]);

/** true bila literal ini berada di posisi teknis (bukan teks layar). */
function isTechnicalPosition(node: ts.Node): boolean {
  const p = node.parent;
  if (!p) return false;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isImportTypeNode(p)) return true;
  if (ts.isLiteralTypeNode(p) || isTypePosition(node)) return true;
  if (ts.isPropertyAssignment(p) && p.name === node) return true;
  if (ts.isPropertyAssignment(p) && p.initializer === node) {
    const n = p.name;
    const key = ts.isIdentifier(n) || ts.isStringLiteral(n) ? n.text : null;
    if (key && TECH_PROPS.has(key)) return true;
  }
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isCaseClause(p) && p.expression === node) return true;
  if (ts.isBinaryExpression(p) && COMPARE.has(p.operatorToken.kind)) return true;
  if (ts.isJsxAttribute(p)) {
    const name = p.name.getText();
    if (TECH_ATTRS.has(name) || name.startsWith("data-")) return true;
  }
  if (ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent)) {
    const name = p.parent.name.getText();
    if (TECH_ATTRS.has(name) || name.startsWith("data-")) return true;
  }
  for (let a: ts.Node | undefined = p; a && !ts.isStatement(a); a = a.parent) {
    if (ts.isCallExpression(a) || ts.isNewExpression(a)) {
      const name = calleeName(a);
      if (name && (TECH_CALLS.has(name) || name === "console")) return true;
      break;
    }
  }
  return false;
}

function jsxTagName(node: ts.Node): string | null {
  if (ts.isJsxElement(node)) return node.openingElement.tagName.getText();
  if (ts.isJsxSelfClosingElement(node)) return node.tagName.getText();
  return null;
}

/** Literal di dalam deklarasi daftar kata terlarang itu sendiri. */
function insideWordList(node: ts.Node): boolean {
  for (let a: ts.Node | undefined = node.parent; a && !ts.isSourceFile(a); a = a.parent) {
    if (ts.isVariableDeclaration(a) && ts.isIdentifier(a.name) && WORD_LIST_DECLS.has(a.name.text)) return true;
  }
  return false;
}

/**
 * INFOTEKNIS: di dalam elemen `<InfoTeknis>`, nilai properti `technical`, atau
 * argumen `new StudioApiError(...)` bersama (lihat `INFOTEKNIS_CONSTRUCTORS`).
 */
function insideInfoTeknis(node: ts.Node, sharedErrors: boolean): boolean {
  for (let a: ts.Node | undefined = node.parent; a; a = a.parent) {
    if (jsxTagName(a) === "InfoTeknis") return true;
    if (sharedErrors && ts.isNewExpression(a) && ts.isIdentifier(a.expression) && INFOTEKNIS_CONSTRUCTORS.has(a.expression.text)) return true;
    if (ts.isPropertyAssignment(a)) {
      const n = a.name;
      if ((ts.isIdentifier(n) || ts.isStringLiteral(n)) && n.text === "technical") return true;
    }
  }
  return false;
}

/** Heuristik teks layar: berspasi + berhuruf, atau satu kata berhuruf awal kapital. */
function looksLikeScreenText(t: string): boolean {
  const s = t.trim();
  if (!s || !/[A-Za-z]/.test(s)) return false;
  if (s.startsWith("/") || s.includes("var(--") || /^https?:/.test(s)) return false;
  if (/^[A-Z0-9_]+$/.test(s)) return false; // kode galat / konstanta
  if (/\s/.test(s)) return true;
  return /^[A-Z][a-z]/.test(s);
}

function templateText(node: ts.TemplateExpression): string {
  return [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" ");
}

export function scanSource(file: string, source: string, scope: HitScope = "main"): { texts: number; hits: GlossaryHit[] } {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const hits: GlossaryHit[] = [];
  let texts = 0;
  // Berkas dengan kelas galat sendiri bernama sama (modul lama) tidak memakai ErrorView bersama.
  const sharedErrors = file.endsWith("shared/http.ts") || ![...INFOTEKNIS_CONSTRUCTORS].some((c) => new RegExp(String.raw`class\s+${c}\b`).test(source));

  const check = (node: ts.Node, text: string, jsxText: boolean) => {
    if (!jsxText && (isTechnicalPosition(node) || insideWordList(node) || !looksLikeScreenText(text))) return;
    if (jsxText && !/[A-Za-z]/.test(text)) return;
    texts++;
    const where: HitScope = scope !== "main" ? scope : insideInfoTeknis(node, sharedErrors) ? "infoteknis" : "main";
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    const flat = text.replace(/\s+/g, " ").trim();
    for (const m of flat.matchAll(WORD_RE)) {
      hits.push({ file, line, word: m[1], text: flat.slice(0, 140), scope: where });
    }
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) check(node, node.text, true);
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) check(node, node.text, false);
    else if (ts.isTemplateExpression(node)) check(node, templateText(node), false);
    if (!ts.isTemplateExpression(node)) ts.forEachChild(node, visit);
    else node.templateSpans.forEach((s) => visit(s.expression));
  };
  visit(sf);
  return { texts, hits };
}

function walk(dir: string, out: string[]): void {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules" && !e.name.startsWith(".")) walk(p, out);
    } else if (/\.tsx?$/.test(e.name) && !e.name.endsWith(".d.ts")) out.push(p);
  }
}

export function scanRoots(repoRoot: string, roots: readonly string[]): ScanResult {
  const files: string[] = [];
  for (const r of roots) {
    const abs = path.resolve(repoRoot, r);
    if (!fs.existsSync(abs)) throw new Error(`akar tidak ada: ${r}`);
    if (fs.statSync(abs).isDirectory()) walk(abs, files);
    else files.push(abs);
  }
  const hits: GlossaryHit[] = [];
  let texts = 0;
  for (const f of files.sort()) {
    const rel = path.relative(repoRoot, f).split(path.sep).join("/");
    const admin = ADMIN_ONLY.some((a) => a.pattern.test(rel));
    const r = scanSource(rel, fs.readFileSync(f, "utf8"), admin ? "admin" : "main");
    texts += r.texts;
    hits.push(...r.hits);
  }
  return { files: files.length, texts, hits };
}

// ── CLI ──────────────────────────────────────────────────────────────────

function main(argv: readonly string[]): number {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const unknown = [...flags].filter((f) => f !== "--json" && f !== "--show-excluded");
  if (unknown.length) {
    process.stderr.write(`opsi tidak dikenal: ${unknown.join(", ")}\n`);
    return 2;
  }
  const roots = argv.filter((a) => !a.startsWith("--"));
  const repoRoot = path.resolve(__dirname, "..", "..");
  let res: ScanResult;
  try {
    res = scanRoots(repoRoot, roots.length ? roots : ["src/components/studio", "src/app/studio"]);
  } catch (e) {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    return 2;
  }
  const main = res.hits.filter((h) => h.scope === "main");
  const info = res.hits.filter((h) => h.scope === "infoteknis");
  const admin = res.hits.filter((h) => h.scope === "admin");
  if (flags.has("--json")) {
    process.stdout.write(`${JSON.stringify({ files: res.files, texts: res.texts, main, infoteknis: info.length, admin: admin.length, ...(flags.has("--show-excluded") ? { excluded: [...info, ...admin] } : {}) }, null, 2)}\n`);
  } else {
    const show = flags.has("--show-excluded") ? res.hits : main;
    for (const h of show) process.stdout.write(`${h.file}:${h.line}: [${h.scope}] [${h.word}] ${h.text}\n`);
    process.stdout.write(`files=${res.files} texts_checked=${res.texts} HITS_MAIN=${main.length} excluded_infoteknis=${info.length} excluded_admin=${admin.length}\n`);
  }
  return main.length > 0 ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
