import type { Metadata } from "next";
import { StudioHome } from "@/components/studio/document-viewer/studio-home";
import { studioPageTitle } from "@/lib/studio/contract/ui";

export const metadata: Metadata = {
  title: studioPageTitle("Beranda"),
};

export default function StudioPage() {
  return <StudioHome />;
}
