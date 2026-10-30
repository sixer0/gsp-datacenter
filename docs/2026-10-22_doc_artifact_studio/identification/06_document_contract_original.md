# Intake 06: Document contract dalam format JSON yang sama dengan document output

Tanggal: 2026-10-30. Sumber: pesan USER berurutan di sesi ini, dikutip apa adanya.

## Permintaan asli USER (kutipan)

1. "next, koordinasikan dengan hermes, untuk menguji pipeline document generator ini. minta feedback dari hermes ketika dia menggunakan dengan workflow kerjanya untuk menyempurnakan sistem ini. karena usernya adalah hermes, maka pipeline ini harus menjadi solusi efisiensi untuk workflow kerja hermes"
2. "perbaiki semuanya, kemudian tanya lagi tentang penerapan document contract, menurut saya itu juga bisa di implementasikan dengan sistem kita. usulannya instead of md, jadikan format html sehingga juga layak dibaca oleh manusia (klien yg dilayani hermes)"
3. "untuk document kontrak saat ini hermes akan membuat md files yang formatnya bisa berbeda2. idenya dengan konversi ke html, maka seluruh document contract akan dikerjakan agent dalam format json. idenya adalah diseragamkan saja format json antara document contract dan document output. jadi hermes tidak perlu effort untuk thinking lagi, dan aturannya jadi makin jelas dan mudah diikuti oleh hermes. maka dengan ini efisiensi akan lebih nyata lagi kan ? selain itu doc contract raw json juga akan teregister ke database dan bisa dibuat query retrievalnya"
4. "ya ketika document contract sudah ada dalam system maka tidak perlu lagi ada rawnya di disk, cukup final version yang merupakan hasil generate. di nama filenya di beri identitas waktu agar dapat di cek terhadap real truth. ok draft dan checkpoint boleh pakai md karena dalam tugas panjang terkadang perlu ada draft / checkpoint"
5. "tapi idealnya meskipun dalam md, draft dan checkpoint isinya dalam format json"
6. "ok good, paralel blueprintnya"

## Konteks keputusan terkait

- D-320 s.d. D-343: uji coba Hermes, batch perbaikan H1-H8, dan uji ulang.
- D-341: masukan konsultasi Hermes soal document contract. Jenis yang dipindah lebih dulu adalah kontrak misi, PHASE-REPORTS/LAPOR-FASE, blueprint gelombang, dan artefak klien. Hermes mensyaratkan JSON sebagai sumber kebenaran, HTML sebagai proyeksi bergaya DATUM, enum status tertutup, alamat documentId+pid, diff lewat ledger revisi, `cardIds`, dan nol edit manual HTML.
- D-344: format JSON kontrak diseragamkan dengan document output, diregister di DB, dan dapat di-query.
- D-345: tanpa versi mentah di disk; hanya berkas final hasil generate dengan nama beridentitas waktu. Studio tetap tidak menulis ke workspace bersama (D-322 H3).
- D-346: draf/checkpoint boleh berupa berkas MD, tetapi isinya JSON dengan format yang sama.
- D-322 H3: Studio tidak menulis ke workspace bersama; berkas diunduh lewat API.
