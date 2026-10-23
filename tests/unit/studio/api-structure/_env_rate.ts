// SR-45: varian lingkungan untuk uji laju FIX-1 (S87 M-03): batas render per pemanggil = 3.
// Diimpor PERTAMA di rate.test.ts (sebelum modul route) agar render-guard membaca nilai ini.
import { applySr45Env } from './_env';

export const RATE_LIMIT = 3;
applySr45Env({ renderRateLimit: RATE_LIMIT });
