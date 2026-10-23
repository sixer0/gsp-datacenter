import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/kit";
import { DocumentViewer } from "@/components/studio/document-viewer/document-viewer";
import { studioPageTitle } from "@/lib/studio/contract/ui";

export const metadata: Metadata = {
  title: studioPageTitle("Dokumen"),
};

/** Halaman dokumen: `?tab=baca|kelengkapan|berkas|riwayat&versi=<n>&p=<paragraf>` (SR-30; UX-01 §2.1). */
export default async function StudioDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <DocumentViewer id={id} />
    </Suspense>
  );
}
