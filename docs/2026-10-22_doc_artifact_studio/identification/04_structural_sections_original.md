# Permintaan asli user — dokumen terstruktur per section (2026-10-23)

> jadi konsepnya yang configureable itu di strukturalnya contoh, kita buat dokumen output gsp datum style.
>
> 1. configure kerangka struktur yang fixed dokumen,
> 2. configure index section
> 3. configure signature section
> 4. configure content section
> 5. configure reference section
> 6. etc
>
> nah user akan kirim json sesuai format jenis
> untuk di bagian content juga akan dikirim tuh berupa loop array json untuk kontennya
>
> di database ada record struktural multi table sampai per paragraf konten

Konteks sebelumnya (pesan user yang sama hari ini): "harusnya tiap bab itu parameternya sama, karena sebenarnya perulangan, namun yg membedakan isinya" (D-119).

Jawaban AskUserQuestion:
- Kerangka: Templat + boleh diubah JSON
- Tabel DB: Ternormalisasi penuh
- Waktu: Sekarang, sebelum uji akhir

## Use case tambahan dari user (2026-10-23)

> use casenya, misal saya mau generate bab 3 misi A format GSP
> saya kirim json isi bab 3 per section per paragraf. termasuk dimana posisi paragraf yang digantikan attachment gambar

## Aturan tambahan dari user (2026-10-23)

> slot wajib jika belum lengkap belum bisa full render, kirimnya tetap boleh partial, karena akan dikerjakan agent secara paralel perbab. namun dalam api perlu ada pesan yg jelas sehingga agent bisa meneruskan ke controllernya. bisa full render jika itu sifatnya editing konten. bahkan editing juga memungkinkan langsung cuma kirim identitas uniq spesifik paragrafnya
