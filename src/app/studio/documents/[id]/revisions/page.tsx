import { redirect } from "next/navigation";

/*
 * Rute lama "riwayat revisi" DIALIHKAN ke tab Riwayat (SR-30; D-163 T-11:
 * tautan lama tetap jalan, rute tidak dihapus).
 */
export default async function StudioDocumentRevisionsRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/studio/documents/${encodeURIComponent(id)}?tab=riwayat`);
}
