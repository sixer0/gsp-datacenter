# Changelog — gsp-datacenter (GSP)

- **Repo**: https://github.com/sixer0/gsp-datacenter.git · branch `main`
- **Sumber data**: `git log` (ekspor `Temp/changelog-push/export.sh` dijalankan ulang dan diverifikasi 2026-08-31)
- **Cakupan**: root commit `227cb17` (2026-08-24) s/d HEAD pra-commit-dokumen `5635cbb` (2026-08-31) — total 40 commit terdokumentasi
- **Disusun**: 2026-08-31. Entri di-backdate retrospektif: tanggal = tanggal commit ASLI;
  tidak ada manipulasi histori (tanpa rebase/amend/force-push/--date).

## [Unreleased]

| hash | tanggal | tipe | ringkasan perubahan | kronologis |
|------|---------|------|---------------------|------------|
| (commit ini) | 2026-08-31 | docs | Changelog: entri commit 3ce18d4..5635cbb (fix bridge dedup + lean-policy provisioning) | — |

## 2026-08-24

| hash | tanggal | tipe | ringkasan perubahan | kronologis |
|------|---------|------|---------------------|------------|
| 227cb17 | 2026-08-24 | — | Salinan gemilang-perkasa/gsp-datacenter — backup GSP Agent Headquarter (2026-08-24), tanpa secret | 1 |

## 2026-08-25

| hash | tanggal | tipe | ringkasan perubahan | kronologis |
|------|---------|------|---------------------|------------|
| 1334783 | 2026-08-25 | fix | fix(user-access): validasi client create user + datalist profil Hermes | 2 |
| d45db29 | 2026-08-25 | fix | fix(information-library): standarisasi UI filtering | 3 |
| e1941ff | 2026-08-25 | fix | fix(information-library): organisasi domain → project (bukan ribuan baris) | 4 |
| e351e3a | 2026-08-25 | fix | fix(information-library): knowledge-first — dump mentah arsip tidak lagi membanjiri hasil | 5 |
| b9e202d | 2026-08-25 | fix | fix(information-library): knowledge-first murni — raw tidak diangkat tanpa analisa | 6 |
| bd944be | 2026-08-25 | feat | feat(roster): tambah gsp-custodian — verifikator independen hasil analisa library | 7 |
| 03840b8 | 2026-08-25 | feat | feat(il): Ask Librarian multi-table + vault di scope default + parseFm CRLF + declutter filter | 8 |
| 766105b | 2026-08-25 | chore | chore: ignore logs & bridge node_modules | 9 |
| 3e7caf3 | 2026-08-25 | chore | chore: track bridge launcher script | 10 |

## 2026-08-26

| hash | tanggal | tipe | ringkasan perubahan | kronologis |
|------|---------|------|---------------------|------------|
| 9b22259 | 2026-08-26 | feat | feat(roster): pindahkan gsp-librarian & gsp-custodian ke Level 2 Penasihat Utama | 11 |
| edb196b | 2026-08-26 | fix | fix(il): mirror wiki parseEntry CRLF + path forward-slash; IL wiki cap 5000 + domain dari tags | 12 |

## 2026-08-29

| hash | tanggal | tipe | ringkasan perubahan | kronologis |
|------|---------|------|---------------------|------------|
| 589bdaf | 2026-08-29 | fix | fix(bridge): hard-timeout hermes CLI + startup-order + zombie recovery | 13 |
| 4529192 | 2026-08-29 | fix | fix(bridge): hard-timeout hermes CLI + startup-order + zombie recovery | 14 |
| 2707cb2 | 2026-08-29 | feat | feat(hq): improvement terakumulasi — IL propose, Ask Librarian parser, rebrand Swarm, ROSTER 4 profil sistem | 15 |

## 2026-08-30

| hash | tanggal | tipe | ringkasan perubahan | kronologis |
|------|---------|------|---------------------|------------|
| 8440d2f | 2026-08-30 | fix | fix(security): audit ekosistem 30-08 — hotfix SEC-002/003/004/006 + patch bridge SEC-005/007-010 (restart tertunda) | 16 |
| 2010713 | 2026-08-30 | feat | feat(hq): SEC-001 ditutup — production server hq-server.mjs (bind 127.0.0.1+tailscale, NODE_ENV=production) | 17 |
| e3a063d | 2026-08-30 | feat | feat(kpi): halaman dispatch-kpi + guard force-done/request-changes + sidebar (audit 30-08) | 18 |
| 1eecb46 | 2026-08-30 | feat | feat(hq): login terpadu Swarm HQ — akun WebUiUser + sesi HMAC gsp_hq_session (fix SEC-001 regression rbac/*) | 19 |
| e29f6fd | 2026-08-30 | docs | docs(login-terpadu): hasil verifikasi 14/14 PASS + catatan endpoint cleanup | 20 |

## 2026-08-31

| hash | tanggal | tipe | ringkasan perubahan | kronologis |
|------|---------|------|---------------------|------------|
| 7a61b76 | 2026-08-31 | docs | docs: update README + CHANGELOG pointer per commit (backdate 2026-08-24..2026-08-30) | 21 |
| c07c3cc | 2026-08-31 | fix(W1.1) | fix(W1.1): remove dead hardcoded internal-secret header from client pages [audit GSP-OS v3.0] | 22 |
| c32d720 | 2026-08-31 | fix(W1.2) | fix(W1.2): remove dead update endpoints (0 callers verified) [F-SEC-002] | 23 |
| 5eec54d | 2026-08-31 | chore(W3.5) | chore(W3.5): drop bridge backup file, ignore *.bak-* [F-XP-004] | 24 |
| 2bac7ca | 2026-08-31 | docs(W4.1) | docs(W4.1): RBAC vars in .env.example [F-CFG-002] | 25 |
| bf13f19 | 2026-08-31 | docs(W4.1) | docs(W4.1): RBAC vars in .env.example [F-CFG-002] | 26 |
| 49a7e9c | 2026-08-31 | fix(W2.1) | fix(W2.1): gate dev-bypass middleware with ALLOW_DEV_BYPASS=1 [F-SEC-003] | 27 |
| 9b6fe59 | 2026-08-31 | test(W2.3) | test(W2.3): bootstrap vitest + smoke 401 + unit dev-bypass + requireSession helper [F-XP-003] | 28 |
| cb46b21 | 2026-08-31 | feat(W1.3+W3.3) | feat(W1.3+W3.3): dynamic agent roster from disk+config, static-safe fallback [N-1,N-2,N-3] | 29 |
| 89e8409 | 2026-08-31 | feat(W2.2) | feat(W2.2): requireSession on mutating routes batch 1 (agent*, articles*) [F-SEC-004] | 30 |
| 12ee3a3 | 2026-08-31 | feat(W2.2) | feat(W2.2): requireSession on mutating routes batch 2 (brahma*, ideas, information-library*, longform*, youtube/ideas/generate) [F-SEC-004] | 31 |
| 41dcd9a | 2026-08-31 | test(W1.3/W3.3) | test(W1.3/W3.3): unit test builder roster dinamis agent-roster [N-1,N-2,N-3] | 32 |
| 4ba16c9 | 2026-08-31 | feat(W2.2) | feat(W2.2): requireSession on mutating routes batch 3 (orchestration, tasks, user-access*, x-content*, youtube*) [F-SEC-004] | 33 |
| 020d1ac | 2026-08-31 | feat(W3.1) | feat(W3.1): DB-level @@unique([hermesProfile]) on WebUiUser + schema comment fix [F-ARCH-003] | 34 |
| dba97a2 | 2026-08-31 | fix(W3.2) | fix(W3.2): limit anonymous /api/garden payload to public fields [F-SEC-006] | 35 |
| 9b6406b | 2026-08-31 | docs(W2.1)+test(W2.3) | docs(W2.1)+test(W2.3): ALLOW_DEV_BYPASS di .env.example + smoke GET agents/orchestration/tasks + tool suntik guard W2.2 | 36 |
| 5490dd6 | 2026-08-31 | chore(W4.2) | chore(W4.2): remove unused better-sqlite3 & drizzle-orm [dead-deps] | 37 |
| 3ce18d4 | 2026-08-31 | docs | docs: changelog entri 7a61b76..5490dd6 (audit-backlog execution) | 38 |
| 6db8629 | 2026-08-31 | fix(bridge) | fix(bridge): dedup kartu misi + cegah eksekusi ganda dispatcher-vs-bridge (insiden t_4db40b42/t_5aab0b7f) | 39 |
| 5635cbb | 2026-08-31 | feat(provisioning) | feat(provisioning): hormati marker .lean-policy saat merge skills (misi enforcement dua-lane) | 40 |
