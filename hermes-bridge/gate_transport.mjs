// gate_transport.mjs — Hard-gate prapenyampaian gerbang naturalisasi (pilot NAT-R3, kartu t_ebc486c1).
//
// Posisi: lapis pengiriman bridge HQ. Setiap hasil kerja agent (kind oneshot/chat)
// dipindai scanner deterministik SEBELUM ditulis ke AgentRequest / komentar kartu /
// event dashboard. Kanal pilot: K5 kanban (ringkasan handoff), sesuai D-TA-07.
//
// Batas desain (body kartu NAT-FOLLOW-R3):
//   • Tidak ada pembuangan diam-diam: keluaran tertahan ditulis utuh ke gate-hold/
//     plus baris indeks gate-hold.ndjson plus AgentEvent kind=gate, dan ada jalur
//     rilis manual (gate-release.mjs).
//   • Tidak memutus pipeline: kegagalan apa pun di modul ini fallback ke
//     kirim-dengan-catatan (fail-open), pemanggil tetap menyelesaikan request.
//   • Fallback scanner error: kirim dengan catatan eksplisit di akhir keluaran.
//
// Konfigurasi (env, semua opsional):
//   BRIDGE_GATE_ENABLED=0            mematikan gerbang (rollback satu variabel)
//   BRIDGE_GATE_CHANNELS=kanban      daftar kanal scanner yang aktif (pilot: satu)
//   BRIDGE_GATE_PYTHON=<path>        interpreter python untuk scanner
//   BRIDGE_GATE_SCANNER=<path>       scan_ai_footprint.py fleet registry
//   BRIDGE_GATE_TIMEOUT_MS=60000     batas waktu satu pemindaian
//   BRIDGE_GATE_HOLD_DIR=<path>      direktori tahanan (default ./gate-hold)
import { spawn, execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const CFG = {
  enabled: process.env.BRIDGE_GATE_ENABLED !== "0",
  channels: (process.env.BRIDGE_GATE_CHANNELS || "kanban")
    .split(",").map((s) => s.trim()).filter(Boolean),
  python: process.env.BRIDGE_GATE_PYTHON
    || "C:/Users/TRIAL/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe",
  scanner: process.env.BRIDGE_GATE_SCANNER
    || "C:/Users/TRIAL/AppData/Local/hermes/skills/gsp/gsp-output-naturalization/scripts/scan_ai_footprint.py",
  timeoutMs: Number(process.env.BRIDGE_GATE_TIMEOUT_MS || 60000),
  holdDir: process.env.BRIDGE_GATE_HOLD_DIR || path.join(HERE, "gate-hold"),
};

// Satu pemindaian: tulis teks ke berkas temp, jalankan scanner, klasifikasi.
// Return { status: 'pass'|'fail'|'error', report, failLines, error }
export function scanText(text, channel, { python, scanner, timeoutMs } = {}) {
  const py = python || CFG.python;
  const sc = scanner || CFG.scanner;
  const tmo = timeoutMs || CFG.timeoutMs;
  return new Promise((resolve) => {
    let tmpDir, tmpFile;
    try {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nat-gate-"));
      tmpFile = path.join(tmpDir, "payload.md");
      fs.writeFileSync(tmpFile, String(text ?? ""), "utf8");
    } catch (e) {
      resolve({ status: "error", report: "", failLines: [], error: `tmp: ${e.message}` });
      return;
    }
    const cleanup = () => { try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* abaikan */ } };
    if (!fs.existsSync(sc)) {
      cleanup();
      resolve({ status: "error", report: "", failLines: [], error: `scanner tidak ditemukan: ${sc}` });
      return;
    }
    const child = spawn(py, [sc, tmpFile, "--channel", channel], { windowsHide: true });
    let stdout = "", stderr = "", settled = false;
    const MAX_OUT = 512 * 1024;
    const killTree = () => {
      try { execFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], () => {}); } catch { /* sudah mati */ }
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true; killTree(); cleanup();
      resolve({ status: "error", report: stdout, failLines: [], error: `timeout ${tmo}ms` });
    }, tmo);
    child.stdout.on("data", (d) => { if (stdout.length < MAX_OUT) stdout += d; });
    child.stderr.on("data", (d) => { if (stderr.length < 8192) stderr += d; });
    child.on("error", (e) => {
      if (settled) return;
      settled = true; clearTimeout(timer); cleanup();
      resolve({ status: "error", report: stdout, failLines: [], error: `spawn: ${e.message}` });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true; clearTimeout(timer); cleanup();
      const m = /VERDICT:\s*(PASS|FAIL)/.exec(stdout || "");
      const failLines = (stdout || "").split(/\r?\n/).filter((l) => /^\s*CHECK.*: FAIL /.test(l)).slice(0, 8);
      if (m && m[1] === "PASS" && code === 0) resolve({ status: "pass", report: stdout, failLines: [] });
      else if (m && m[1] === "FAIL" && (code === 1 || code === 0)) resolve({ status: "fail", report: stdout, failLines });
      else resolve({ status: "error", report: stdout, failLines,
        error: `exit=${code} verdict=${m ? m[1] : "tidak terbaca"} ${(stderr || "").split("\n")[0].slice(0, 160)}` });
    });
  });
}

function sha256(s) { return crypto.createHash("sha256").update(String(s ?? ""), "utf8").digest("hex"); }

// Tulis tahanan: berkas utuh + baris indeks NDJSON. Return { holdPath, indexPath }.
export function writeHold(req, text, channel, scan) {
  fs.mkdirSync(CFG.holdDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const holdPath = path.join(CFG.holdDir, `${req.id}.md`);
  const head = [
    "# Keluaran tertahan gerbang naturalisasi (NAT-R3 pilot)",
    "",
    `- request: ${req.id}`,
    `- judul: ${(req.title || "").slice(0, 200)}`,
    `- profil: ${req.profile || "-"}`,
    `- kanal scanner: ${channel}`,
    `- waktu: ${stamp}`,
    `- sha256 teks: ${sha256(text)}`,
    `- karakter terlarang ditemukan: ${scan.failLines.length ? "ya" : "lihat laporan"}`,
    "",
    "## Laporan scanner",
    "",
    "```",
    (scan.report || "").trim(),
    "```",
    "",
    "## Teks lengkap tertahan",
    "",
    "<<<HELD-TEXT-BEGIN>>>",
    text,
    "<<<HELD-TEXT-END>>>",
    "",
  ].join("\n");
  fs.writeFileSync(holdPath, head, "utf8");
  const indexPath = path.join(CFG.holdDir, "gate-hold.ndjson");
  fs.appendFileSync(indexPath, JSON.stringify({
    at: stamp, requestId: req.id, title: (req.title || "").slice(0, 160),
    profile: req.profile || null, channel, holdPath, sha256: sha256(text),
    failLines: scan.failLines,
  }) + "\n", "utf8");
  return { holdPath, indexPath };
}

export function buildNotice(req, channel, scan, holdPath) {
  const finds = (scan.failLines || []).slice(0, 5).map((l) => "  - " + l.trim()).join("\n");
  return [
    "[TERTAHAN GERBANG NATURALISASI - NAT-R3 pilot]",
    `Keluaran request ${req.id} gagal scanner deterministik pada kanal '${channel}' dan ditahan`,
    "sebelum penyampaian (tidak dibuang: teks utuh tersimpan di berkas tahanan).",
    `Tahanan: ${holdPath}`,
    `Rilis manual: node gate-release.mjs --request ${req.id} --force`,
    finds ? `Temuan FAIL:\n${finds}` : "Temuan FAIL: lihat laporan pada berkas tahanan.",
  ].join("\n");
}

// Titik tunggal keputusan gerbang untuk satu keluaran. Pemanggil (bridge) memakai
// hasil { delivery, held } untuk menulis DB/kartu/event. Event dikembalikan, bukan
// ditulis, agar bridge yang punya koneksi DB yang memutuskan penyimpanan.
export async function gateForDelivery(req, text, log = () => {}) {
  if (!CFG.enabled || !CFG.channels.length) return { held: false, delivery: text, verdict: "off" };
  // ASK-INST (03-09): kind "instant" (tanya-jawab read-only Ask Librarian) tidak
  // disaring gerbang. Alasan: (a) keluarannya JSON utk parser UI - tahanan scanner
  // mengganti payload dengan notice dan mematikan fitur; (b) kebijakan 03-09
  // mempersempit gerbang ke keluaran final yang dibaca manusia, dan jawaban
  // transaksional tabel bukan deliverable etalase. Kind lain tetap disaring.
  if (req && req.kind === "instant") return { held: false, delivery: text, verdict: "off-instant" };
  if (!text || !String(text).trim()) return { held: false, delivery: text, verdict: "empty" };
  const channel = CFG.channels[0]; // pilot: SATU kanal
  const res = await scanText(text, channel);
  if (res.status === "pass") {
    log("gate: PASS", req.id, channel);
    return { held: false, delivery: text, verdict: "pass" };
  }
  if (res.status === "error") {
    log("gate: ERROR fail-open", req.id, res.error);
    const note = `\n\n[catatan gerbang NAT-R3: scanner tidak dapat memverifikasi keluaran ini (${res.error}); dikirim dengan catatan sesuai batas desain fail-open.]`;
    return {
      held: false, delivery: text + note, verdict: "error",
      event: { kind: "gate_note", level: "warn", detail: `scanner error: ${res.error}`.slice(0, 400) },
    };
  }
  const { holdPath } = writeHold(req, text, channel, res);
  const notice = buildNotice(req, channel, res, holdPath);
  log("gate: HELD", req.id, channel, holdPath);
  return {
    held: true, delivery: notice, verdict: "fail", holdPath,
    event: { kind: "gate_hold", level: "warn", detail: notice.slice(0, 400) },
  };
}
