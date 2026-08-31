# Changelog — gsp-datacenter (GSP)

- **Repo**: https://github.com/sixer0/gsp-datacenter.git · branch `main`
- **Sumber data**: `git log` (ekspor `Temp/readme-changelog/gsp-datacenter.log` diverifikasi 2026-08-31)
- **Cakupan**: root commit `227cb17` (2026-08-24) s/d HEAD pra-commit-dokumen `e29f6fd` (2026-08-30) — 20 commit
- **Disusun**: 2026-08-31. Entri di-backdate retrospektif: tanggal = tanggal commit ASLI;
  tidak ada manipulasi histori (tanpa rebase/amend/force-push/--date).

## [Unreleased]

| hash | tanggal | tipe | ringkasan perubahan | kronologis |
|------|---------|------|---------------------|------------|
| (commit ini) | 2026-08-31 | docs | Update README sesuai kondisi terkini + CHANGELOG pointer per commit | — |

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
