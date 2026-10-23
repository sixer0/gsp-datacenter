import { redirect } from "next/navigation";

/*
 * Rute lama "revisi (hanya baca)" DIALIHKAN ke tab Baca pada versi itu
 * (SR-30; D-163 T-11). Nomor tidak sah -> tab Riwayat.
 */
export default async function StudioDocumentRevisionRedirect({ params }: { params: Promise<{ id: string; rev: string }> }) {
  const { id, rev } = await params;
  const base = `/studio/documents/${encodeURIComponent(id)}`;
  redirect(/^[1-9][0-9]{0,8}$/.test(rev) ? `${base}?tab=baca&versi=${rev}` : `${base}?tab=riwayat`);
}
