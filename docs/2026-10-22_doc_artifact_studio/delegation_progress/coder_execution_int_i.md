# INT-I coder-execution: IP-12 + IP-22 + IP-21 (status: complete)

Berkas: `prisma/seed-studio.ts` (ditulis ulang, area eksklusif). DB: hanya `gsp_agent_hq_v21`. Tanpa migrate dev/db push.

## IP-12 (F-029)
- Seed kini: 51 section type (upsert) + `ensureCanonicalTemplate({createdBy:"seed-studio", syncRegistry:true})` (membandingkan versi kanonik TERBARU; beda -> versi baru, versi lama tak disentuh). `--refresh-v1` lama ditolak dengan galat. Opsi baru `--import-benchmark` -> `importTemplateProfile(benchmark/manual000/template.json, ADMIN_SESSION, slug datum-manual-000)`.
- Seed run 1: `synced` v2 -> v3 (sha b5d0d925...), exit 0; run 2: `unchanged` v3, exit 0.
- `--import-benchmark` run 1: `created` datum-manual-000 v1 (709 kunci, droppedDerived 0); run 2: `unchanged`; kanonik tetap `unchanged` v3.
- DB sesudah: StudioTemplate 2 (datum-kanonik 3 versi, datum-manual-000 1 versi), StudioTemplateVersion 4, StudioSectionType 51.

## IP-22 (F-035)
- Inventaris sebelum: Document 2 (001, 002), Revision 2, Block 6, Artifact 1 (CHART P-01), OutputFile 4, RenderJob 3 (2 PARTIAL + 1 SUCCEEDED). Semua baris Studio data = data uji S100.
- Hapus dalam satu transaksi (OutputFile, RenderJob, Block, Revision, Artifact, Document): sesudah semuanya 0. Template/versi/sectionType tak disentuh.
- Berkas dihapus: 4 (2 DOCX, T.svg, T.png) + folder kosong di bawah `data/studio-workspace/docs/`; sisa: `docs/`, `logs/`, `tmp/storage/`.
- Non-Studio sebelum = sesudah: WorkerTrace 1488, IlSearchDoc 18186, AgentRequest 757.

## IP-21
- Port 3217 bebas; tidak ada proses `next dev`. `hq-server.mjs` PID 19956 (port 9011) tidak disentuh. Satu `tsc` milik baris lain terlihat, tidak disentuh.

## Penjaga
- `tsc --noEmit | grep prisma/seed-studio` kosong (berkas ada di daftar tsc; 21 galat pra-ada di area lain, IP-17). `npx eslint prisma/seed-studio.ts` exit 0.

## Catatan
- Penomoran dokumen diturunkan dari baris DB (max+1), jadi dokumen berikutnya kembali 001.
