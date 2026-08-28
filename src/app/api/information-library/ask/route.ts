import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/information-library/ask { question } → dispatch gsp-librarian untuk
// menjawab pertanyaan user dengan data Information Library, respons STRICT JSON
// (multi-table). UI mem-poll GET /api/brahma/requests/<id> lalu merender tabel.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const question = (b.question || "").toString().trim();
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });
  if (question.length > 500) return NextResponse.json({ error: "question too long (max 500)" }, { status: 400 });

  const prompt = `Kamu adalah gsp-librarian. PERTANYAAN PENGGUNA (information request): "${question}"

Tugas: cari informasi PALING RELEVAN di Information Library GSP, lalu jawab sebagai DATA TABLE JSON.

LANGKAH:
1. Cari di Information Library via curl (server lokal, gunakan -sk karena self-signed):
   https://localhost:9011/api/information-library?q=<kata-kunci>&scope=all&status=all
   Ganti <kata-kunci> dengan istilah penting dari pertanyaan; coba 2-3 variasi kueri.
2. Cek juga scope=vault (analisa) dan scope=wiki (pengetahuan terkurasi) bila perlu.
3. Kumpulkan entri relevan (maks 20). Untuk tiap entri catat: title, domain, project,
   type, rank, status, dan URL file: /api/information-library/file?root=wiki|workspace|vault&path=<encoded path>.
4. Skoring = rank (wiki=0 > vault=1 > insight/docs=2 > memory=3 > arsip=4) × relevansi kueri.
   Buang entri yang tidak relevan.
5. Susun jawaban HANYA STRUKTUR JSON berikut (TANPA prosa, TANPA markdown fence, TANPA komentar):

{
  "answer": "Ringkasan jawaban untuk pengguna (2-4 kalimat, bahasa Indonesia, sertakan angka penting bila ada)",
  "tables": [
    {"title": "Nama tabel", "columns": ["Kolom1", "Kolom2"], "rows": [["nilai1", "nilai2"], ["nilai3", "nilai4"]]}
  ],
  "sources": [
    {"title": "Judul entri", "url": "/api/information-library/file?root=workspace&path=...", "rank": 0, "relevance": "tinggi"}
  ]
}

Aturan:
- tables boleh 1..N (multi-table) sesuai struktur informasi yang kamu temukan.
- columns/rows WAJIB konsisten (jumlah kolom sama).
- sources WAJIB berisi url yang valid dari hasil pencarian (bukan karangan).
- PERTANYAAN DAFTAR (daftar vendor, daftar dokumen, daftar proyek, daftar rekomendasi, dsb.)
  WAJIB dijawab sebagai TABEL (field 'tables'), BUKAN prosa: satu baris per entri, kolom informatif
  (No, Nama, Kategori/Rank, Alasan/Rekomendasi, Sumber, dst). Jangan pernah menaruh daftar
  berurutan hanya di dalam field 'answer'.
- Jaga JSON LENGKAP dan VALID: output DIMULAI dengan { dan DIAKHIRI dengan } — jangan terpotong,
  jangan ada teks setelah }, jumlah kolom konsisten di semua baris.
- TAMPILKAN SEMUA entri relevan sesuai permintaan pengguna (daftar LENGKAP, jangan batasi
  jumlah baris). Boleh 1..N tabel untuk mengelompokkan informasi. Satu baris per entri.
- Disiplin JSON untuk output panjang: tiap sel WAJIB pendek namun informatif (maks ~120 karakter),
  JANGAN gunakan tanda kutip ganda (") di dalam teks sel — ganti dengan tanda kutip tunggal (')
  atau kurung («»). Ini penting agar JSON tetap valid meski daftar panjang.
- SELF-CHECK sebelum mengirim: baca ulang JSON-mu — semua string tertutup dengan benar,
  tidak ada koma ganda (,,), tidak ada kutip ganda di tengah teks, jumlah kurung { } dan [ ] seimbang.
- Jangan menambahkan teks di luar JSON. Output dimulai dengan { dan diakhiri }.
- Jika tidak ada informasi relevan, jawab {"answer": "Tidak ditemukan informasi relevan...", "tables": [], "sources": []}.`;

  const title = `Ask Librarian — ${question.slice(0, 120)}`;
  const row = await prisma.agentRequest.create({
    data: {
      origin: "web",
      kind: "oneshot",
      title: title.slice(0, 200),
      prompt,
      profile: "gsp-librarian",
      sideEffecting: false,
      status: "queued",
    },
  });
  return NextResponse.json({ request: row });
}
