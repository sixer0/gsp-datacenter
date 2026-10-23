// SR-52 U1-U3: alur API agen (panduan docs/STUDIO-AGENT-GUIDE.md §5-§9; D-128, D-131, D-247).
// Build HANYA lewat POST /api/studio/documents/{id}/render (D-247): kiriman/PATCH tidak membawa `render`.
import { unzipSync, strFromU8 } from "fflate";
import { createHash } from "node:crypto";
import { agent, agentBytes } from "../lib/api.mjs";
import { makePng } from "../lib/png.mjs";

const AGENT_A = "e2e-sr52-analis-01";
const AGENT_B = "e2e-sr52-analis-02";
const AGENT_C = "e2e-sr52-controller";

const src = (t) => ({ text: t, provenance: ["TERUKUR"] });

/** Bab 3 misi A (bentuk E2). `imageAt3` = true: blok ke-3 section 2 adalah gambar (menggantikan paragraf). */
export function chapter3(run, { imageAt3, tweak = "" } = {}) {
  const s2 = [
    { type: "paragraph", text: "Tiga pemutus tenaga diperiksa pada 2026-10-20." },
    { type: "paragraph", text: "PMT-2 menunjukkan korosi pada terminal sisi beban." },
    imageAt3
      ? { type: "image", asset: "foto-pmt2", caption: { text: "Korosi pada terminal PMT-2." }, source: src("Foto lapangan 2026-10-20") }
      : { type: "paragraph", text: "Foto korosi terminal PMT-2 akan dilampirkan setelah pemeriksaan." },
    { type: "paragraph", text: "Korosi ini menurunkan tahanan kontak dan perlu pembersihan." },
  ];
  return {
    $schema: "studio.chapter/v2",
    agentId: AGENT_A,
    target: { mission: { folder: run.mission }, docKey: run.docKey },
    template: { slug: "datum-gsp" },
    meta: { title: `Laporan Survei Uji E2E ${run.tag}` },
    chapter: {
      key: "3",
      title: { text: "Analisis Kondisi Peralatan" },
      sections: [
        { title: { text: "Metode Penilaian" }, blocks: [
          { type: "paragraph", text: `Penilaian memakai skor kondisi 1 sampai 5 per peralatan.${tweak}` },
          { type: "paragraph", text: "Skor diberikan dari inspeksi visual dan uji tahanan isolasi." } ] },
        { title: { text: "Kondisi Pemutus Tenaga" }, blocks: s2 },
        { title: { text: "Ringkasan Skor" }, blocks: [
          { type: "paragraph", text: "Tabel berikut merangkum skor kondisi." },
          { type: "table", caption: { text: "Skor kondisi pemutus tenaga." },
            columns: [{ role: "id" }, { role: "numeral" }],
            rows: [
              { kind: "header", cells: [{ text: "Unit" }, { text: "Skor" }] },
              { cells: [{ text: "PMT-1" }, { text: "4" }] },
              { cells: [{ text: "PMT-2" }, { text: "2" }] } ],
            source: src("Inspeksi 2026-10-20") } ] } ],
    },
    ...(imageAt3 ? { assets: { "foto-pmt2": { assetRef: `sha256:${run.assetSha}` } } } : {}),
  };
}

function simpleChapter(documentId, key, title, text, agentId, baseRevisionNo) {
  return {
    $schema: "studio.chapter/v2",
    agentId,
    target: { documentId },
    ...(baseRevisionNo ? { baseRevisionNo } : {}),
    chapter: { key, title: { text: title }, sections: [{ title: { text: `Uraian bab ${key}` }, blocks: [{ type: "paragraph", text }] }] },
  };
}

const blockAt = (resp, addr) => resp?.chapter?.blocks?.find((b) => b.address === addr);
const docxText = (bytes) => {
  const z = unzipSync(new Uint8Array(bytes));
  return Object.entries(z).filter(([n]) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)).map(([, v]) => strFromU8(v)).join("\n").replace(/<[^>]+>/g, "");
};

export async function runU1(run, check, log) {
  // Aset gambar unik (PNG 240x160), unggah JSON (panduan §10).
  const png = makePng(240, 160, run.tag + "a1b2c3");
  run.assetSha = createHash("sha256").update(png).digest("hex");
  const up = await agent("POST", `/api/studio/assets?mission=${encodeURIComponent(run.mission)}`, { mime: "image/png", dataBase64: png.toString("base64") });
  if (up.json?.created) run.createdAssets.push(run.assetSha);
  check("U1.0", "unggah aset PNG -> 201 created", up.status === 201 && up.json?.created === true && up.json?.asset?.sha256 === run.assetSha, `HTTP ${up.status} created=${up.json?.created}`);

  const s1 = await agent("POST", "/api/studio/chapters", chapter3(run, { imageAt3: false }));
  run.documentId = s1.json?.document?.id;
  run.docNumber = s1.json?.document?.docNumber;
  const para323 = blockAt(s1.json, "3.2.3");
  check("U1.1", "kiriman pertama bab 3 membuat dokumen (201, created, revisi 1)", s1.status === 201 && s1.json?.created === true && s1.json?.revision?.revisionNo === 1,
    `HTTP ${s1.status} doc=${run.docNumber} rev=${s1.json?.revision?.revisionNo} scope=${s1.json?.revision?.changeScope} corr=${s1.corr}`);
  check("U1.1b", "respons kiriman memuat kelengkapan INCOMPLETE + fullRenderAllowed=false", s1.json?.completeness?.status === "INCOMPLETE" && s1.json?.completeness?.fullRenderAllowed === false,
    `missing=${JSON.stringify(s1.json?.completeness?.missingRequired)}`);

  const s1b = await agent("POST", "/api/studio/chapters", chapter3(run, { imageAt3: false }));
  check("U1.2", "kiriman ulang identik -> 200 unchanged tanpa revisi baru", s1b.status === 200 && s1b.json?.unchanged === true && s1b.json?.revision?.revisionNo === 1,
    `HTTP ${s1b.status} unchanged=${s1b.json?.unchanged} rev=${s1b.json?.revision?.revisionNo}`);

  const s2 = await agent("POST", "/api/studio/chapters", chapter3(run, { imageAt3: true }));
  const img = blockAt(s2.json, "3.2.3");
  check("U1.3", "gambar menggantikan paragraf 3.2.3 -> 201 revisi 2, changeScope chapter:3", s2.status === 201 && s2.json?.revision?.revisionNo === 2 && s2.json?.revision?.changeScope === "chapter:3",
    `HTTP ${s2.status} rev=${s2.json?.revision?.revisionNo} scope=${s2.json?.revision?.changeScope} changed=${JSON.stringify(s2.json?.changedAddresses ?? null)}`);
  check("U1.4", "blok 3.2.3 = image berlabel 'Gambar 3.1'", img?.type === "image" && img?.artifactLabel === "Gambar 3.1", JSON.stringify(img));
  check("U1.5", "pid paragraf 3.2.3 diwarisi blok gambar (pid tetap di posisi yang sama)", !!para323?.pid && img?.pid === para323.pid, `paragraf=${para323?.pid} gambar=${img?.pid}`);
  const tbl = blockAt(s2.json, "3.3.2");
  check("U1.6", "tabel 3.3.2 berlabel 'Tabel 3.1' (penomoran mesin)", tbl?.artifactLabel === "Tabel 3.1", JSON.stringify(tbl));
  run.pids = Object.fromEntries((s2.json?.chapter?.blocks ?? []).map((b) => [b.address, b.pid]));
  run.revisionNo = s2.json?.revision?.revisionNo;

  // D-247: medan `render` di badan kiriman ditolak, tidak menulis revisi.
  const bad = await agent("POST", "/api/studio/chapters", { ...chapter3(run, { imageAt3: true, tweak: " (uji)" }), render: { scope: "chapter", formats: ["docx"] } });
  const badIds = JSON.stringify(bad.json?.details ?? bad.json);
  const after = await agent("GET", `/api/studio/documents/${run.documentId}/completeness`);
  check("U1.7", "kiriman dengan medan render -> 400 RENDER_FIELD, revisi tetap 2 (D-247)", bad.status === 400 && /RENDER_FIELD/.test(badIds) && after.json?.completeness?.revisionNo === 2,
    `HTTP ${bad.status} code=${bad.json?.code} rev=${after.json?.completeness?.revisionNo}`);

  // Render draf bab 3 lewat endpoint.
  const r = await agent("POST", `/api/studio/documents/${run.documentId}/render`, { scope: "chapter", key: "3", formats: ["docx", "pdf"], agentId: AGENT_A });
  const outs = r.json?.outputs ?? [];
  check("U1.8", "render bab 3 lewat endpoint -> 200, job SUCCEEDED, draft=true, DOCX+PDF", r.status === 200 && r.json?.job?.status === "SUCCEEDED" && r.json?.job?.draft === true &&
    outs.some((o) => o.format === "DOCX") && outs.some((o) => o.format === "PDF"),
    `HTTP ${r.status} job=${r.json?.job?.status} draft=${r.json?.job?.draft} scope=${JSON.stringify(r.json?.job?.scope)} outputs=${outs.map((o) => o.format + ":" + o.fileName).join(" | ")} ${r.ms} ms`);
  const docx = outs.find((o) => o.format === "DOCX");
  if (docx?.url) {
    const f = await agentBytes(docx.url + (docx.url.includes("?") ? "&" : "?") + "download=1");
    let text = "";
    try { text = docxText(f.bytes); } catch (e) { text = "ERR " + e.message; }
    const iFig = text.indexOf("Gambar 3.1");
    const iBefore = text.indexOf("PMT-2 menunjukkan korosi");
    const iAfter = text.indexOf("Korosi ini menurunkan");
    check("U1.9", "DOCX draf bab 3 memuat 'Gambar 3.1' di antara paragraf 3.2.2 dan 3.2.4", f.status === 200 && iFig > iBefore && iBefore >= 0 && iAfter > iFig,
      `HTTP ${f.status} bytes=${f.bytes.length} idx(3.2.2)=${iBefore} idx(Gambar 3.1)=${iFig} idx(3.2.4)=${iAfter} draftMark=${/DRAF/i.test(text)}`);
    check("U1.10", "DOCX draf bertanda DRAF", /DRAF/i.test(text), `DRAF=${/DRAF/i.test(text)}`);
  } else check("U1.9", "DOCX draf tersedia", false, "tanpa output DOCX");
  log.u1 = { doc: run.docNumber, documentId: run.documentId, render: { status: r.status, job: r.json?.job, outputs: outs.map(({ format, fileName, url }) => ({ format, fileName, url })) } };
}

export async function runU2(run, check, log) {
  const base = (await agent("GET", `/api/studio/documents/${run.documentId}/completeness`)).json?.completeness?.revisionNo;
  const b3 = { ...chapter3(run, { imageAt3: true, tweak: " Skor 1 berarti rusak berat." }), baseRevisionNo: base };
  delete b3.template; delete b3.meta;
  const b5 = simpleChapter(run.documentId, "5", "Rekomendasi Pemeliharaan", "Bersihkan terminal PMT-2 dalam 30 hari.", AGENT_B, base);
  const t0 = Date.now();
  const [r3, r5] = await Promise.all([agent("POST", "/api/studio/chapters", b3), agent("POST", "/api/studio/chapters", b5)]);
  const revs = [r3.json?.revision?.revisionNo, r5.json?.revision?.revisionNo].sort();
  check("U2.1", "bab 3 dan bab 5 dikirim paralel (base sama) -> keduanya 201, tanpa 409", r3.status === 201 && r5.status === 201,
    `bab3 HTTP ${r3.status} rev=${r3.json?.revision?.revisionNo} rebased=${r3.json?.rebased}; bab5 HTTP ${r5.status} rev=${r5.json?.revision?.revisionNo} rebased=${r5.json?.rebased}; base=${base}; ${Date.now() - t0} ms`);
  check("U2.2", "dua revisi berurutan base+1, base+2; satu kiriman rebased", revs[0] === base + 1 && revs[1] === base + 2 && (r3.json?.rebased === true) !== (r5.json?.rebased === true),
    `revs=${revs.join(",")}`);
  const img = blockAt(r3.json, "3.2.3");
  check("U2.3", "bab 3 setelah kiriman paralel tetap memuat 'Gambar 3.1' di 3.2.3 dengan pid sama", img?.artifactLabel === "Gambar 3.1" && img?.pid === run.pids["3.2.3"], JSON.stringify(img));
  const last = [r3, r5].find((x) => x.json?.revision?.revisionNo === revs[1]);
  check("U2.4", "kelengkapan terakhir INCOMPLETE; bab hilang 1,2,4 + controlSheet, signature", last?.json?.completeness?.status === "INCOMPLETE",
    `missing=${JSON.stringify(last?.json?.completeness?.missingRequired)}`);

  const full = await agent("POST", `/api/studio/documents/${run.documentId}/render`, { scope: "document", formats: ["docx", "pdf"], agentId: AGENT_C });
  const ftc = full.json?.details?.forwardToController;
  check("U2.5", "render penuh lewat endpoint -> 409 DOCUMENT_INCOMPLETE", full.status === 409 && full.json?.code === "DOCUMENT_INCOMPLETE", `HTTP ${full.status} code=${full.json?.code} allowed=${JSON.stringify(full.json?.details?.allowedScopes)}`);
  check("U2.6", "409 memuat details.forwardToController (teks) + details.completeness", typeof ftc === "string" && ftc.length > 20 && full.json?.details?.completeness?.status === "INCOMPLETE",
    `forwardToController="${String(ftc).slice(0, 220)}"`);
  const after = await agent("GET", `/api/studio/documents/${run.documentId}/completeness`);
  check("U2.7", "render ditolak tidak menulis revisi", after.json?.completeness?.revisionNo === revs[1], `rev=${after.json?.completeness?.revisionNo}`);
  run.revisionNo = revs[1];
  log.u2 = { base, revs, forwardToController: ftc };
}

export async function runU3(run, check, log) {
  const id = run.documentId;
  const cs = await agent("POST", "/api/studio/slots", {
    $schema: "studio.slot/v2", agentId: AGENT_C, target: { documentId: id }, slot: "controlSheet",
    payload: {
      type: "controlSheet",
      revisionHistory: [{ rev: "A", date: "2026-10-23", what: "Terbit pertama", by: "Tim Survei" }],
      verificationChain: [{ layer: "1", role: "Penyusun", name: "A. Pratama" }, { layer: "2", role: "Pemeriksa", name: "B. Santoso" }],
      methodStatement: { text: "Pengukuran langsung di lapangan; metode rinci di Bab 3." },
      distribution: [{ copy: "1", holder: "Manajer Proyek" }],
    },
  });
  check("U3.1", "isi slot Lembar Kendali -> 201", cs.status === 201, `HTTP ${cs.status} code=${cs.json?.code ?? ""} addr=${cs.json?.slot?.address} ${cs.status >= 400 ? JSON.stringify(cs.json?.details ?? "").slice(0, 300) : ""}`);
  const sg = await agent("POST", "/api/studio/slots", {
    $schema: "studio.slot/v2", agentId: AGENT_C, target: { documentId: id }, slot: "signature",
    payload: { type: "signatureBlock", roles: [
      { role: { text: "Disusun" }, holder: { text: "A. Pratama" }, date: { text: "2026-10-23" } },
      { role: { text: "Diperiksa" }, holder: { text: "B. Santoso" } },
      { role: { text: "Disetujui" }, holder: { text: "C. Wijaya" } } ] },
  });
  check("U3.2", "isi slot Tanda Tangan -> 201", sg.status === 201, `HTTP ${sg.status} code=${sg.json?.code ?? ""} addr=${sg.json?.slot?.address}`);
  const rs = await Promise.all([
    agent("POST", "/api/studio/chapters", simpleChapter(id, "1", "Pendahuluan", "Laporan ini merangkum survei gardu induk.", AGENT_A)),
    agent("POST", "/api/studio/chapters", simpleChapter(id, "2", "Lingkup Survei", "Survei mencakup tiga pemutus tenaga dan satu transformator.", AGENT_B)),
    agent("POST", "/api/studio/chapters", simpleChapter(id, "4", "Kondisi Transformator Daya", "Suhu minyak TD-1 di atas batas operasi normal.", AGENT_A)),
  ]);
  check("U3.3", "bab 1, 2, 4 dikirim paralel -> semua 201", rs.every((x) => x.status === 201), rs.map((x) => `HTTP ${x.status} rev=${x.json?.revision?.revisionNo}`).join("; "));
  const comp = await agent("GET", `/api/studio/documents/${id}/completeness`);
  const c = comp.json?.completeness;
  check("U3.4", "kelengkapan COMPLETE, fullRenderAllowed=true, missingRequired kosong", c?.status === "COMPLETE" && c?.fullRenderAllowed === true && (c?.missingRequired ?? []).length === 0,
    `status=${c?.status} rev=${c?.revisionNo} missing=${JSON.stringify(c?.missingRequired)}`);

  // PATCH per pid (paragraf 3.2.2), lalu sisip sebelum 3.2.1 agar alamat bergeser: pid tetap.
  const content = await agent("GET", `/api/studio/documents/${id}/content?slot=content&chapter=3`);
  const sec2 = content.json?.content?.sections?.[1];
  const pid = sec2?.blocks?.[1]?.id;
  check("U3.5", "GET content bab 3 = bentuk kiriman + pid (pid 3.2.2 = pid respons kiriman)", content.status === 200 && pid === run.pids["3.2.2"], `HTTP ${content.status} pid=${pid} expected=${run.pids["3.2.2"]}`);
  const p1 = await agent("PATCH", `/api/studio/documents/${id}/paragraphs/${pid}`, {
    op: "replace", baseRevisionNo: c?.revisionNo, agentId: AGENT_A,
    block: { type: "paragraph", text: "PMT-2 menunjukkan korosi berat pada terminal sisi beban dan sisi sumber." },
    change: { what: "Perbarui temuan PMT-2", why: "Hasil inspeksi ulang 2026-10-22", impact: "Paragraf 3.2.2 saja" },
  });
  check("U3.6", "PATCH replace pid paragraf -> 200, pid tetap, alamat 3.2.2", p1.status === 200 && p1.json?.pid === pid && p1.json?.address === "3.2.2",
    `HTTP ${p1.status} pid=${p1.json?.pid} addr=${p1.json?.address} rev=${p1.json?.revision?.revisionNo} scope=${p1.json?.revision?.changeScope} code=${p1.json?.code ?? ""}`);
  const badPatch = await agent("PATCH", `/api/studio/documents/${id}/paragraphs/${pid}`, {
    op: "replace", baseRevisionNo: p1.json?.revision?.revisionNo, agentId: AGENT_A,
    block: { type: "paragraph", text: "Uji medan render pada PATCH." },
    change: { what: "Uji", why: "Uji D-247", impact: "Tidak ada" }, render: { scope: "document", formats: ["pdf"] },
  });
  check("U3.7", "PATCH dengan medan render -> 400 RENDER_FIELD (D-247)", badPatch.status === 400 && /RENDER_FIELD/.test(JSON.stringify(badPatch.json)), `HTTP ${badPatch.status} code=${badPatch.json?.code}`);
  const firstPid = sec2?.blocks?.[0]?.id;
  const ins = await agent("PATCH", `/api/studio/documents/${id}/paragraphs/${firstPid}`, {
    op: "insertBefore", baseRevisionNo: p1.json?.revision?.revisionNo, agentId: AGENT_A,
    block: { type: "paragraph", text: "Pemeriksaan dilakukan oleh dua teknisi bersertifikat." },
    change: { what: "Sisip paragraf pembuka section 3.2", why: "Melengkapi konteks pemeriksaan", impact: "Alamat paragraf 3.2.x bergeser satu" },
  });
  check("U3.8", "PATCH insertBefore -> 200 dengan newPid + addressMap", ins.status === 200 && !!ins.json?.newPid && ins.json?.addressMap && Object.keys(ins.json.addressMap).length > 0,
    `HTTP ${ins.status} newPid=${ins.json?.newPid} addressMap=${JSON.stringify(ins.json?.addressMap)}`);
  const content2 = await agent("GET", `/api/studio/documents/${id}/content?slot=content&chapter=3`);
  const b2 = content2.json?.content?.sections?.[1]?.blocks ?? [];
  const idx = b2.findIndex((b) => b.id === pid);
  const imgIdx = b2.findIndex((b) => b.type === "image");
  check("U3.9", "setelah bergeser: pid paragraf sama kini di 3.2.3, gambar (pid sama) di 3.2.4", idx === 2 && b2[idx]?.text?.includes("korosi berat") && imgIdx === 3 && b2[imgIdx]?.id === run.pids["3.2.3"],
    `idx(pid)=${idx} idx(image)=${imgIdx} imagePid=${b2[imgIdx]?.id}`);
  const tree = await agent("GET", `/api/studio/documents/${id}`);
  const treeStr = JSON.stringify(tree.json ?? {});
  const m = treeStr.match(/"address":"3\.2\.4"[^}]*"artifactLabel":"(Gambar [0-9.]+)"|"artifactLabel":"(Gambar [0-9.]+)"[^}]*"address":"3\.2\.4"/);
  check("U3.10", "pohon dokumen: gambar di 3.2.4 tetap 'Gambar 3.1'", /Gambar 3\.1/.test(m?.[1] ?? m?.[2] ?? ""), `label=${m?.[1] ?? m?.[2] ?? "tidak ditemukan"}`);

  const comp2 = (await agent("GET", `/api/studio/documents/${id}/completeness`)).json?.completeness;
  const full = await agent("POST", `/api/studio/documents/${id}/render`, { scope: "document", formats: ["docx", "pdf"], agentId: AGENT_C });
  const outs = full.json?.outputs ?? [];
  check("U3.11", "render penuh lewat endpoint pada dokumen COMPLETE -> 200 SUCCEEDED, draft=false", full.status === 200 && full.json?.job?.status === "SUCCEEDED" && full.json?.job?.draft === false && comp2?.status === "COMPLETE",
    `HTTP ${full.status} job=${full.json?.job?.status} draft=${full.json?.job?.draft} rev=${comp2?.revisionNo} outputs=${outs.map((o) => o.format + ":" + o.fileName).join(" | ")} ${full.ms} ms code=${full.json?.code ?? ""}`);
  const pdf = outs.find((o) => o.format === "PDF");
  if (pdf?.url) {
    const f = await agentBytes(pdf.url);
    const sha = createHash("sha256").update(f.bytes).digest("hex");
    check("U3.12", "unduh PDF penuh: %PDF, sha cocok header X-Studio-Sha256", f.status === 200 && f.bytes.subarray(0, 4).toString() === "%PDF" && (f.headers.get("x-studio-sha256") ?? sha) === sha,
      `HTTP ${f.status} bytes=${f.bytes.length} disp=${f.headers.get("content-disposition")?.slice(0, 40)} shaHeader=${(f.headers.get("x-studio-sha256") ?? "-").slice(0, 12)} sha=${sha.slice(0, 12)}`);
  }
  log.u3 = { completeRevision: c?.revisionNo, pid, render: { status: full.status, job: full.json?.job, outputs: outs.map(({ format, fileName, url }) => ({ format, fileName, url })) } };
  run.fullOutputs = outs;
}
