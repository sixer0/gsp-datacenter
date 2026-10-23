"use client";

/*
 * Boundary galat akar Studio: menaungi /studio, /studio/documents, /studio/playground, /studio/system, dan rute lain yang belum punya boundary sendiri (FIX-4a; UX-01 §6.4; S86 R07). Pesan awam, log
 * `client-log` sekali per galat, coba ulang = reset() dengan jeda 3/6/12 s.
 */
import { StudioSegmentError } from "@/components/studio/shared/error-view";

export default function StudioError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <StudioSegmentError error={error} reset={reset} segment="root" />;
}
