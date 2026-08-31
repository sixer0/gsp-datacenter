import { NextResponse } from "next/server";
import { mkdir, writeFile, stat } from "fs/promises";
import path from "path";
import { requireSession } from '@/lib/require-session';

export const dynamic = "force-dynamic";

// Upload lampiran untuk proposa library → <SHARED_WORKSPACE>/library/proposals/raw/<token>/
// Token dibuat client (UUID) agar upload bisa terjadi sebelum request proposa dibuat.
const SHARED =
  process.env.SHARED_WORKSPACE || "C:/Users/TRIAL/workspace/gsp-hermes/workspace";
const ALLOWED = new Set([
  ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".md", ".txt",
  ".csv", ".jpg", ".jpeg", ".png", ".json",
]);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

function safeName(name: string): string {
  const base = path.basename(name || "file").replace(/[^\w.\- ]+/g, "_").trim();
  return base || "file";
}

export async function POST(req: Request) {
  // W2.2 guard (F-SEC-004): tolak tanpa sesi/identitas internal — level route.
  const denied = await requireSession(req);
  if (denied) return denied;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "body harus multipart/form-data" }, { status: 400 });
  }
  const file = form.get("file");
  const token = (form.get("token") || "").toString().trim();
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(token))
    return NextResponse.json({ error: "token tidak valid" }, { status: 400 });

  const name = safeName(file.name);
  const ext = path.extname(name).toLowerCase();
  if (!ALLOWED.has(ext))
    return NextResponse.json(
      { error: `ekstensi ${ext || "(kosong)"} tidak diizinkan — gunakan ${[...ALLOWED].join(", ")}` },
      { status: 400 }
    );
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "file terlalu besar (maks 25 MB)" }, { status: 413 });

  const dir = path.join(SHARED, "library", "proposals", "raw", token);
  await mkdir(dir, { recursive: true });
  // Nama unik bila bentrok (prefix timestamp)
  const finalName = `${Date.now()}-${name}`;
  const dest = path.join(dir, finalName);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buf);
  const rel = path.relative(SHARED, dest).split(path.sep).join("/");
  const sz = (await stat(dest)).size;
  return NextResponse.json({ name: finalName, original: file.name, path: rel, size: sz });
}
