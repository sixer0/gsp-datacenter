import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/kit";
import { DocumentList } from "@/components/studio/document-viewer/document-list";
import { studioPageTitle } from "@/lib/studio/contract/ui";

export const metadata: Metadata = {
  title: studioPageTitle("Dokumen"),
};

export default function StudioDocumentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <DocumentList />
    </Suspense>
  );
}
