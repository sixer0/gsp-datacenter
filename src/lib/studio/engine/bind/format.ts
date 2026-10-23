/**
 * Konvensi angka DATUM (DT-30; parameter kelas K P6-31, P6-32, P6-33, P6-39):
 * pemisah ribuan ".", pemisah desimal ",", spasi antara nilai dan satuan,
 * mata uang mendahului nilai. Port `fmt` dan `_withunit` datumbind.py.
 *
 * Pembulatan meniru Python `f"{v:,.{dec}f}"` persis: half-even terhadap nilai
 * biner EKSAK double (mis. 2.5 -> "2", 2.675 dec 2 -> "2,67"), tanda negatif
 * dipertahankan termasuk -0 ("-0"). `Number.prototype.toFixed` tidak dipakai
 * karena memutus seri ke atas.
 */
import { BindDefect } from "./defect";

export const DATUM_THOUSANDS_SEPARATOR = ".";
export const DATUM_DECIMAL_SEPARATOR = ",";
/** P6-39: satuan yang mendahului nilai. */
export const DATUM_LEADING_UNITS: readonly string[] = ["Rp", "USD", "EUR", "SGD"];
/** Batas jumlah desimal yang diterima fmt (Python tidak membatasi; ini penjaga masukan). */
export const DATUM_MAX_DECIMALS = 20;

const BIG0 = BigInt(0);
const BIG1 = BigInt(1);
const BIG2 = BigInt(2);
const BIG10 = BigInt(10);

interface DecomposedDouble {
  negative: boolean;
  /** Nilai mutlak = mantissa * 2^exp. */
  mantissa: bigint;
  exp: number;
}

function decompose(v: number): DecomposedDouble {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, v);
  const hi = view.getUint32(0);
  const lo = view.getUint32(4);
  const negative = hi >>> 31 === 1;
  const biased = (hi >>> 20) & 0x7ff;
  const fracHi = hi & 0xfffff;
  let mantissa = (BigInt(fracHi) << BigInt(32)) | BigInt(lo);
  let exp: number;
  if (biased === 0) {
    exp = -1074; // subnormal
  } else {
    mantissa |= BIG1 << BigInt(52);
    exp = biased - 1075;
  }
  return { negative, mantissa, exp };
}

function pow10(n: number): bigint {
  let r = BIG1;
  for (let i = 0; i < n; i++) r *= BIG10;
  return r;
}

/**
 * Bulatkan |v| * 10^digits ke bilangan bulat, half-even terhadap nilai eksak.
 * `digits` boleh negatif (pembulatan ke puluhan, ratusan, ...).
 */
function roundScaledExact(v: number, digits: number): { negative: boolean; q: bigint } {
  const { negative, mantissa, exp } = decompose(v);
  let num = mantissa;
  let den = BIG1;
  if (exp >= 0) num <<= BigInt(exp);
  else den <<= BigInt(-exp);
  if (digits >= 0) num *= pow10(digits);
  else den *= pow10(-digits);
  let q = num / den;
  const r2 = (num % den) * BIG2;
  if (r2 > den || (r2 === den && q % BIG2 !== BIG0)) q += BIG1;
  return { negative, q };
}

function groupThousands(intDigits: string): string {
  let out = "";
  for (let i = 0; i < intDigits.length; i++) {
    if (i > 0 && (intDigits.length - i) % 3 === 0) out += DATUM_THOUSANDS_SEPARATOR;
    out += intDigits[i];
  }
  return out;
}

function checkDec(dec: number): void {
  if (!Number.isInteger(dec) || dec < 0 || dec > DATUM_MAX_DECIMALS) {
    throw new BindDefect(`jumlah desimal "${dec}" tidak sah (bilangan bulat 0..${DATUM_MAX_DECIMALS}).`);
  }
}

/** Ribuan "." dan desimal ",", tidak pernah terbalik (DATUM §10, DT-30). */
export function fmt(v: number, dec = 0): string {
  checkDec(dec);
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new BindDefect(`nilai "${String(v)}" bukan bilangan hingga; tidak dapat diformat.`);
  }
  const { negative, q } = roundScaledExact(v, dec);
  let digits = q.toString();
  if (dec > 0 && digits.length <= dec) digits = "0".repeat(dec - digits.length + 1) + digits;
  const intPart = dec > 0 ? digits.slice(0, digits.length - dec) : digits;
  const fracPart = dec > 0 ? digits.slice(digits.length - dec) : "";
  const body = groupThousands(intPart) + (dec > 0 ? DATUM_DECIMAL_SEPARATOR + fracPart : "");
  return (negative ? "-" : "") + body;
}

/**
 * Padanan Python `round(x, n)` untuk float: half-even terhadap nilai eksak.
 * Tanpa `n` hasilnya bilangan bulat (Python `round(x)`).
 */
export function pyRound(x: number, n = 0): number {
  if (!Number.isFinite(x)) {
    throw new BindDefect(`round() atas nilai tak hingga "${String(x)}".`);
  }
  if (!Number.isInteger(n) || Math.abs(n) > 308) {
    throw new BindDefect(`round(): jumlah digit "${n}" tidak sah.`);
  }
  const { negative, q } = roundScaledExact(x, n);
  const s = q.toString();
  let mag: number;
  if (n > 0) {
    const padded = s.length <= n ? "0".repeat(n - s.length + 1) + s : s;
    mag = Number(`${padded.slice(0, padded.length - n)}.${padded.slice(padded.length - n)}`);
  } else {
    mag = Number(s + "0".repeat(-n));
  }
  return negative ? -mag : mag;
}

/** Mata uang mendahului, satuan lain menyusul, selalu dipisah satu spasi (DATUM §10). */
export function withUnit(s: string, unit?: string | null): string {
  if (!unit) return s;
  return DATUM_LEADING_UNITS.includes(unit) ? `${unit} ${s}` : `${s} ${unit}`;
}
