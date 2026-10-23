import type { Metadata } from "next";
import { RenderStatusPanel } from "@/components/studio/render-status";
import { studioPageTitle } from "@/lib/studio/contract/ui";

/*
 * /studio/system (W12): ADMIN melihat panel kesiapan mesin cetak lengkap,
 * USER melihat satu kartu status awam. Boundary galat dari `app/studio/error.tsx`.
 */
export const metadata: Metadata = {
  title: studioPageTitle("Sistem"),
};

export default function StudioSystemPage() {
  return <RenderStatusPanel />;
}
