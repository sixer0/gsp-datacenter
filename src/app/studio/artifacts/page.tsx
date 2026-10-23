/*
 * /studio/artifacts (S62; W10): galeri, katalog jenis, dan pembuatan artefak
 * (grafik, diagram, gambar, halaman web). Komponen klien memakai
 * useSearchParams, jadi dibungkus Suspense. Judul seragam `studioPageTitle` (FIX-4b).
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArtifactStudio } from "@/components/studio/artifact-gallery";
import { Skeleton } from "@/components/ui/kit";
import { studioPageTitle } from "@/lib/studio/contract/ui";

export const metadata: Metadata = {
  title: studioPageTitle("Galeri artefak"),
};

export default function StudioArtifactsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] rounded-[16px]" />}>
      <ArtifactStudio />
    </Suspense>
  );
}
