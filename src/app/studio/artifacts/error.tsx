"use client";

/*
 * Batas galat segmen /studio/artifacts (S62). Sejak FIX-4b pembungkus tipis
 * `shared/error-view` (UX-01 §6.4): pesan awam, log `studio.ui.boundary.artifacts`
 * sekali per galat, coba ulang berjeda 3/6/12 dtk (maks 3) yang bertahan
 * antar-pasang ulang fallback.
 */
import { StudioSegmentError } from "@/components/studio/shared/error-view";

export default function ArtifactsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <StudioSegmentError error={error} reset={reset} segment="artifacts" />;
}
