import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/information-library/propose
// Usulan knowledge ke librarian (gatekeeper IL) — pengganti jalur editor lama untuk
// proposa BARU. Menerima lampiran (file di shared workspace via /propose/upload,
// atau URL). Librarian menjalankan pipeline: menilai → dedup → meninjau → analisa
// lampiran → buat objek vault (vault_propose.py) → verifikasi INDEPENDEN oleh
// gsp-custodian → promote (vault_promote.py) bila terverifikasi, atau lapor revisi.
// revisiOf = requestId proposa sebelumnya (loop revisi, maks 3).
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const title = (b.title || "").toString().trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "title terlalu panjang (maks 200)" }, { status: 400 });
  if ((b.body || "").toString().length > 20000)
    return NextResponse.json({ error: "body terlalu panjang (maks 20000)" }, { status: 400 });

  const sensitif = (b.sensitif || "tidak").toString().toLowerCase() === "ya";
  const revisiOf = (b.revisiOf || "").toString().trim() || undefined;
  const revisiNote = (b.revisiNote || "").toString().trim() || undefined;
  const feedback = (b.feedback || "").toString().trim() || undefined;

  const attachments = Array.isArray(b.attachments)
    ? b.attachments
        .filter((a: unknown) => a && typeof a === "object")
        .map((a) => ({
          name: String((a as { name?: string }).name || "lampiran").slice(0, 150),
          kind: String((a as { kind?: string }).kind || "url"),
          value: String((a as { value?: string }).value || "").slice(0, 2000),
        }))
        .filter((a: { value: string }) => a.value)
    : [];

  const proposal = {
    tindakan: revisiOf ? "kurasi-revisi" : "kurasi-proposa",
    type: (b.type || "note").toString(),
    title,
    body: (b.body || "").toString(),
    tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
    status: "usulan",
    sensitif: sensitif ? "ya" : "tidak",
    perkara: (b.perkara || "").toString().trim() || undefined,
    sumber: (b.sumber || "").toString().trim() || undefined,
    halaman: (b.halaman || "").toString().trim() || undefined,
    kelas_bukti: (b.kelas_bukti || "sekunder").toString(),
    attachments,
  };

  const attachLines = attachments.length
    ? attachments
        .map((a) =>
          a.kind === "file"
            ? `- FILE: ${a.name} — path relatif dari shared workspace: ${a.value} (BACA file ini sebagai sumber)`
            : `- URL: ${a.name} — ${a.value} (telusuri halaman ini bila relevan)`
        )
        .join("\n")
    : "- (tidak ada lampiran)";

  const revCtx = revisiOf
    ? `\nKONTEKS REVISI: proposa ini adalah REVISI (${revisiNote ? `catatan user: ${revisiNote}` : "tanpa catatan"}) dari request sebelumnya. ${
        feedback ? `FEEDBACK VERIFIKASI SEBELUMNYA:\n${feedback}` : ""
      }\nPerbaiki objek vault sesuai feedback (perbarui file vault yang sama bila ada, atau buat ulang), lalu jalankan verifikasi custodian LAGI. Loop revisi maksimal 3.`
    : "";

  const prompt = `Kamu adalah gsp-librarian (gatekeeper Information Library GSP). KURASI PROPOSA berikut (usulan knowledge dari HQ).

PROPOSA (JSON):
${JSON.stringify(proposal, null, 2)}

LAMPIRAN:
${attachLines}
${revCtx}

WAJIB IKUTI gsp-library-workflow (skill) + pipeline lengkap berikut secara URUT:
1. MENILAI: nilai kualitas & provenans proposa. Angka/klaim tanpa sumber+halaman = asumsi (jangan dianggap fakta). Catat kekurangan.
2. DEDUP: cek vault/ (workspace/vault) dan ~/.hermes/wiki — apakah sudah ada entri serupa/kanonik? Gunakan terminal (grep) untuk konfirmasi ganda (jangan hanya search tool).
3. MENINJAU & ANALISA: baca lampiran (file di shared workspace / URL bila dapat diakses) dan cocokkan klaim proposa dengan sumber. Bila klaim bertentangan dengan sumber → catat.
4. BUAT OBJEK VAULT (hanya bila layak & tidak duplikat): 
   python ../scripts/vault_propose.py --vault vault --perkara <folder> --title "<title>" --type <type> --sumber "<sumber>" --halaman "<halaman>" --kelas-bukti <kelas_bukti> --sensitif <ya|tidak> [--tags a,b] [--perkara <perkara>] --body-file <tulis body proposa ke file temp dulu> 
   (type valid: vendor, produk, standar, proyek, dosir, catatan, keputusan, pelajaran, fakta. Bila body panjang, tulis ke file temp lalu pakai --body-file.)
5. VERIFIKASI CUSTODIAN (WAJIB, verifikator independen — penulis bukan verifikator):
   Jalankan verifikasi penuh oleh gsp-custodian:
   hermes -p gsp-custodian -z "Verifikasi proposa vault berikut secara INDEPENDEN dan penuh tantangan (7 dimensi: provenans, anti-karangan dengan buka file sumber, dedup, metadata, grouping, kelengkapan, sensitif/dosir). Objek: vault/<perkara>/<file>.md (path dari shared workspace). Tulis verdict + alasan + rekomendasi konkret di frontmatter objek (verifikasi-oleh, verifikasi-pada, catatan_verifikasi, status: terverifikasi|perlu_revisi|ditolak). JANGAN promote. Laporkan verdict."
   Lalu BACA kembali file vault tsb — ambil status + catatan_verifikasi dari frontmatter.
6. PROMOTE HANYA jika custodian menandai 'terverifikasi':
   python scripts/vault_promote.py
   (Idempoten; gate sensitif/dosir tetap ditegakkan: sensitif → menunggu_persetujuan butuh persetujuan user; dosir → menunggu_verifikasi. JANGAN paksa promote tanpa approval/verification-by.)
   Jika custodian menandai 'perlu_revisi' atau 'ditolak': JANGAN promote.
7. LAPORKAN HANYA STRUKTUR JSON berikut (TANPA prosa di luar JSON, TANPA markdown fence, TANPA komentar):

{
  "summary": "Ringkasan penilaian & tindakan (2-4 kalimat bahasa Indonesia)",
  "verdict": "terverifikasi | perlu_revisi | ditolak | menunggu_persetujuan",
  "vaultPath": "vault/<perkara>/<YYYY-MM-DD>_<slug>.md (path relatif shared workspace; kosong bila tidak dibuat)",
  "promoted": true | false,
  "wikiPath": "path wiki bila promote, selain itu kosong",
  "custodian": { "verdict": "terverifikasi | perlu_revisi | ditolak", "catatan_verifikasi": "..." },
  "revisi": [ { "item": "bagian yang harus diperbaiki", "perbaikan": "langkah konkret" } ],
  "sources": [ { "title": "judul", "url": "/api/information-library/file?root=vault|wiki|workspace&path=<encoded>", "rank": 0 } ]
}

Aturan JSON: output DIMULAI { dan DIAKHIRI }; jangan pakai kutip ganda di dalam teks (ganti ' atau «»); sel pendek; self-check sebelum kirim.
Jika proposa tidak layak sama sekali (mis. duplikat penuh/karangan): verdict 'ditolak' dengan alasan.
AKHIRI dengan baris: STATUS: complete|needs-review|blocked`;

  const titleWithSuffix = revisiOf
    ? `Kurasi proposa: ${title} (revisi)`.slice(0, 200)
    : `Kurasi proposa: ${title}`.slice(0, 200);

  const row = await prisma.agentRequest.create({
    data: {
      origin: "web",
      kind: "oneshot",
      title: titleWithSuffix,
      prompt,
      profile: "gsp-librarian",
      sideEffecting: sensitif,
      status: sensitif ? "awaiting_approval" : "queued",
    },
  });
  return NextResponse.json({ request: row, proposal });
}
