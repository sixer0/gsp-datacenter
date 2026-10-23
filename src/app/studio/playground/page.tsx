import type { Metadata } from "next";
import { studioPageTitle } from "@/lib/studio/contract/ui";
import { DeveloperTools } from "@/components/studio/playground/playground";

export const metadata: Metadata = {
  title: studioPageTitle("Alat developer"),
};

/** Alat developer Studio (SR-31, UX-01 W11): uji kiriman agen v2, khusus ADMIN di UI. */
export default function StudioPlaygroundPage() {
  return <DeveloperTools />;
}
