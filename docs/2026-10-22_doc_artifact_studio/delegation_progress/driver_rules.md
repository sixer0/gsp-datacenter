# Aturan driver — Doc Artifact Studio (berlaku untuk setiap baris)

Penulis: controller. Setiap brief merujuk berkas ini; baca utuh sebelum mulai.

Akar repo: `C:\Users\TRIAL\gsp-swarm-hq-v2.1` (branch `v2.1`). Folder tugas: `docs/2026-10-22_doc_artifact_studio/` (selanjutnya `<task>`).
Blueprint: `<task>/identification/02_structured.md`. Keputusan mengikat: `<task>/decisions/decisions.md` (D-01..D-22).

## Mode

- Paralel penuh dengan file ownership (D-07, D-08). Pengujian, paritas, benchmark, review berada di fase final; baris implementasi hanya menjalankan penjaga kompilasi/kelengkapan.
- Temuan apa pun tidak menghentikan pekerjaan (D-19): laporkan di catatanmu; controller mencatat di register.

## Area dan berkas bersama

1. Kerjakan HANYA area milik barismu (lihat `delegation_progress/file_ownership.md` dan kolom Expected Output baris di blueprint). Semua yang lain read-only, termasuk `src/lib/studio/contract/**` setelah marker `<task>/implementation/01_contract_landed.md` ada, dan semua sumber acuan: `C:\Users\TRIAL\AppData\Local\hermes\skills\gsp\datum-house-style` (HS), `C:\Users\TRIAL\AppData\Local\hermes\profiles\gspuser02\skills\datum-revl` (RL), venv `C:\Users\TRIAL\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe` (VENV), `C:\Users\TRIAL\workspace\Manual DATUM GSP\Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA.{pdf,docx}` (BM), `C:\Users\TRIAL\AppData\Local\Temp\hq_v21_clone\scripts\calib_compare.py` (CAL).
2. TINDAKAN PERTAMA baris penulis kode: tambahkan path persis yang akan kamu tulis ke `<task>/delegation_progress/file_claims.md` (satu baris per path, diawali ID langkah, mis. `S14 src/lib/studio/engine/docx/package/index.ts`). Pakai Edit aditif setelah membaca ulang berkas; jangan menulis ulang berkas itu.
3. Butuh perubahan di berkas milik baris lain atau di kontrak? Tambahkan SATU baris ke `<task>/delegation_progress/file_requests.md` (format: `IDpeminta | path | perubahan persis | blocking ya/tidak`), lalu lanjut di balik seam (adapter lokal, tipe lokal sementara). Jangan menyunting berkas itu sendiri.
4. Berkas bersama (`prisma/schema.prisma`, migrasi, `package.json`, `package-lock.json`, `src/components/sidebar.tsx`, `src/components/command-palette.tsx`, `next.config.ts`, `.gitignore`, `docs/API-REFERENCE.md`) hanya disunting pemilik tunggalnya menurut blueprint.

## Larangan keras

- DB: hanya `gsp_agent_hq_v21` (dan DB uji `gsp_agent_hq_v21_uji` di fase final). Produksi `gsp_agent_hq` tidak pernah disentuh. **Dilarang `prisma migrate dev` dan `prisma db push`** (D-21): migrasi dibuat dengan `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script`, diterapkan dengan `prisma migrate deploy`. Tabel `WorkerTrace` dan `IlSearchDoc` tidak boleh dihapus.
- Penyimpanan Studio selama v2.1: akar `STUDIO_WORKSPACE_ROOT` = `data/studio-workspace` (D-22 KT-03). Tidak pernah menulis ke `SHARED_WORKSPACE` produksi.
- soffice hanya lewat layanan S92 atau profil sementara sendiri (`-env:UserInstallation=file:///<dir sementara>`), dengan batas waktu dan tree-kill. Profil default user tidak pernah dipakai. Registri fon HKCU tidak pernah ditulis.
- Python acuan dijalankan dengan `VENV -I -B`, cwd di luar folder skill; skill tidak diubah.
- `eval`, `new Function`, dan eksekusi shell dari masukan user dilarang di kode aplikasi.
- Jangan menjalankan suite uji penuh, jangan `git commit`/`push`, jangan menyunting `<task>/decisions/`, `<task>/status_tasks.md`, `<task>/findings/`, `<task>/README.md`.

## Penjaga per baris (bukan uji)

- TypeScript: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "<pola path areamu>"` harus kosong untuk areamu. Galat di area lain: laporkan, jangan perbaiki.
- `npx eslint <path areamu>` bersih.
- Python: `VENV -I -B -m py_compile <berkas>`; CLI `--help` exit 0 bila ada CLI.
- Data: hitungan sesuai baris (kutip perintah dan keluarannya).

## Laporan

- Catatan baris: `<task>/delegation_progress/<agent_snake>_<snn>.md` (snake_case wajib oleh hook, mis. `coder_execution_s14.md`, `data_collector_s90.md`), maks 30 baris: status, berkas, angka, keputusan, permintaan, temuan.
- Jawaban akhir ke controller: ringkas (maks 25 baris), memuat status, daftar berkas, bukti penjaga (perintah + keluaran), permintaan lintas pemilik, temuan.

## Documentation Contract

```
Documentation Contract:
- Task archive: write every artifact under docs/2026-10-22_doc_artifact_studio/ (relative to the workspace root, never a leading "/"), in the phase folder that fits (identification, research, masterplan, initialization, implementation, gateway_check, test, verification, report, decisions). Use snake_case file names with zero-padded numbering. Never delete or rename an existing artifact. Never write under an output/ path inside the task folder. No emoji in artifacts.
- Skills_to_Load for this step: [lihat brief baris]. Load exactly these skills before you start. Do not ask the user which procedure to use.
- Own-artifact rule: you write only the artifact this step names as its Expected Output: [lihat brief baris]. Treat every other file as read-only. Never write README.md, status_tasks.md, decisions/decisions.md, report/report.md, gateway_check/01_gate_report.md or implementation/99_implementation_report.md; only the controller writes those. Do not edit masterplan/02_plan.md unless you are pm-planner writing it. Report your status, decisions and any change you need in a file you do not own in your own artifact and final response; the controller applies them. You cannot dispatch other agents or ask the user: return needs-review with the request instead.
- PARALLEL RUN: also do NOT write to delegation_progress_report.md or any file another agent may touch. Write your progress record to docs/2026-10-22_doc_artifact_studio/delegation_progress/[your_agent_name_snake_case]_[snn].md instead. Before you write code or files, append the exact paths you will write to docs/2026-10-22_doc_artifact_studio/delegation_progress/file_claims.md if the controller created it.
- Read first: docs/2026-10-22_doc_artifact_studio/identification/02_structured.md (your row), docs/2026-10-22_doc_artifact_studio/decisions/decisions.md, and the inputs named in your row.
- Your final response MUST include: (1) an explicit status: complete | blocked | needs-review; (2) the exact list of files you created or updated; (3) milestones, blockers and decisions the controller must record; (4) fresh verification evidence (the command you ran and its actual result).
- If you cannot write under docs/, stop and return BLOCKED:DOCS_UNAVAILABLE with the reason. Do not write elsewhere instead.
- Do not claim complete unless every required artifact exists and is non-empty. Use needs-review when work is partly done and say exactly what is not built.
```
