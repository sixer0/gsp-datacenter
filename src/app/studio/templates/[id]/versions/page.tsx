import type { Metadata } from "next";
import { VersionHistory } from "@/components/studio/template-editor";
import { studioPageTitle } from "@/lib/studio/contract/ui";

export const metadata: Metadata = { title: studioPageTitle("Riwayat versi templat") };

/** /studio/templates/[id]/versions — riwayat dan pembanding versi templat (S58, SR-29). */
export default async function StudioTemplateVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VersionHistory templateId={id} />;
}
