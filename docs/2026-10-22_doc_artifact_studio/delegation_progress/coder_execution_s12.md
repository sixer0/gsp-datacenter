# S12 coder-execution: engine/bind (port datumbind.py)

Status: complete. Tanggal 2026-10-23. Skills: backend-execution, dry-run-verify-fix.

Berkas (7, area `src/lib/studio/engine/bind/`): `index.ts` (re-ekspor; tanda tangan I02 §8.2 dipertahankan), `defect.ts` (BindDefect; dipisah agar tidak siklus), `format.ts` (fmt, withUnit, pyRound), `register.ts` (Register, normalizeRegisterEntry, Register.emit tanpa I/O), `arith.ts` (evalArith: tokenizer + recursive descent), `derivation.ts` (Derivation, checkResult, buildDerivationBlock, monoLine, inlineText), `audit.ts` (auditText, auditRetired, BIND_NUMBER_PATTERN_SOURCE). Klaim tambahan `defect.ts` ditambahkan ke file_claims.md.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/bind"` -> kosong (exit 1); total repo 21 galat, semuanya pra-ada di luar Studio (sama dengan marker S03).
- `npx eslint src/lib/studio/engine/bind` -> exit 0, tanpa keluaran.
- `grep -rnE "eval\(|new Function|vm\." src/lib/studio/engine/bind` -> kosong (exit 1).
- Paritas ad hoc (bukan suite uji) vs datumbind.py via VENV -I -B: fmt 15/15, evalArith 19/19 (repr float identik), auditText 4/4 identik; 12 ekspresi rusak/berbahaya (`__import__('os')`, `1/0`, `sqrt(-1)`, `10**400`, ...) semuanya BindDefect; Register menolak satuan kosong/spasi, tanda kosong, tanda tak dikenal; glif tanda dinormalisasi.

Keputusan (dicatat controller):
1. fmt meniru Python persis: half-even atas nilai biner eksak (BigInt), bukan toFixed; `-0` dipertahankan seperti Python. Nilai tak hingga dan dec di luar 0..20 -> BindDefect (Python mencetak "nan"/"inf").
2. Register memvalidasi saat konstruksi (semantik emit Python) termasuk `dec` 0..3 per kontrak; LIMIT E-12 (_known berhenti di dec 3) dipertahankan.
3. Subhimpunan Python di parser: + - * / // % **, unary, kurung, abs/round/sqrt/min/max; nama register berspasi dicocokkan terpanjang dulu plus alias garis bawah. Lebih ketat dari Python: perbandingan/boolean/hex ditolak, hasil non-hingga ditolak (Python meloloskan NaN pada cek toleransi), batas panjang 4096 dan kedalaman 100. Bilangan bulat besar > 2^53 tidak eksak (double JS).
4. Derivation: konstruktor stub (id, title, register) dipertahankan + opsi {width, note}; `label` = `id · title` (caption milik renderer). Baris terstruktur `rows` + baris mono Python `lines`. `verdict` mendukung `direction` kontrak (Python hanya <=).
5. auditRetired melempar BindDefect untuk entri kosong (Python akan selalu menandai ""). audit_docx (ekstraksi teks DOCX) tidak diport: pemanggil menyerahkan teks.
6. Tidak ada jalur catch yang menelan galat; satu catch di `Derivation.result` membungkus ulang menjadi BindDefect (dilempar ke layanan yang mencatat).

Permintaan lintas pemilik: tidak ada. Temuan: tidak ada. Review direkomendasikan (S85, lingkup engine/bind).
