import type { Metadata } from "next";
import { SectionComposer } from "@/components/studio/section-composer";
import { studioPageTitle } from "@/lib/studio/contract/ui";

export const metadata: Metadata = {
  title: studioPageTitle("Susunan dokumen"),
};

/**
 * Susunan dokumen templat (SR-28; UX-01 W4, alur 3a langkah 3-4). Boundary
 * galat segmen: `../error.tsx` (FIX-4a); lebar/padding dari layout Studio.
 */
export default async function StudioTemplateSectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SectionComposer templateId={id} />;
}
