import type { Metadata } from "next";
import { TemplateList } from "@/components/studio/template-editor";
import { studioPageTitle } from "@/lib/studio/contract/ui";

export const metadata: Metadata = { title: studioPageTitle("Templat") };

/** /studio/templates — daftar templat, dialog Buat templat, tab Gaya (ADMIN) (SR-29; UX-01 W2). */
export default function StudioTemplatesPage() {
  return <TemplateList />;
}
