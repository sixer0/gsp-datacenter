# -*- coding: utf-8 -*-
"""S94 spec `studio.diagram/v1` (Garis A) direkonstruksi dari gambar Manual 000.

Simpul, penghubung, lajur/tingkat, zona, dan legenda dibaca dari PNG media docx.
Jenis penghubung mengikuti katalog Garis A (datum_diagram.py:152-165):
data = garis penuh tinta 900, control = putus-putus, sync = titik-titik, alert = merah putus panjang,
accent = garis signal tebal (maks 1 per gambar).
"""

CLS = "TERBATAS"


def node(i, label, sub=None, shape="box", **cls):
    n = {"id": i, "label": label, "shape": shape, "class": cls}
    if sub:
        n["sub"] = sub
    return n


def edge(a, b, kind, label=""):
    return {"from": a, "to": b, "kind": kind, "label": label}


def g21(title, source):
    """Gambar 2.1: tiga pita tingkat berlabel (ISI DAN KEPUTUSAN, BENTUK DAN SUARA, HIDUP BERKAS)."""
    L0, L1, L2 = "ISI DAN KEPUTUSAN", "BENTUK DAN SUARA", "HIDUP BERKAS"
    return {
        "$schema": "studio.diagram/v1", "family": "layered", "id": "2.1", "title": title, "classification": CLS,
        "width_mm": 166, "apparatus": "page", "labels_verified": True, "sources": [source],
        "nodes": [
            node("spesialis", "Spesialis domain", "angka dan sumber", tier=0, lane=L0, col=0),
            node("prisma", "PRISMA", "keputusan visual", tier=0, lane=L0, col=1),
            node("veritas", "veritas", "sertifikasi angka", tier=0, lane=L0, col=2),
            node("datum", "DATUM", "bentuk dan kepatuhan", tier=1, lane=L1, col=0, accent=True),
            node("gba", "Gaya Bahasa Ahli", "kalimat dan suara", tier=1, lane=L1, col=1),
            node("arsip", "ARSIP", "nomor dan versi", tier=2, lane=L2, col=0),
            node("lokus", "LOKUS", "folder proyek", tier=2, lane=L2, col=1),
            node("kronik", "KRONIK", "rekam jejak SHA-256", tier=2, lane=L2, col=2),
        ],
        "edges": [
            edge("spesialis", "datum", "data", "isi bersumber"),
            edge("prisma", "datum", "control", "spec gambar"),
            edge("veritas", "datum", "control", "angka tersertifikasi"),
            edge("gba", "datum", "control", "naskah lulus L6"),
            edge("datum", "arsip", "accent", "berkas terbit"),
            edge("arsip", "lokus", "data", "nama dan nomor"),
            edge("lokus", "kronik", "sync", "indeks"),
        ],
        "legend": ["garis penuh isi", "putus-putus keputusan", "titik-titik rekam", "amber jalur terbit"],
        "notes": ["Label pita tingkat dicetak di parit kiri (class.lane); bingkai DATUM beraksen signal."],
    }


def g31(title, source):
    """Gambar 3.1: graph dua baris; baris bawah dibaca kanan ke kiri; jalur tolak merah putus-putus."""
    return {
        "$schema": "studio.diagram/v1", "family": "graph", "id": "3.1", "title": title, "classification": CLS,
        "width_mm": 166, "apparatus": "page", "labels_verified": True, "sources": [source],
        "nodes": [
            node("nomor", "Ambil nomor", "Register Induk", "stadium", col=0, row=0),
            node("tier", "Tetapkan tier", "NOTA, TERBIT, SERAH", col=1, row=0),
            node("register", "Register kuantitas", "rantai hitung", col=2, row=0),
            node("draf", "Draf faktual", "angka terikat", col=3, row=0),
            node("spec", "Spec gambar", "oleh PRISMA", col=3, row=1),
            node("bangun", "Bangun berkas", "docx, xlsx, pptx", col=2, row=1),
            # IP-02: acuan = segi enam; Garis A mencatat hexagon "ISO 5807, BPMN" sebagai dialek kedua di samping
            # stadion "ISO 5807" (DATUM-35) -> kotak universal beraksen signal (bingkai amber tetap menandai gerbang).
            node("gerbang", "Gerbang rilis", "lint dan juri", "box", col=1, row=1, accent=True),
            node("serah", "Serah", "LOKUS", "stadium", col=0, row=1),
        ],
        "edges": [
            edge("nomor", "tier", "data", "nomor"),
            edge("tier", "register", "data", "tier"),
            edge("register", "draf", "data", "nilai"),
            edge("draf", "spec", "data", "naskah"),
            edge("spec", "bangun", "data", "SVG"),
            edge("bangun", "gerbang", "data", "berkas"),
            edge("gerbang", "serah", "accent", "lulus"),
            edge("gerbang", "register", "alert", "gagal, perbaiki sumber"),
        ],
        "legend": ["stadion mulai dan selesai", "bingkai amber gerbang", "garis merah putus-putus jalur tolak"],
        "notes": ["IP-02: gerbang rilis digambar kotak beraksen (acuan: segi enam); satu dialek ISO 5807 per gambar (DATUM-35)."],
    }


def g91(title, source):
    """Gambar 9.1 (alt): topologi bertingkat; ikon generik GSP tidak ada di Garis A -> bentuk terdekat."""
    WAN, INTI, AGR, LAP = "INTERNET / WAN", "INTI", "AGREGASI", "LAPANGAN"
    return {
        "$schema": "studio.diagram/v1", "family": "topology", "id": "9.1", "title": title, "classification": CLS,
        "width_mm": 166, "apparatus": "page", "labels_verified": True, "sources": [source],
        "nodes": [
            # IP-02: empat tingkat = empat pita acuan (WAN, INTI, AGREGASI, LAPANGAN); Video wall, Jaringan instansi
            # dan Firewall satu tingkat (acuan: Firewall di bawah WAN dalam pita yang sama). Lima tingkat = 300 mm (DATUM-33).
            node("videowall", "Video wall", None, "box", tier=0, lane=WAN),
            dict(node("wan", "Jaringan instansi", None, "shadowed", tier=0, lane=WAN, external=True), external=True),
            # IP-02: doubled (UML component) + shadowed (DFD) = dua dialek (DATUM-35) -> firewall kotak universal.
            node("fw", "Firewall (HA)", None, "box", tier=0, lane=WAN),
            dict(node("nvr", "NVR", "Perekam video", "box", tier=1, lane=INTI), tag="NVR"),
            dict(node("l3", "L3", "Switch inti", "box", tier=1, lane=INTI, accent=True), tag="L3"),
            node("vms", "Server VMS", None, "box", tier=1, lane=INTI),
            node("storage", "Penyimpanan", None, "cylinder", tier=1, lane=INTI),
            node("swa", "Switch akses A (PoE)", None, "box", tier=2, lane=AGR),
            node("swb", "Switch akses B (PoE)", None, "box", tier=2, lane=AGR),
            node("cama", "Kamera B01–B12", None, "box", tier=3, lane=LAP),
            node("camb", "Kamera B13–B24", None, "box", tier=3, lane=LAP),
            node("ap", "Titik akses patroli", None, "box", tier=3, lane=LAP),
            node("radio", "Radio ke pos jauh", None, "box", tier=3, lane=LAP),
        ],
        "edges": [
            edge("wan", "fw", "control", "VPN IPsec"),
            edge("fw", "l3", "control", "10G"),
            edge("videowall", "nvr", "control", "HDMI"),
            edge("nvr", "l3", "data", "10G"),
            edge("l3", "vms", "data", "10G"),
            edge("vms", "storage", "control", "iSCSI"),
            edge("l3", "swa", "data", "10G fiber"),
            edge("l3", "swb", "data", "10G fiber"),
            edge("swa", "cama", "data", "1G"),
            edge("swa", "camb", "data", "1G"),
            edge("swb", "ap", "data", "1G"),
            edge("swb", "radio", "data", "1G"),
        ],
        "legend": ["WAN", "Firewall", "Switch inti", "Switch akses", "Server", "Penyimpanan", "Perekam", "Kamera",
                   "Titik akses", "Radio PtP"],
        "notes": ["Setiap tautan diberi label kapasitas/protokol. Ikon generik dipakai agar tidak bergantung pada ikon bermerek.",
                  "Judul dalam gambar: CONTOH 3 · TOPOLOGI JARINGAN PENGAWASAN (ILUSTRASI, LEGENDA RUMAH).",
                  "IP-02: 4 tingkat (acuan 4 pita; Video wall/Firewall sejajar Jaringan instansi); Firewall kotak (acuan ikon "
                  "dinding api) agar satu dialek simbol (DATUM-35) dan tinggi <= 247 mm (DATUM-33)."],
    }


def g92(title, source):
    """Gambar 9.2 (alt): BPMN satu pool tiga lajur -> swimlane Garis A."""
    S, O, T = "Sistem", "Operator", "Tim reaksi"
    return {
        "$schema": "studio.diagram/v1", "family": "swimlane", "id": "9.2", "title": title, "classification": CLS,
        "width_mm": 166, "apparatus": "page", "labels_verified": True, "sources": [source],
        "nodes": [
            node("mulai", "Sensor terpicu", None, "circle", lane=S),
            # IP-02: teks dua baris acuan dipecah label/sub agar lebar simpul 3 kisi (32 mm).
            node("tiket", "Buat tiket", "alarm otomatis", "box", lane=S),
            # IP-02: lajur Operator acuan memuat 4 simpul (>= 202 mm pada lembar 166 mm, DATUM-37) -> peristiwa akhir
            # alarm palsu dipindah ke lajur Sistem (penutupan tiket tercatat sistem).
            node("akhir1", "Selesai", None, "circle", lane=S),
            node("verif", "Verifikasi", "visual kamera", "box", lane=O),
            node("gerbang", "Ancaman nyata?", None, "diamond", lane=O, accent=True),
            node("tutup", "Tutup tiket", "alarm palsu", "box", lane=O),
            dict(node("kirim", "Kirim tim ke lokasi", None, "box", lane=T), tag="timer 15 mnt"),
            node("lapor", "Laporan penanganan", None, "box", lane=T),
            node("akhir2", "Selesai", None, "circle", lane=T),
        ],
        "edges": [
            # IP-02: acuan BPMN tanpa label aliran selain ya/tidak; label lain ASUMSI (DATUM-24 wajib label).
            edge("mulai", "tiket", "data", "alarm"),
            edge("tiket", "verif", "data", "tiket"),
            edge("verif", "gerbang", "data", "hasil"),
            edge("gerbang", "tutup", "data", "tidak"),
            edge("tutup", "akhir1", "data", "tutup"),
            edge("gerbang", "kirim", "data", "ya"),
            edge("kirim", "lapor", "data", "tiba"),
            edge("lapor", "akhir2", "data", "arsip"),
        ],
        "zones": [{"id": "pool", "label": "Pusat Kendali Pengamanan",
                   "members": ["mulai", "tiket", "akhir1", "verif", "gerbang", "tutup", "kirim", "lapor", "akhir2"]}],
        "notes": ["Peristiwa timer batas pada Kirim tim: batas waktu 15 mnt: eskalasi.",
                  "Label simpul akhir 'Selesai' ASUMSI (peristiwa akhir BPMN tanpa label).",
                  "Judul dalam gambar: CONTOH 4 · BPMN — PENANGANAN ALARM PERIMETER (ILUSTRASI).",
                  "IP-02: label aliran alarm/tiket/hasil/tutup/tiba/arsip ASUMSI (DATUM-24); akhir alarm palsu di lajur Sistem "
                  "(acuan: lajur Operator) karena lajur 166 mm memuat maks 3 simpul (DATUM-37)."],
    }


def g93(title, source):
    """Gambar 9.3 (alt): elevasi rak 24U; class.row = urutan atas ke bawah.

    IP-42c (D-137 opsi D, D-154): setiap slot digambar 1U (u = 1) agar tinggi mendekati BM; rentang U acuan
    tetap di tag. Slot "kosong U21" dipertahankan (setia pada acuan).
    """
    items = [("u24", "Patch panel serat", "U24"), ("u23", "Switch inti", "U23"), ("u22", "Firewall", "U22"),
             ("u21", "kosong", "U21"), ("u19", "Server VMS", "U19-U20"), ("u17", "Server analitik", "U17-U18"),
             ("u13", "Penyimpanan 4U", "U13-U16"), ("u12", "Pengatur kabel", "U12"), ("u07", "kosong", "U7-U11"),
             ("u04", "UPS 3U", "U4-U6"), ("u01", "Baterai UPS", "U1-U3")]
    nodes = []
    for row, (i, lab, tag) in enumerate(items):
        n = {"id": i, "label": lab, "shape": "box", "tag": tag, "u": 1, "class": {"row": row}}
        if lab == "kosong":
            n["class"]["secondary"] = True
        nodes.append(n)
    return {
        "$schema": "studio.diagram/v1", "family": "rack", "id": "9.3", "title": title, "classification": CLS,
        "width_mm": 128, "apparatus": "page", "labels_verified": True, "sources": [source], "nodes": nodes,
        "notes": ["Aturan: U dihitung dari bawah (U1); beban berat di bawah; sisakan U kosong untuk aliran udara; "
                  "label tiap perangkat = penandaan aset; tulis daya (W) & berat per perangkat.",
                  "Judul dalam gambar: CONTOH 5 · ELEVASI RAK 24U (EIA-310, 1U = 44,45 mm) — ILUSTRASI.",
                  "IP-42c (D-137 opsi D): lebar BM 100 mm tidak sah (spec P1-width_mm: 128 atau 166; blok DATUM-31 "
                  "FIGURE_WIDTHS_MM 128/166) -> 128 mm = lebar sah terdekat; blok widthMm ikut 128 agar figur tidak "
                  "diskalakan.",
                  "IP-42c: tinggi direstrukturisasi, setiap slot digambar 1U (u = 1; rak Garis A 1U = 2 baseline = "
                  "9,525 mm): 11 slot = 123,825 mm (BM 112,938 mm; proporsional 23U = 238,125 mm). Rentang U asli tetap "
                  "di tag (U24 ... U1-U3); tinggi kotak TIDAK sebanding jumlah U (deviasi terdokumentasi). 112,9 mm butuh "
                  "<= 10 slot = menghapus satu slot acuan, tidak dilakukan."],
    }


def g1012(title, source):
    """Gambar 10.12 (alt): SLD Garis A = satu rel bus dengan SATU baris cabang di bawahnya (IP-02, F-041).

    Lebar 128 mm = 12 kisi bus (128/12 mm): rel penuh tidak keluar lembar. Pada 166 mm rel di-snap ke 170,667 mm
    dan selalu gagal DATUM-37 (warisan acuan Python). Baris cabang 128 mm memuat maks 3 simpul (3 x 32 + 2 x 10,667),
    sehingga diagram memuat tepat tiga cabang keluar Rel MDP seperti acuan (-F1 SPD, -Q2, -Q6). Rantai masuk
    PLN/G -> -Q0 (ATS) -> -Q1 menjadi tag rel; UPS -U1 dan rel hilirnya (-Q3..-Q5) menjadi label/sub cabang -Q2
    (IP-42c, D-154: tag -Q2 dilebur agar simpul tertinggi 4 unit, tinggi 100,013 mm ~ BM 101,358 mm).
    """
    return {
        "$schema": "studio.diagram/v1", "family": "sld", "id": "10.12", "title": title, "classification": CLS,
        "width_mm": 128, "apparatus": "page", "labels_verified": True, "sources": [source],
        "nodes": [
            {"id": "mdp", "label": "Rel MDP", "tag": "masuk -Q1 (PLN/G via -Q0 ATS)", "shape": "bus", "class": {}},
            {"id": "f1", "label": "-F1 SPD", "shape": "box", "class": {"col": 0}},
            {"id": "q2", "label": "-Q2 ke UPS -U1", "sub": "rel hilir -Q3 -Q4 -Q5", "shape": "box",
             "class": {"col": 1, "accent": True}},
            {"id": "q6", "label": "-Q6", "sub": "penerangan", "shape": "box", "class": {"col": 2}},
        ],
        "edges": [
            edge("mdp", "f1", "data", "SPD"), edge("mdp", "q2", "data", "UPS"), edge("mdp", "q6", "data", "lampu"),
        ],
        "legend": ["penghantar", "rel daya"],
        "notes": ["Penandaan IEC 81346: =sistem +lokasi -komponen.",
                  "IP-42c (D-137 opsi D): lebar BM 166 mm sah menurut P1-width_mm tetapi tidak lolos build sld: rel "
                  "selebar lembar di-snap ke kisi 128/12 mm = 170,667 mm > 166 -> DATUM-37-lebar BY_CONSTRUCTION_FAILED "
                  "(diuji). Lebar sah terdekat 128 mm (12 kisi bus, F-041); blok widthMm ikut 128 agar figur tidak "
                  "diskalakan. Satu baris cabang 128 mm memuat maks 3 simpul.",
                  "IP-02: tidak digambar sebagai simpul (acuan menggambarnya): PLN =G01+P01-T1, G =G01+P01-G1, -Q0 kontak "
                  "pindah + fungsi kendali ATS, -Q1 pemutus utama (tag rel), UPS -U1 (blok fungsi) dan rel hilir -Q3 ke "
                  "Kamera, -Q4 ke Radar, -Q5 ke Radio (label/sub -Q2); jalur cadangan G (putus-putus) tidak tergambar. "
                  "Label aliran ASUMSI.",
                  "IP-42c: tinggi 109,537 -> 100,013 mm (BM 101,358 mm): tag -Q2 dilebur ke label/sub (label '-Q2 ke UPS "
                  "-U1', sub 'rel hilir -Q3 -Q4 -Q5'), simpul tertinggi kini 4 unit (label + sub), bukan 5; teks '(blok "
                  "fungsi)' tidak tertulis.",
                  "Judul dalam gambar: CONTOH 1 · DIAGRAM SATU GARIS (IEC 60617) — CATU DAYA POS PERIMETER (ILUSTRASI)."],
    }


DIAGRAMS = {"2.1": g21, "3.1": g31, "9.1": g91, "9.2": g92, "9.3": g93, "10.12": g1012}

# IP-42c (D-154): ukuran blok figur (widthMm, heightMm) yang menimpa penempatan BM.docx. widthMm = width_mm spec
# (lebar BM tidak sah atau gagal build sld); heightMm = tinggi hasil build engine untuk spec di atas, karena
# placedHeight memakai block.heightMm apa adanya (beda dari tinggi build = figur terdistorsi). Ubah spec -> ukur ulang
# tinggi build dan perbarui di sini. index.json tetap mencatat penempatan BM (raster acuan).
BLOCK_SIZE = {"9.3": (128.0, 123.825), "10.12": (128.0, 100.013)}
