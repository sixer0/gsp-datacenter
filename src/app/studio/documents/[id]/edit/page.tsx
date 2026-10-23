import { redirect } from "next/navigation";

/*
 * Rute lama "sunting per alamat" DIALIHKAN ke tab Baca & sunting (SR-30; D-163
 * T-11: tautan lama dan panduan agent tetap jalan, rute tidak dihapus).
 * `?address=` lama tidak dapat dipetakan ke paragraf tanpa memuat dokumen, jadi
 * diteruskan sebagai tujuan gulir bila berupa nomor bab ("3") atau diabaikan.
 */
export default async function StudioDocumentEditRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ address?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const raw = Array.isArray(sp.address) ? sp.address[0] : sp.address;
  const chapter = raw && /^([1-9][0-9]{0,2}|[A-Z])(\.|$)/.exec(raw.trim());
  const target = chapter ? `&ke=content:${encodeURIComponent(chapter[1])}` : "";
  redirect(`/studio/documents/${encodeURIComponent(id)}?tab=baca${target}`);
}
