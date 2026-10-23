# Antrean peluncuran (controller) — batas sistem 20 subagen serentak

| Urutan | Baris | Status |
|---|---|---|
| 1 | S48 | DILUNCURKAN (slot S15) |
| 2 | S51 | DILUNCURKAN |
| 3 | S52 | DILUNCURKAN (slot S93) |
| 4 | S49 | DILUNCURKAN (slot S29) |
| 5 | S50 | DILUNCURKAN (slot S24) |
| 6 | S44 | DILUNCURKAN (slot S19) |
| 7 | S46 | DILUNCURKAN (slot S70) |
| 8 | S45 | DILUNCURKAN (slot S16) |
| 9 | S47 | DILUNCURKAN |
| 10 | G1d: S53-S63, S100-S102 | ANTRE |
| 11 | G1e: S33-S43, S67, S97 | ANTRE |
| 12 | S68, S69 (menunggu tepi B) | MENUNGGU |
| 13 | S03-d1 delta kontrak + R01 (F-023) | DILUNCURKAN |
| - | G1d diluncurkan: S54, S55 | DILUNCURKAN |
| - | G1d: S56 | DILUNCURKAN (slot S20) |
| - | G1d: S53, S57 | DILUNCURKAN (slot S52, S17) |
| - | G1d: S60 | DILUNCURKAN (slot S51) |
| - | G1d: S58 | DILUNCURKAN (slot S21) |
| - | G1d: S61 | DILUNCURKAN (slot S50) |
| - | G1d: S59 | DILUNCURKAN (slot S44) |
| - | G1d: S101 | DILUNCURKAN (slot S54) |
| - | G1d: S62 | DILUNCURKAN (slot S56) |
| - | G1d: S100 | DILUNCURKAN (slot S94) |
| - | G1d: S102 | DILUNCURKAN (slot S47) |
| - | G1e: S67 | DILUNCURKAN (slot S55) |
| - | G1d: S63 | DILUNCURKAN (slot S53) |
| - | G1e: S97 | DILUNCURKAN (slot S49) |
| - | G1e: S33, S34 | DILUNCURKAN (slot S32, S48) |
| - | G1e: S35 | DILUNCURKAN (slot S45) |
| - | Integrasi: S69 | DILUNCURKAN (slot S60) |
| - | G1e: S36 | DILUNCURKAN (slot S18) |
| - | S68 (coder-execution, D-67) | DILUNCURKAN (slot S57) |
| - | G1e: S37 | DILUNCURKAN (slot S101) |
| - | G1e: S38 | DILUNCURKAN (slot S03-d1) |
| - | G1e: S39, S40 | DILUNCURKAN (slot S46, S69) |
| - | G1e: S41 | DILUNCURKAN (slot S61) |
| - | G1e: S42 | DILUNCURKAN (slot S102) |
| - | G1e: S43 (terakhir) | DILUNCURKAN (slot S58) |

## Peta baris → agen (controller, untuk mediasi; jangan salah alamat — lihat D-148)
| Baris | Agen |
|---|---|
| SR-06 | a50f28d2 |
| SR-07 | a8235a66 |
| SR-08 | a0979f59 |
| SR-09 | aaf471b3 |
| SR-10 | ab058ea2 |
| SR-11 | af672550 |
| SR-12 | a9883a6e |
| SR-13 | a1260eb0 |
| SR-14 | a2a9ba11 |
| SR-15 | a13cf20f |
| SR-16 | aeb2e3c0 |
| SR-18 | ac81d019 |
| SR-19 | a588fe9a |
| SR-20 | a2bba3d9 |
| SR-21 | ab3b1703 |
| SR-22 | a40f7eed |
| SR-23 | a8b5a913 |
| SR-24 | a0efeeda |
| SR-25 | a3c28cd4 |
| SR-26 | ad689686 |
| Antre B2b | SR-17, SR-27, SR-28, SR-29, SR-30, SR-31, SR-33, SR-35, SR-61, IP-41d, IP-45, IP-46 |

## Fase uji akhir — gelombang A (2026-10-23, D-239)
| Baris | Agen | ID |
|---|---|---|
| SR-40 | coder-execution | a1c09b6569175f018 |
| SR-41 | coder-execution | adb4a995d63530e04 |
| SR-42 | test-expert | a8dc4920db2535e4e |
| SR-43 | test-expert | ac77d7d45e5cb7dd3 |
| SR-44 | test-expert | a65ffaf9026f3b274 |
| SR-45 | test-expert | a974d1cafdf836cde |
| SR-49 | test-expert | a0f5c14bb570aeb65 |
| SR-51 | test-expert | aea5355975549e05e |
| SR-55 | senior-code-reviewer | a211be280faa98f8d |
| SR-56 | senior-code-reviewer | a68d3dd260b0f399f |
| SR-57 | security-review | aef0480dd4a111e33 |

## Loop perbaikan siklus 1 (2026-10-23, D-241..D-246)
| Baris | Agen | ID |
|---|---|---|
| FIX-B (B-1, B-2, K-1, diagram turunan) | coder-execution | a5865a226e87edd1a |
| FIX-S | coder-execution | a5283625f6f72f76a |
| FIX-FIG (+K-2) | coder-execution | a8514c8186d69fe5e |
| FIX-C | coder-execution | a44e7ff19680355ed |
| FIX-U | coder-execution | a3e8ac142c38d334e |
| FIX-SEC | coder-execution | a81a65b46f47d672f |
| FIX-R | coder-execution | ae5b22e41b5d113e9 |
| FIX-SEED | coder-execution | aafb7de1af89c7355 |
| FIX-L | coder-execution | a571691ed3929a607 |
| SR-53 | test-expert | a8fa88047a7206f5a |

## Loop perbaikan siklus 2 (2026-10-23, D-261)
| Baris | Agen | ID |
|---|---|---|
| FIX-W | coder-execution | a1951f24cac0a8747 |
| FIX-V | coder-execution | a6ad74e5154eacfcb |
| FIX-A (IP-59) | coder-execution | a13086b69473ec662 |
| FIX-W | coder-execution | a1951f24cac0a8747 |
| FIX-X | coder-execution | ae852fc34a7ab09f7 |
| RESEED | coder-execution | a5003ac622c67bcda |
| FIX-Y | coder-execution | a3dff39cdb6d13193 |

## Verifikasi pasca-siklus B1 (2026-10-23, D-275)
| Baris | Agen (dilanjutkan) | ID |
|---|---|---|
| SR-42 lanjutan | test-expert | a8dc4920db2535e4e |
| SR-43 lanjutan (fix1) | test-expert | ac77d7d45e5cb7dd3 |
| SR-49 rerun | test-expert | a0f5c14bb570aeb65 |
| SR-51 rerun + analisis | test-expert | aea5355975549e05e |
| SR-57 security ulang 2 | security-review | aef0480dd4a111e33 |
| SR-55b | senior-code-reviewer | a211be280faa98f8d |
| SR-56b | senior-code-reviewer | a68d3dd260b0f399f |
| DOC-2 | document-specialist | a81fcd43b73b4ac7d |
| SR-52 E2E (baru) | test-expert | a4f48df3a72c0b3f3 |
| FIX-B2 (siklus 3) | coder-execution | ad45d6aec2bebb20a |
| FIX-T (siklus 3) | coder-execution | a377fbcc95cdb2ae3 |
| FIX-S2 (siklus 3) | coder-execution | a7f624d52cb6cdea6 |
| FIX-A2 (siklus 3) | coder-execution | a930c47bb6a70cbd5 |
| FIX-U2 (siklus 3) | coder-execution | af286b8c6133d8341 |
| FIX-Z (siklus 3, tier D) | coder-execution | acdd5e4712258487d |
| SR-46 | test-expert | a789f894095299123 |
| SR-47 | test-expert | aaa349e3014580ad6 |
| SR-48 | test-expert | a62ef1f534a4df4a2 |
| SR-50 | test-expert | a067588f81ee353a7 |
| FIX-H (siklus 3) | coder-execution | a02d5704f42636eed |
| FIX-SERAH (siklus 3) | coder-execution | a6b048383fe3c636d |
| FIX-C2 (siklus 3) | coder-execution | ac5ed5281c7aae04a |
| SR-54 kinerja | test-expert | aa30851e85feef8ae |
| SR-58 verifikasi akhir | verifier | a297e4c2794f1422a |
| FIX-2 (F-055) | coder-execution | aa7642ce90c657bb1 |
| DL-1 datum_lint | test-expert | a0dc559eb7626c7dc |
| SR-45 lanjutan multipart | test-expert | a974d1cafdf836cde |
| FIX-F (penutup review akhir) | coder-execution | aafe0ee945eb3311a |
