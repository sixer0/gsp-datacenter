/*
 * Kebijakan coba ulang bersama UI Studio: jeda 3 s, 6 s, 12 s; maks 3 kali
 * (galat jaringan dan 5xx saja; 4xx tidak dicoba ulang). Satu sumber nilai untuk
 * semua folder komponen Studio; hook coba ulang tiap folder tetap lokal karena
 * perilaku UI-nya berbeda.
 */

/** Jeda percobaan ulang (ms) per percobaan ke-1, ke-2, ke-3. */
export const RETRY_DELAYS_MS = [3000, 6000, 12000] as const;

/** Jeda yang sama dalam detik (untuk hitung mundur). */
export const RETRY_DELAYS_S = [3, 6, 12] as const;
