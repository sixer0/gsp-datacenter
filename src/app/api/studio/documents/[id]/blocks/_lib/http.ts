/**
 * Utilitas khusus route S56 (R06 blocks/[address], R07 revisions).
 * Folder `_lib` privat (tidak dirutekan App Router).
 *
 * Helper HTTP umum (log JSONL tahan lama, correlation id, batas badan,
 * pemetaan galat §6.3) ada di `@/lib/studio/http` (IP-08); berkas ini hanya
 * memuat sumber log S56 dan dekode alamat §4.1.
 */
import { parseAddress, formatAddress } from "@/lib/studio/contract/address";

export const API_LOG_SOURCE = "studio.api.s56";

/**
 * Dekode segmen `[address]` lalu validasi dengan tata bahasa §4.1.
 * Alamat sah tidak pernah memuat `%`, jadi dekode dilakukan tepat sekali bila
 * `%` ada (aman baik bila Next sudah mendekode maupun belum). Null = 400 ADDRESS_INVALID.
 */
export function decodeAddressParam(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 600) return null;
  let s = raw;
  if (s.includes("%")) {
    try {
      s = decodeURIComponent(s);
    } catch {
      return null;
    }
  }
  const parsed = parseAddress(s);
  return parsed ? formatAddress(parsed) : null;
}
