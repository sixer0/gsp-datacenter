import { defineConfig } from 'vitest/config';
import path from 'node:path';

// W2.3 (audit GSP-OS v3.0, 31-08-2026): bootstrap test otomatis pertama repo ini.
// Dua suite:
//   tests/unit/**  — murni, tanpa jaringan (gerbang dev-bypass, helper requireSession).
//   tests/smoke/** — probe HTTPS ke HQ live (127.0.0.1:9011); AUTO-SKIP bila HQ mati
//                    atau .env tidak ada, supaya `npm test` tidak pernah merah karena
//                    lingkungan, bukan karena regresi.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Suite unit dan smoke sama-sama cepat; jangan paralelkan smoke terhadap HQ live.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
