// SR-52: alur UI Studio (A, N, T, K, E, G, P, Y + kriteria UX A1-A16 yang relevan).
// Hanya membaca dokumen 000/001/002; menulis hanya ke fixture berprefiks e2e-sr52-.
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { withDb } from "../lib/db.mjs";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
export const DATUM_GSP = "cmvjwg7mp0000v12csv4n257p";
export const DOC_001 = "cmvjwkilc0001v1cgo9fzklem";
export const DOC_000 = "cmvjwkth00027v1cgd8wn9y7h";

let shotNo = 0;
export async function shot(ctx, page, name, { fullPage = true } = {}) {
  shotNo += 1;
  const file = `${String(shotNo).padStart(2, "0")}_${name}.png`;
  await page.screenshot({ path: resolve(ctx.outDir, file), fullPage, caret: "initial" }).catch((e) => ctx.log.push(`shot ${name} gagal: ${e.message}`));
  ctx.shots.push(file);
  return file;
}

async function settle(page, ms = 800) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

/** fetch di dalam halaman (cookie sesi Secure hanya dikirim peramban, bukan APIRequestContext di http). */
export async function pageFetch(page, url, method = "GET") {
  return page.evaluate(async ({ url, method }) => {
    const r = await fetch(url, { method, credentials: "same-origin" });
    let json = null;
    const ct = r.headers.get("content-type") ?? "";
    if (ct.includes("json")) json = await r.json().catch(() => null);
    else await r.arrayBuffer().catch(() => null);
    return { status: r.status, json, disposition: r.headers.get("content-disposition"), ct };
  }, { url, method });
}

const subnavTexts = (page) => page.locator('nav[aria-label="Navigasi Studio"] a').allInnerTexts().then((a) => a.map((t) => t.trim()));

// ── A: masuk + ?next= kembali ke Studio ─────────────────────────────────────
export async function flowA(ctx, { userPage, adminPage, run }) {
  const { check } = ctx;
  ctx.sink.phase = "A";
  // USER: tautan dalam -> /login?next=... -> masuk -> kembali ke halaman tujuan.
  const target = "/studio/documents?status=belum";
  await userPage.goto(target);
  await userPage.waitForURL(/\/login\?/);
  const loginUrl = new URL(userPage.url());
  check("A.1", "halaman Studio tanpa sesi dialihkan ke /login?next=<tujuan>", loginUrl.pathname === "/login" && loginUrl.searchParams.get("next") === target, userPage.url());
  await shot(ctx, userPage, "A_login_next");
  await userPage.locator("input:not([type=password])").first().fill(run.user.username);
  await userPage.locator("input[type=password]").fill(run.user.password);
  await userPage.locator("button[type=submit]").click();
  await userPage.waitForURL((u) => u.pathname === "/studio/documents", { timeout: 20000 }).catch(() => {});
  const after = new URL(userPage.url());
  check("A.2", "USER masuk -> kembali ke /studio/documents?status=belum (safeNext)", after.pathname + after.search === target, userPage.url());
  await settle(userPage);
  await shot(ctx, userPage, "A_user_after_login");
  const me = (await pageFetch(userPage, "/api/auth/me")).json;
  check("A.3", "sesi USER sah (/api/auth/me role USER)", me?.user?.role === "USER" && me?.user?.username === run.user.username, `role=${me?.user?.role}`);

  // ADMIN: next= berbahaya ditolak -> mendarat di origin sama ("/"), lalu buka Studio.
  await adminPage.goto("/login?next=" + encodeURIComponent("//evil.example/studio"));
  await adminPage.locator("input:not([type=password])").first().fill(run.admin.username);
  await adminPage.locator("input[type=password]").fill(run.admin.password);
  await adminPage.locator("button[type=submit]").click();
  await adminPage.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 }).catch(() => {});
  const a = new URL(adminPage.url());
  check("A.4", "ADMIN masuk dengan next=//evil.example -> tetap origin sama, ke /", a.origin === ctx.base && a.pathname === "/", adminPage.url());
  await adminPage.goto("/studio");
  await settle(adminPage);
  await shot(ctx, adminPage, "A_admin_studio_home");
  const me2 = (await pageFetch(adminPage, "/api/auth/me")).json;
  check("A.5", "sesi ADMIN sah (/api/auth/me role ADMINISTRATOR)", me2?.user?.role === "ADMINISTRATOR", `role=${me2?.user?.role}`);
}

// ── N: navigasi (A1), judul seragam, palet perintah ────────────────────────
export async function flowN(ctx, { userPage, adminPage }) {
  const { check } = ctx;
  ctx.sink.phase = "N";
  await userPage.goto("/studio");
  await settle(userPage);
  const u = await subnavTexts(userPage);
  check("N.1", "A1 subnav USER = Beranda, Dokumen, Templat, Galeri artefak (tanpa Alat developer/Sistem)", JSON.stringify(u) === JSON.stringify(["Beranda", "Dokumen", "Templat", "Galeri artefak"]), JSON.stringify(u));
  await shot(ctx, userPage, "N_user_home");
  await adminPage.goto("/studio");
  await settle(adminPage);
  const a = await subnavTexts(adminPage);
  check("N.2", "A1 subnav ADMIN = urutan USER + Alat developer, Sistem", JSON.stringify(a) === JSON.stringify(["Beranda", "Dokumen", "Templat", "Galeri artefak", "Alat developer", "Sistem"]), JSON.stringify(a));
  const sideU = await userPage.locator("aside nav a[href^='/studio']").allInnerTexts().then((x) => x.map((t) => t.trim()));
  const sideA = await adminPage.locator("aside nav a[href^='/studio']").allInnerTexts().then((x) => x.map((t) => t.trim()));
  check("N.3", "sidebar grup Studio: USER 4 entri, ADMIN 6 entri, urutan sama dengan subnav", JSON.stringify(sideU) === JSON.stringify(u) && JSON.stringify(sideA) === JSON.stringify(a), `USER=${JSON.stringify(sideU)} ADMIN=${JSON.stringify(sideA)}`);
  // Judul metadata seragam "<Halaman> · Studio · GSP Swarm HQ".
  const titles = {};
  for (const p of ["/studio", "/studio/documents", "/studio/templates", "/studio/artifacts", "/studio/system"]) {
    await userPage.goto(p);
    await userPage.waitForLoadState("domcontentloaded");
    await userPage.waitForTimeout(400);
    titles[p] = await userPage.title();
  }
  const okTitles = Object.values(titles).every((t) => / · Studio · GSP Swarm HQ$/.test(t));
  check("N.4", "judul halaman seragam '<Halaman> · Studio · GSP Swarm HQ'", okTitles, JSON.stringify(titles));
  // Palet perintah (Ctrl+K) entri Studio per peran.
  const palette = async (page) => {
    await page.goto("/studio");
    await settle(page, 300);
    await page.keyboard.press("Control+k");
    const dlg = page.locator('[role="dialog"]').filter({ has: page.locator('input[placeholder^="Search"]') });
    await dlg.waitFor({ timeout: 5000 }).catch(() => {});
    await page.keyboard.type("Studio");
    await page.waitForTimeout(400);
    const items = (await dlg.innerText().catch(() => "")).split("\n").map((s) => s.trim()).filter((s) => s.startsWith("Studio:"));
    return { dlg, items };
  };
  const pu = await palette(userPage);
  await shot(ctx, userPage, "N_user_palette", { fullPage: false });
  await userPage.keyboard.press("Escape");
  const pa = await palette(adminPage);
  await shot(ctx, adminPage, "N_admin_palette", { fullPage: false });
  await adminPage.keyboard.press("Escape");
  check("N.5", "palet: USER tanpa 'Studio: Alat developer/Sistem', ADMIN dengan keduanya; ada 'Buat dokumen untuk misi'",
    !pu.items.some((t) => /Alat developer|Sistem/.test(t)) && pa.items.some((t) => /Alat developer/.test(t)) && pa.items.some((t) => /Sistem/.test(t)) && pu.items.some((t) => /Buat dokumen/.test(t)),
    `USER=${JSON.stringify(pu.items)} ADMIN=${JSON.stringify(pa.items)}`);
}

// ── T: editor templat (preset + esensial; lanjutan terlipat ADMIN) + pratinjau v2 ──
async function knobSummary(page) {
  return page.evaluate(() => {
    const groups = [...document.querySelectorAll('section[aria-labelledby^="grp-"]')].map((s) => ({
      title: s.querySelector("h3")?.textContent?.trim(),
      knobs: [...s.querySelectorAll(":scope > div > div")].map((r) => r.querySelector("div[id]")?.textContent?.trim()).filter(Boolean),
    }));
    const adv = [...document.querySelectorAll("details summary")].map((s) => s.textContent.trim()).filter((t) => /Pengaturan lanjutan/.test(t));
    const advOpen = [...document.querySelectorAll("details")].filter((d) => /Pengaturan lanjutan/.test(d.querySelector("summary")?.textContent ?? "")).map((d) => d.open);
    return { groups, adv, advOpen };
  });
}

export async function flowT(ctx, { userPage, adminPage, run }) {
  const { check } = ctx;
  ctx.sink.phase = "T";
  const url = `/studio/templates/${DATUM_GSP}?langkah=pengaturan`;
  // USER di templat seed (bukan miliknya): esensial saja, baca saja, lanjutan tidak dirender.
  await userPage.goto(url);
  await settle(userPage, 1500);
  const su = await knobSummary(userPage);
  await shot(ctx, userPage, "T_user_seed_template_settings");
  const allU = su.groups.flatMap((g) => g.knobs);
  check("T.1", "USER: hanya kenop esensial berkelompok (Halaman/Tampilan/Isi), tiap kelompok <= 8 (A3)", su.groups.length >= 3 && su.groups.every((g) => g.knobs.length > 0 && g.knobs.length <= 8),
    su.groups.map((g) => `${g.title}:${g.knobs.length}`).join(", "));
  check("T.2", "USER: 'Pengaturan lanjutan' tidak dirender (A3, SC-14)", su.adv.length === 0, `summary lanjutan=${su.adv.length}`);
  check("T.3", "USER: kenop 'Ukuran kertas' tampil di esensial", allU.includes("Ukuran kertas"), JSON.stringify(allU));
  const disabledU = await userPage.getByRole("combobox", { name: "Ukuran kertas" }).isDisabled();
  check("T.4", "USER pada templat bukan miliknya: kenop baca saja + ajakan 'Buat salinan'", disabledU && (await userPage.getByRole("button", { name: "Buat salinan" }).count()) > 0, `disabled=${disabledU}`);

  // ADMIN di templat yang sama: esensial + panel lanjutan TERLIPAT.
  await adminPage.goto(url);
  await settle(adminPage, 1500);
  const sa = await knobSummary(adminPage);
  check("T.5", "ADMIN: panel 'Pengaturan lanjutan' ada dan terlipat (details tertutup)", sa.adv.length === 1 && sa.advOpen.every((o) => o === false), `lanjutan=${sa.adv.length} open=${JSON.stringify(sa.advOpen)}`);
  check("T.6", "ADMIN: esensial sama dengan USER (<= 8 per kelompok, 'Ukuran kertas' ada)", JSON.stringify(sa.groups.map((g) => g.knobs.length)) === JSON.stringify(su.groups.map((g) => g.knobs.length)) && sa.groups.flatMap((g) => g.knobs).includes("Ukuran kertas"),
    sa.groups.map((g) => `${g.title}:${g.knobs.length}`).join(", "));
  await shot(ctx, adminPage, "T_admin_settings_advanced_collapsed");
  await adminPage.locator("details summary", { hasText: "Pengaturan lanjutan" }).click();
  await adminPage.waitForTimeout(1200);
  const advRows = await adminPage.locator("details[open]").first().locator("input, select, textarea").count();
  check("T.7", "ADMIN: membuka panel lanjutan menampilkan kontrol lanjutan", advRows > 0, `kontrol=${advRows}`);
  await shot(ctx, adminPage, "T_admin_advanced_open");
  // Warna aksen: contoh nilai 'B45309' vs swatch input color.
  const color = await adminPage.evaluate(() => {
    const el = [...document.querySelectorAll('input[type="color"]')][0];
    return el ? { value: el.value, label: el.parentElement?.querySelector("span")?.textContent?.trim() } : null;
  });
  check("T.8", "Warna aksen: swatch sama dengan nilai tertulis", !!color && color.value.replace("#", "").toUpperCase() === String(color.label ?? "").replace("#", "").toUpperCase(), JSON.stringify(color));

  // USER: Buat salinan -> templat milik USER -> kenop dapat diubah; pratinjau v2 (R08 draftTemplate) <= 2 s (A4).
  await userPage.goto(url);
  await settle(userPage, 800);
  await userPage.getByRole("button", { name: "Buat salinan" }).first().click();
  const dlg = userPage.locator("dialog[open]");
  await dlg.waitFor({ timeout: 5000 });
  const isDialogEl = await dlg.evaluate((d) => d.tagName === "DIALOG");
  await dlg.locator("input").first().fill(`E2E SR52 ${run.tag}`);
  await shot(ctx, userPage, "T_user_copy_dialog", { fullPage: false });
  const tplNet = [];
  const onTpl = (r) => { if (/\/api\/studio\/templates/.test(r.url())) tplNet.push(`${r.request().method()} ${new URL(r.url()).pathname}${new URL(r.url()).search} -> ${r.status()}`); };
  userPage.on("response", onTpl);
  await dlg.getByRole("button", { name: "Buat salinan" }).click();
  await userPage.waitForURL((u) => /\/studio\/templates\/[^/]+$/.test(u.pathname) && !u.pathname.endsWith(DATUM_GSP), { timeout: 20000 }).catch(() => {});
  run.copyTemplateId = new URL(userPage.url()).pathname.split("/").pop();
  await userPage.waitForTimeout(1500);
  userPage.off("response", onTpl);
  ctx.log.push(`T.9 jaringan templat: ${tplNet.join(" | ")}`);
  check("T.9", "USER 'Buat salinan' (modal <dialog>) -> templat baru milik USER, langkah Pengaturan", isDialogEl && run.copyTemplateId && run.copyTemplateId !== DATUM_GSP && /langkah=pengaturan/.test(userPage.url()), userPage.url());
  await settle(userPage, 1500);
  const sc = await knobSummary(userPage);
  const paper = userPage.getByRole("combobox", { name: "Ukuran kertas" });
  const paperEnabled = await paper.isEnabled().catch(() => false);
  const kLocked = await userPage.getByText("Hanya admin yang dapat mengubah ini karena mengikat standar DATUM.").count();
  check("T.10", "USER di templat miliknya: 'Ukuran kertas' dapat diubah, lanjutan tetap tidak dirender, kenop kelas K terkunci dengan alasan awam", paperEnabled && sc.adv.length === 0 && kLocked > 0,
    `paperEnabled=${paperEnabled} lanjutan=${sc.adv.length} kLocked=${kLocked}`);
  // Tunggu pratinjau awal selesai.
  await userPage.getByText(/Diperbarui pukul/).first().waitFor({ timeout: 30000 }).catch(() => {});
  const statusBefore = await userPage.getByText(/Diperbarui pukul/).first().innerText().catch(() => "");
  const reqP = userPage.waitForRequest((r) => r.url().includes("/api/studio/validate") && r.method() === "POST", { timeout: 15000 }).catch(() => null);
  const respP = userPage.waitForResponse((r) => r.url().includes("/api/studio/validate") && r.request().method() === "POST", { timeout: 15000 }).catch(() => null);
  const t0 = Date.now();
  await paper.selectOption("F4");
  const req = await reqP;
  const resp = await respP;
  let statusAfter = statusBefore;
  for (let i = 0; i < 60 && statusAfter === statusBefore; i++) {
    await userPage.waitForTimeout(100);
    statusAfter = await userPage.getByText(/Diperbarui pukul/).first().innerText().catch(() => statusBefore);
  }
  const dt = Date.now() - t0;
  let body = null;
  try { body = req ? JSON.parse(req.postData() ?? "null") : null; } catch {}
  const bodyStr = JSON.stringify(body ?? {});
  const respJson = resp ? await resp.json().catch(() => null) : null;
  check("T.11", "pratinjau templat v2 (FIX-V): ubah 'Ukuran kertas' -> POST /api/studio/validate dengan draftTemplate studio.template/v2 berisi F4", !!req && /draftTemplate/.test(bodyStr) && /"F4"/.test(bodyStr) && /studio\.template\/v2/.test(bodyStr),
    `request=${!!req} keys=${body ? Object.keys(body).join(",") : "-"} resp=${resp?.status()} valid=${respJson?.valid}`);
  check("T.12", "A4: pratinjau diperbarui <= 2 s setelah perubahan kenop (jeda 600 ms + render)", statusAfter !== statusBefore && dt <= 2000, `${dt} ms; '${statusBefore}' -> '${statusAfter}'`);
  await shot(ctx, userPage, "T_user_copy_F4_preview");
  // Simpan versi: ringkasan awam "Ukuran kertas: A4 jadi F4", catatan wajib, versi 2; versi 1 utuh.
  await userPage.getByRole("button", { name: /Simpan versi/ }).first().click();
  await userPage.waitForURL(/langkah=simpan/, { timeout: 10000 }).catch(() => {});
  await settle(userPage, 500);
  const changes = await userPage.locator("body").innerText();
  check("T.13", "langkah Simpan menampilkan perubahan awam 'Ukuran kertas: A4 jadi F4'", /Ukuran kertas: A4 jadi F4/.test(changes), (changes.match(/Ukuran kertas[^\n]*/) ?? ["-"])[0]);
  await userPage.getByRole("textbox", { name: /Catatan perubahan/ }).fill("Uji E2E SR-52: kertas F4");
  await shot(ctx, userPage, "T_user_save_step");
  const saveResp = userPage.waitForResponse((r) => r.url().includes(`/api/studio/templates/${run.copyTemplateId}`) && r.request().method() === "POST", { timeout: 20000 }).catch(() => null);
  await userPage.getByRole("button", { name: /^Simpan versi \d+/ }).click();
  const sr = await saveResp;
  await settle(userPage, 800);
  await shot(ctx, userPage, "T_user_saved");
  const vers = await withDb((c) => c.query(`SELECT "versionNo", "paramsSha256" FROM "StudioTemplateVersion" WHERE "templateId"=$1 ORDER BY "versionNo"`, [run.copyTemplateId]).then((r) => r.rows));
  check("T.14", "simpan versi -> versi 2 baru, versi 1 tetap (sidik berbeda)", sr?.status() < 300 && vers.length === 2 && vers[0].paramsSha256 !== vers[1].paramsSha256,
    `HTTP ${sr?.status()} versi=${vers.map((v) => v.versionNo + ":" + String(v.paramsSha256).slice(0, 8)).join(",")}`);
}

// ── K: kerangka/susunan dokumen ─────────────────────────────────────────────
export async function flowK(ctx, { userPage, run }) {
  const { check } = ctx;
  ctx.sink.phase = "K";
  if (!run.copyTemplateId) { check("K.0", "templat salinan USER tersedia", false, "T gagal membuat salinan"); return; }
  await userPage.goto(`/studio/templates/${run.copyTemplateId}/sections`);
  await settle(userPage, 1200);
  const items = userPage.locator('ul[aria-label="Bagian dokumen berurutan"] > li, ol[aria-label="Bagian dokumen berurutan"] > li');
  const labels = async () => (await items.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? "")));
  const before = await labels();
  await shot(ctx, userPage, "K_user_sections_before");
  check("K.1", "susunan: 7 bagian, Sampul posisi tetap di awal, Lampiran posisi tetap di akhir", before.length === 7 && /Sampul, posisi tetap/.test(before[0]) && /Lampiran, posisi tetap/.test(before[6]), JSON.stringify(before));
  // Keyboard: Alt+Panah atas pada Referensi (posisi 6) -> naik ke 5.
  const ref = items.filter({ hasText: "Referensi" }).first();
  await ref.focus();
  await userPage.keyboard.press("Alt+ArrowUp");
  await userPage.waitForTimeout(400);
  const moved = await labels();
  check("K.2", "A5 urut ulang dengan keyboard saja (Alt+Panah atas): Referensi naik ke posisi 5", /Referensi/.test(moved[4] ?? ""), JSON.stringify(moved));
  // Bagian posisi tetap tidak dapat dipindah: pesan inline.
  const cover = items.first();
  await cover.focus();
  await userPage.keyboard.press("Alt+ArrowDown");
  await userPage.waitForTimeout(400);
  const notice = await cover.locator('[role="status"]').innerText().catch(() => "");
  const afterCover = await labels();
  check("K.3", "A5 bagian posisi tetap (Sampul) tidak berpindah + pesan inline", /Sampul/.test(afterCover[0]) && /Sampul selalu di awal|selalu di awal/i.test(notice), `pesan='${notice}'`);
  await shot(ctx, userPage, "K_user_sections_moved");
  // Simpan versi kerangka -> versi baru; versi lama utuh.
  const note = userPage.getByRole("textbox", { name: /Catatan perubahan/ });
  await note.fill("Uji E2E SR-52: Referensi sebelum Isi");
  const saveBtn = userPage.getByRole("button", { name: /^Simpan versi \d+/ });
  const saveResp = userPage.waitForResponse((r) => r.url().includes(`/api/studio/templates/${run.copyTemplateId}`) && ["POST", "PUT"].includes(r.request().method()), { timeout: 20000 }).catch(() => null);
  await saveBtn.click();
  const sr = await saveResp;
  await settle(userPage, 800);
  await shot(ctx, userPage, "K_user_sections_saved");
  const vers = await withDb((c) => c.query(`SELECT "versionNo", "skeletonSha256" FROM "StudioTemplateVersion" WHERE "templateId"=$1 ORDER BY "versionNo"`, [run.copyTemplateId]).then((r) => r.rows).catch(async () =>
    c.query(`SELECT "versionNo" FROM "StudioTemplateVersion" WHERE "templateId"=$1 ORDER BY "versionNo"`, [run.copyTemplateId]).then((r) => r.rows)));
  check("K.4", "A5/SC-3 simpan susunan -> versi 3 baru, versi sebelumnya tetap ada", sr && sr.status() < 300 && vers.length === 3, `HTTP ${sr?.status()} versi=${vers.map((v) => v.versionNo + (v.skeletonSha256 ? ":" + String(v.skeletonSha256).slice(0, 8) : "")).join(",")}`);
}

// ── E: penampil dokumen (fixture misi) ──────────────────────────────────────
export async function flowE(ctx, { page, role, run, stage }) {
  const { check } = ctx;
  ctx.sink.phase = `E-${stage}`;
  const id = run.documentId;
  if (!id) { check(`E.${stage}.0`, "dokumen fixture tersedia", false, "U1 gagal"); return; }
  const posts = [];
  const onReq = (r) => { if (r.method() === "POST" && /\/render$/.test(new URL(r.url()).pathname)) posts.push(r.postData() ?? ""); };
  page.on("request", onReq);
  await page.goto(`/studio/documents/${id}`);
  await settle(page, 1500);
  await shot(ctx, page, `E_${stage}_${role}_baca`);
  const txt = await page.locator("main").innerText();
  check(`E.${stage}.1`, "A8 tab Baca: lembar bernomor (Bab 3, 3.2, 'Gambar 3.1'), bukan JSON/pohon alamat", /Bab 3/.test(txt) && /Gambar 3\.1/.test(txt) && !/"\$schema"|"blocks"\s*:/.test(txt), `GambarLabel=${/Gambar 3\.1/.test(txt)}`);
  const editable = await page.locator('[aria-label*="tekan Enter untuk menyunting"]').count();
  check(`E.${stage}.2`, "A8 paragraf dapat difokus untuk disunting (tabindex + label Enter)", editable > 0, `paragraf tersunting=${editable}`);
  if (stage === "incomplete") {
    const full = page.getByRole("button", { name: "Berkas lengkap" });
    const aria = await full.getAttribute("aria-disabled");
    const nativeDisabled = await full.evaluate((b) => b.disabled);
    await full.click({ force: true });
    await page.waitForTimeout(600);
    const region = page.getByRole("region", { name: "Belum dapat membuat berkas lengkap" });
    const regionText = await region.innerText().catch(() => "");
    await shot(ctx, page, `E_${stage}_${role}_berkas_lengkap_kekurangan`);
    check(`E.${stage}.3`, "A7 'Berkas lengkap' pada dokumen belum lengkap: aria-disabled (tetap fokus), klik membuka daftar kekurangan", aria === "true" && !nativeDisabled && /Lembar Kendali/.test(regionText),
      `aria-disabled=${aria} disabled=${nativeDisabled} kekurangan='${regionText.replace(/\s+/g, " ").slice(0, 160)}'`);
    check(`E.${stage}.4`, "A7 tidak ada POST render scope document dari UI", !posts.some((p) => /"document"/.test(p)), `POST render=${posts.length}`);
    const rail = await page.locator('[role="group"][aria-label^="Kelengkapan dokumen"] button').count();
    const api = (await pageFetch(page, `/api/studio/documents/${id}/completeness`)).json;
    const slots = api?.completeness?.slots?.filter((s) => s.state !== "OMITTED") ?? [];
    const chapters = api?.completeness?.chapters?.content?.expected?.length ?? 0;
    check(`E.${stage}.5`, "A6 rel kelengkapan cocok dengan R15 (segmen = bagian aktif, bab berulang dirinci)", rail === slots.length - 1 + chapters, `segmen=${rail} slot=${slots.length} babDiharapkan=${chapters}`);
  } else {
    const full = page.getByRole("button", { name: "Berkas lengkap" });
    check(`E.${stage}.3`, "dokumen COMPLETE: 'Berkas lengkap' aktif (tanpa aria-disabled)", (await full.getAttribute("aria-disabled")) !== "true", `aria-disabled=${await full.getAttribute("aria-disabled")}`);
  }
  // Tab Kelengkapan, Berkas, Riwayat.
  for (const tab of ["Kelengkapan", "Berkas", "Riwayat"]) {
    await page.getByRole("tab", { name: tab }).click();
    await settle(page, 700);
    await shot(ctx, page, `E_${stage}_${role}_${tab.toLowerCase()}`);
  }
  const riwayat = await page.getByRole("tabpanel", { name: "Riwayat" }).innerText().catch(() => "");
  const raw = riwayat.match(/\b(create;chapter:\d+|chapter:\d+|slot:[a-zA-Z]+|pid:p-[a-z0-9]+)\b/g) ?? [];
  check(`E.${stage}.9`, "A2 tab Riwayat tanpa kode lingkup mentah (mis. 'chapter:3', 'create;chapter:3') di permukaan utama", raw.length === 0, `kode mentah=${JSON.stringify([...new Set(raw)].slice(0, 6))}; label pelaku berprefiks 'agent:'=${(riwayat.match(/agent:[a-z0-9-]+/g) ?? []).length}`);
  await page.getByRole("tab", { name: "Berkas" }).click();
  await settle(page, 500);
  const berkas = await page.getByRole("tabpanel", { name: "Berkas" }).innerText();
  const hrefs = await page.locator('a[href*="/api/studio/files/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  check(`E.${stage}.6`, "A11 tautan berkas lewat fileUrl (?download=1 / ?inline=1), Word hanya Unduh", hrefs.length > 0 && hrefs.every((h) => /\?(download|inline)=1$/.test(h)) && /Word tidak dapat dipratinjau/.test(berkas),
    `hrefs=${hrefs.length} ${hrefs.slice(0, 2).join(" ")}`);
  if (stage === "incomplete") check(`E.${stage}.7`, "tab Berkas: draf bab 3 PDF + Word 'Bertanda DRAF'", /Draf bab 3/.test(berkas) && /Bertanda DRAF/.test(berkas), berkas.replace(/\s+/g, " ").slice(0, 160));
  else check(`E.${stage}.7`, "tab Berkas: berkas lengkap terbaru tercantum", /Berkas lengkap/.test(berkas), berkas.replace(/\s+/g, " ").slice(0, 160));
  // A11: Buka PDF -> pratinjau inline (header respons), Unduh -> attachment.
  const openBtn = page.getByRole("tabpanel", { name: "Berkas" }).getByRole("button", { name: "Buka" }).first();
  if (await openBtn.count()) {
    const inlineResp = page.waitForResponse((r) => /\/api\/studio\/files\/.+inline=1/.test(r.url()), { timeout: 15000 }).catch(() => null);
    await openBtn.click();
    const ir = await inlineResp;
    await page.waitForTimeout(800);
    const dlgTag = await page.locator("dialog[open]").evaluate((d) => d.tagName).catch(() => "none");
    await shot(ctx, page, `E_${stage}_${role}_buka_pdf`, { fullPage: false });
    const dl = hrefs.find((h) => /download=1/.test(h));
    const dr = dl ? await pageFetch(page, dl) : null;
    check(`E.${stage}.8`, "A11 Buka PDF = dialog pratinjau (inline), Unduh = attachment", dlgTag === "DIALOG" && /inline/.test(ir?.headers()["content-disposition"] ?? "") && /attachment/.test(dr?.disposition ?? ""),
      `dialog=${dlgTag} inline='${ir?.headers()["content-disposition"]?.slice(0, 30)}' unduh='${dr?.disposition?.slice(0, 30)}' (HTTP ${dr?.status})`);
    await page.keyboard.press("Escape");
  }
  page.off("request", onReq);
}

/** A8 lewat UI (USER): sunting paragraf -> lembar perubahan Apa/Mengapa/Dampak -> versi baru.
 *  Putaran 1 tanpa "Buat ulang berkas lengkap"; putaran 2 dengan centang itu (D-247: PATCH tanpa render + POST /render). */
async function uiEdit(ctx, page, run, { match, text, rebuild, tag }) {
  await page.goto(`/studio/documents/${run.documentId}?tab=baca`);
  await settle(page, 1200);
  const before = (await pageFetch(page, `/api/studio/documents/${run.documentId}/completeness`)).json;
  const target = page.locator('[aria-label*="tekan Enter untuk menyunting"]').filter({ hasText: match }).first();
  await target.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  const ta = page.locator("textarea").first();
  if (!(await ta.count())) { await shot(ctx, page, `E_edit_${tag}_no_editor`); return { editor: false }; }
  await ta.fill(text);
  await shot(ctx, page, `E_edit_${tag}_inline_editor`);
  await page.getByRole("button", { name: /Simpan perubahan/ }).click();
  await page.waitForTimeout(600);
  const sheet = page.locator("dialog[open]").last();
  const sheetText = await sheet.innerText().catch(() => "");
  const hasThree = /Apa yang diubah/.test(sheetText) && /Mengapa/.test(sheetText) && /Dampak/.test(sheetText);
  const saveBtn = sheet.getByRole("button", { name: /^Simpan$/ });
  // Mengapa kosong: simpan harus ditolak di klien (medan wajib).
  const fields = sheet.locator("textarea, input[type=text], input:not([type])");
  const n = await fields.count();
  let blockedEmpty = null;
  if (tag === "a") {
    const urlCount = { n: 0 };
    const onP = (r) => { if (/\/paragraphs\//.test(r.url()) && r.method() === "PATCH") urlCount.n++; };
    page.on("request", onP);
    await saveBtn.click().catch(() => {});
    await page.waitForTimeout(500);
    page.off("request", onP);
    blockedEmpty = urlCount.n === 0;
  }
  for (let i = 0; i < n; i++) {
    const f = fields.nth(i);
    if (!(await f.inputValue().catch(() => "x"))) await f.fill("Uji E2E SR-52: perjelas tindak lanjut");
  }
  const rebuildBox = sheet.getByRole("checkbox");
  const hasRebuild = (await rebuildBox.count()) > 0;
  if (rebuild && hasRebuild) await rebuildBox.first().check();
  await shot(ctx, page, `E_edit_${tag}_change_sheet`, { fullPage: false });
  const patchP = page.waitForResponse((r) => /\/paragraphs\//.test(r.url()) && r.request().method() === "PATCH", { timeout: 20000 }).catch(() => null);
  const renderP = rebuild ? page.waitForResponse((r) => /\/documents\/[^/]+\/render$/.test(new URL(r.url()).pathname) && r.request().method() === "POST", { timeout: 60000 }).catch(() => null) : null;
  await saveBtn.click();
  const pr = await patchP;
  const patchBody = pr ? (pr.request().postData() ?? "") : "";
  const pj = pr ? await pr.json().catch(() => null) : null;
  const rr = renderP ? await renderP : null;
  const rrJson = rr ? await rr.json().catch(() => null) : null;
  await settle(page, 1200);
  const after = (await pageFetch(page, `/api/studio/documents/${run.documentId}/completeness`)).json;
  const notice = await page.locator('[role="status"], [role="alert"]').allInnerTexts().then((a) => a.join(" | ").replace(/\s+/g, " ").slice(0, 200)).catch(() => "");
  await shot(ctx, page, `E_edit_${tag}_after_save`);
  return { editor: true, hasThree, blockedEmpty, hasRebuild, patchStatus: pr?.status(), patchHasRender: /"render"/.test(patchBody), pid: pj?.pid, code: pj?.code,
    revBefore: before?.completeness?.revisionNo, revAfter: after?.completeness?.revisionNo, renderStatus: rr?.status(), renderBody: rr ? (rr.request().postData() ?? "") : "", job: rrJson?.job, notice };
}

export async function flowEditUi(ctx, { page: pageIn, run }) {
  const { check } = ctx;
  let page = pageIn;
  ctx.sink.phase = "E-edit";
  const a = await uiEdit(ctx, page, run, { match: "Korosi ini menurunkan", text: "Korosi ini menurunkan tahanan kontak sehingga terminal perlu dibersihkan dalam 30 hari.", rebuild: false, tag: "a" });
  check("E.edit.1", "A8 sunting via UI (Enter pada paragraf): lembar Apa/Mengapa/Dampak wajib (kosong ditolak) -> PATCH pid 200 -> versi baru",
    a.editor && a.hasThree && a.blockedEmpty && a.patchStatus === 200 && a.revAfter === a.revBefore + 1 && !a.patchHasRender,
    `editor=${a.editor} sheet3=${a.hasThree} kosongDitolak=${a.blockedEmpty} PATCH=${a.patchStatus} rev ${a.revBefore}->${a.revAfter} pid=${a.pid}`);
  // A9: ganti paragraf 3.1.2 jadi gambar lewat UI (unggah, keterangan, lembar perubahan); pid sama kini blok gambar.
  ctx.sink.phase = "E-A9";
  // Tab baru agar sisa editor yang gagal disimpan (E.edit.2) tidak memengaruhi A9.
  const mainPage = page;
  page = await mainPage.context().newPage();
  page.on("dialog", (d) => { ctx.log.push(`dialog native ${d.type()} (USER) di fase E-A9`); d.accept().catch(() => {}); });
  await page.goto(`/studio/documents/${run.documentId}?tab=baca`);
  await settle(page, 1500);
  await shot(ctx, page, "E_A9_start", { fullPage: false });
  const c0 = (await pageFetch(page, `/api/studio/documents/${run.documentId}/content?slot=content&chapter=3`)).json;
  const targetPid = c0?.content?.sections?.[0]?.blocks?.[1]?.id;
  const block = page.locator('[aria-label*="tekan Enter untuk menyunting"]').filter({ hasText: "Skor diberikan dari inspeksi visual" }).first();
  const blockLabel = String(await block.getAttribute("aria-label")).split(",")[0];
  await block.scrollIntoViewIfNeeded();
  await block.hover();
  const menuBtn = page.locator(`button[aria-label="Tindakan lain untuk ${blockLabel}"]`).first();
  // Jalur keyboard (juga menguji aksesibilitas): fokus paragraf -> Tab ke "Sunting" -> Tab ke "Tindakan lain" -> Enter.
  await block.focus();
  let active = "";
  for (let i = 0; i < 3 && !/^Tindakan lain/.test(active); i++) {
    await page.keyboard.press("Tab");
    active = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
  }
  ctx.log.push(`A9 fokus keyboard: '${active}'`);
  if (/^Tindakan lain/.test(active)) await page.keyboard.press("Enter");
  else await menuBtn.evaluate((b) => b.click());
  await page.waitForTimeout(500);
  const menuDbg = await page.evaluate(() => ({ expanded: document.activeElement?.getAttribute("aria-expanded"), active: document.activeElement?.getAttribute("aria-label"),
    menus: [...document.querySelectorAll('[role="menu"]')].map((m) => m.getAttribute("aria-label") + ":" + [...m.querySelectorAll('[role="menuitem"]')].map((x) => x.textContent).join("/")) }));
  ctx.log.push(`A9 menu: ${JSON.stringify(menuDbg)}`);
  await shot(ctx, page, "E_A9_menu_open", { fullPage: false });
  // Menu tindakan paragraf: dapat diklik dengan tetikus? (uji hit-test; jalur keyboard dipakai untuk melanjutkan A9)
  const mi = page.getByRole("menuitem", { name: "Ganti dengan gambar" });
  const bb = await mi.boundingBox();
  const hit = bb ? await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e ? `${e.tagName.toLowerCase()}${e.getAttribute("role") ? "[role=" + e.getAttribute("role") + "]" : ""} '${(e.textContent ?? "").trim().slice(0, 24)}'` : "null"; }, { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }) : "tanpa kotak";
  const clickable = await mi.click({ trial: true, timeout: 3000 }).then(() => true).catch(() => false);
  check("E.A9.menu", "menu 'Tindakan lain' paragraf dapat diklik tetikus pada 1440 px (tidak tertutup panel Daftar isi)", clickable,
    `kotak menuitem x=${Math.round(bb?.x ?? -1)}..${Math.round((bb?.x ?? 0) + (bb?.width ?? 0))}; elemen di titik tengah = ${hit}`);
  await mi.focus();
  await page.keyboard.press("Enter");
  const dlg = page.locator("dialog[open]").last();
  await dlg.waitFor({ timeout: 5000 }).catch(() => {});
  const sizeFields = await dlg.locator("input, select").evaluateAll((els) => els.map((e) => (e.getAttribute("aria-label") ?? "") + " " + (e.labels?.[0]?.textContent ?? "")).filter((t) => /lebar|ukuran|width|mm/i.test(t)));
  await dlg.locator('input[type="file"]').setInputFiles({ name: "detail-pmt2.png", mimeType: "image/png", buffer: run.uiPng });
  await page.waitForTimeout(500);
  await dlg.getByLabel("Keterangan gambar").fill("Detail terminal PMT-2 (uji UI).");
  await dlg.getByLabel(/Sumber/).first().fill("Foto lapangan uji E2E").catch(() => {});
  await shot(ctx, page, "E_A9_image_dialog", { fullPage: false });
  const upP = page.waitForResponse((r) => /\/api\/studio\/assets/.test(r.url()) && r.request().method() === "POST", { timeout: 20000 }).catch(() => null);
  await dlg.getByRole("button", { name: "Lanjut" }).click();
  const up = await upP;
  const upJson = up ? await up.json().catch(() => null) : null;
  if (upJson?.created && upJson?.asset?.sha256) run.createdAssets.push(upJson.asset.sha256);
  await page.waitForTimeout(800);
  const sheet = page.locator("dialog[open]").last();
  const fields = sheet.locator("textarea, input[type=text], input:not([type])");
  const n = await fields.count();
  for (let i = 0; i < n; i++) { const f = fields.nth(i); if (!(await f.inputValue().catch(() => "x"))) await f.fill("Uji E2E SR-52: foto lebih jelas dari uraian"); }
  await shot(ctx, page, "E_A9_change_sheet", { fullPage: false });
  const patchP = page.waitForResponse((r) => /\/paragraphs\//.test(r.url()) && r.request().method() === "PATCH", { timeout: 20000 }).catch(() => null);
  await sheet.getByRole("button", { name: /^Simpan$/ }).click();
  const pr = await patchP;
  await settle(page, 1200);
  await shot(ctx, page, "E_A9_after_save");
  const c1 = (await pageFetch(page, `/api/studio/documents/${run.documentId}/content?slot=content&chapter=3`)).json;
  const nb = c1?.content?.sections?.[0]?.blocks?.find((x) => x.id === targetPid);
  const tree = (await pageFetch(page, `/api/studio/documents/${run.documentId}`)).json;
  const labels = JSON.stringify(tree ?? {}).match(/"artifactLabel":"Gambar 3\.\d+"/g) ?? [];
  check("E.A9", "A9 ganti paragraf jadi gambar via UI: unggah + keterangan -> PATCH 200, pid sama kini image, tanpa medan ukuran; penomoran Gambar 3.1/3.2 dibangkitkan mesin",
    up?.status() < 300 && pr?.status() === 200 && nb?.type === "image" && sizeFields.length === 0 && labels.length >= 2,
    `unggah=${up?.status()} PATCH=${pr?.status()} pid=${targetPid} type=${nb?.type} medanUkuran=${sizeFields.length} label=${[...new Set(labels)].join(",")}`);
  await page.close();
  ctx.sink.phase = "E-edit-rebuild";
  const b = await uiEdit(ctx, pageIn, run, { match: "Tabel berikut merangkum", text: "Tabel berikut merangkum skor kondisi tiap pemutus tenaga.", rebuild: true, tag: "b" });
  check("E.edit.2", "D-247 lewat UI: centang 'Buat ulang berkas lengkap' -> PATCH TANPA medan render lalu POST /render scope document",
    b.hasRebuild && b.patchStatus === 200 && !b.patchHasRender && /"document"/.test(b.renderBody) && b.renderStatus === 200,
    `checkbox=${b.hasRebuild} PATCH=${b.patchStatus} code=${b.code ?? ""} patchMemuatRender=${b.patchHasRender} render=${b.renderStatus ?? "tidak dipanggil"} job=${b.job?.status ?? "-"} rev ${b.revBefore}->${b.revAfter} pesan='${b.notice}'`);
  run.uiEditRevision = b.revAfter;
}

// ── G, P, Y ─────────────────────────────────────────────────────────────────
export async function flowGPY(ctx, { userPage, adminPage }) {
  const { check } = ctx;
  ctx.sink.phase = "G";
  await userPage.goto("/studio/artifacts");
  await settle(userPage, 1000);
  const tabsU = await userPage.getByRole("tab").allInnerTexts();
  await shot(ctx, userPage, "G_user_gallery");
  check("G.1", "Galeri: tab Galeri, Katalog jenis, Buat artefak tampil untuk USER (D-164 T-6)", ["Galeri", "Katalog jenis", "Buat artefak"].every((t) => tabsU.some((x) => x.trim() === t)), JSON.stringify(tabsU));
  for (const t of ["Katalog jenis", "Buat artefak"]) {
    await userPage.getByRole("tab", { name: t }).click();
    await settle(userPage, 800);
    await shot(ctx, userPage, `G_user_${t.replace(/\s+/g, "_").toLowerCase()}`);
  }
  ctx.sink.phase = "P";
  await userPage.goto("/studio/playground");
  await settle(userPage, 800);
  const pu = await userPage.locator("main").innerText();
  await shot(ctx, userPage, "P_user_playground_admin_only");
  check("P.1", "Alat developer via URL oleh USER -> layar 'khusus admin'", /khusus admin/i.test(pu) && !(await userPage.getByRole("button", { name: "Kirim ke Studio" }).count()), pu.replace(/\s+/g, " ").slice(-120));
  await adminPage.goto("/studio/playground");
  await settle(adminPage, 1000);
  const modes = await adminPage.getByRole("group", { name: "Mode kiriman" }).getByRole("radio").count();
  // Validasi contoh E1 (tanpa menyimpan; R08 dry-run READ ONLY D-272).
  const vResp = adminPage.waitForResponse((r) => r.url().includes("/api/studio/validate"), { timeout: 30000 }).catch(() => null);
  await adminPage.getByRole("button", { name: "Validasi" }).click();
  const vr = await vResp;
  await settle(adminPage, 1500);
  await shot(ctx, adminPage, "P_admin_playground_validate");
  const vj = vr ? await vr.json().catch(() => null) : null;
  check("P.2", "Alat developer ADMIN: 4 mode kiriman; Validasi contoh E1 -> R08 200 dengan completenessPreview", modes === 4 && vr?.status() === 200 && !!(vj?.completenessPreview ?? vj?.completeness),
    `mode=${modes} HTTP ${vr?.status()} valid=${vj?.valid} keys=${vj ? Object.keys(vj).slice(0, 8).join(",") : "-"}`);
  ctx.sink.phase = "Y";
  await userPage.goto("/studio/system");
  await settle(userPage, 1000);
  const yu = await userPage.locator("main").innerText();
  await shot(ctx, userPage, "Y_user_system_card");
  await adminPage.goto("/studio/system");
  await settle(adminPage, 1500);
  const ya = await adminPage.locator("main").innerText();
  await shot(ctx, adminPage, "Y_admin_system_full");
  check("Y.1", "Sistem: USER satu kartu status ringkas; ADMIN panel penuh + 'Periksa ulang kesiapan'",
    /Mesin cetak (siap|bermasalah)/.test(yu) && !/Periksa ulang kesiapan/.test(yu) && /Periksa ulang kesiapan/.test(ya) && /Huruf terpasang/.test(ya),
    `USER='${yu.replace(/\s+/g, " ").slice(-90)}' ADMIN memuat Huruf terpasang=${/Huruf terpasang/.test(ya)}`);
}

// ── Dokumen baca-saja 000/001 (E untuk dokumen besar, tanpa tulis) ────────
export async function flowReadOnlyDocs(ctx, { userPage }) {
  const { check } = ctx;
  ctx.sink.phase = "E-readonly";
  await userPage.goto("/studio/documents");
  await settle(userPage, 1000);
  const groups = await userPage.locator("main section h2, main [role=region] > h2").allInnerTexts();
  await shot(ctx, userPage, "E_list_grouped_by_mission");
  check("E.list.1", "A6 daftar dokumen dikelompokkan per misi (grup fixture + 'Tanpa misi')", groups.some((g) => /e2e sr52/i.test(g)) && groups.some((g) => /Tanpa misi/i.test(g)), JSON.stringify(groups));
  await userPage.goto(`/studio/documents/${DOC_000}`);
  await settle(userPage, 2500);
  await shot(ctx, userPage, "E_doc000_readonly_view", { fullPage: false });
  const t = await userPage.locator("main").innerText();
  check("E.ro.1", "dokumen 000 (templat terbatas) terbuka untuk dibaca USER tanpa galat", /Manual Komprehensif DATUM GSP/.test(t), t.replace(/\s+/g, " ").slice(0, 120));
  await userPage.goto(`/studio/documents/${DOC_001}`);
  await settle(userPage, 1500);
  await shot(ctx, userPage, "E_doc001_readonly_view", { fullPage: false });
}

// ── A15: viewport 400 px ───────────────────────────────────────────────────
export async function flowA15(ctx, { browser, storageState, run, newContext }) {
  const { check } = ctx;
  ctx.sink.phase = "A15";
  const c = await newContext(browser, "user-400", ctx.sink, { viewport: { width: 400, height: 860 }, storageState });
  const p = await c.newPage();
  const res = {};
  for (const path of ["/studio", "/studio/documents", `/studio/documents/${run.documentId}`, `/studio/templates/${DATUM_GSP}?langkah=pengaturan`, "/studio/artifacts"]) {
    await p.goto(path);
    await settle(p, 1000);
    res[path] = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    await shot(ctx, p, `A15_400px_${path.split("/").filter(Boolean).slice(-1)[0].replace(/[^a-z0-9]+/gi, "_")}`, { fullPage: false });
  }
  const bad = Object.entries(res).filter(([, v]) => v.sw > v.cw + 1);
  check("A15.1", "400 px: tanpa gulir horizontal halaman (scrollWidth <= clientWidth)", bad.length === 0, JSON.stringify(res));
  await p.goto(`/studio/documents/${run.documentId}?tab=kelengkapan`);
  await settle(p, 800);
  const tableVisible = await p.locator('table[aria-label="Kelengkapan per bagian dokumen"], table:has(caption)').first().isVisible().catch(() => false);
  await shot(ctx, p, "A15_400px_kelengkapan", { fullPage: true });
  check("A15.2", "400 px: tabel Kelengkapan menjadi kartu (tabel tidak tampil)", !tableVisible, `table visible=${tableVisible}`);
  await c.close();
}

// ── A14: axe (serius/kritis) di W1-W9 ──────────────────────────────────────
export async function flowAxe(ctx, { page, run }) {
  const { check } = ctx;
  ctx.sink.phase = "A14";
  const pages = {
    W1: "/studio", W2: "/studio/templates", W3: `/studio/templates/${run.copyTemplateId ?? DATUM_GSP}?langkah=pengaturan`,
    W4: `/studio/templates/${run.copyTemplateId ?? DATUM_GSP}/sections`, W5: "/studio/documents",
    W6: `/studio/documents/${run.documentId}?tab=kelengkapan`, W7: `/studio/documents/${run.documentId}?tab=baca`,
    W8: `/studio/documents/${run.documentId}?tab=riwayat`, W9: `/studio/documents/${run.documentId}?tab=berkas`,
  };
  const out = {};
  for (const [w, path] of Object.entries(pages)) {
    await page.goto(path);
    await settle(page, 1200);
    await page.addScriptTag({ path: AXE });
    const r = await page.evaluate(async () => {
      const res = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
      const inShell = (n) => { const el = document.querySelector(n.target[0]); return !!el?.closest("aside, nextjs-portal"); };
      return res.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, nStudio: v.nodes.filter((n) => !inShell(n)).length, sample: v.nodes[0]?.target?.join(" "),
        nodes: v.nodes.slice(0, 15).map((n) => ({ shell: inShell(n), target: n.target.join(" "), text: (document.querySelector(n.target[0])?.textContent ?? "").trim().slice(0, 40), why: (n.any?.[0]?.message ?? n.failureSummary ?? "").slice(0, 160) })) }));
    });
    out[w] = r;
  }
  ctx.axe = out;
  const serious = Object.entries(out).flatMap(([w, vs]) => vs.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${w}:${v.id}(${v.impact},${v.n})`));
  check("A14.1", "axe: 0 pelanggaran serius/kritis di W1-W9 (halaman utuh termasuk sidebar HQ)", serious.length === 0, serious.join("; ") || "0");
  const studioOnly = Object.entries(out).flatMap(([w, vs]) => vs.filter((v) => (v.impact === "serious" || v.impact === "critical") && v.nStudio > 0).map((v) => `${w}:${v.id}(${v.nStudio})`));
  check("A14.2", "axe: 0 pelanggaran serius/kritis pada area Studio saja (di luar sidebar HQ)", studioOnly.length === 0, studioOnly.join("; ") || "0");
  // Semua modal Studio = <dialog>: sudah dicek di T.9 (salinan) dan E.*.8 (pratinjau PDF).
}

// ── A12: galat jaringan -> pesan awam + coba ulang terjadwal ───────────────
export async function flowA12(ctx, { page }) {
  const { check } = ctx;
  ctx.sink.phase = "A12(sengaja)";
  await page.route("**/api/studio/documents?**", (r) => r.abort("failed"));
  await page.route("**/api/studio/documents", (r) => r.abort("failed"));
  await page.goto("/studio/documents");
  await page.waitForTimeout(2500);
  const t = await page.locator("main").innerText();
  await shot(ctx, page, "A12_network_error", { fullPage: false });
  const countdown = /\b\d+\s*(dtk|detik|s)\b/i.test(t) || /Coba (lagi|ulang)/i.test(t);
  check("A12.1", "API dokumen diputus: pesan awam + tombol/hitung mundur coba ulang (tanpa jargon teknis)", countdown && !/TypeError|Failed to fetch|ECONN|stack/i.test(t), t.replace(/\s+/g, " ").slice(0, 220));
  await page.unrouteAll({ behavior: "ignoreErrors" });
}
