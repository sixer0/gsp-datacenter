import { Skeleton } from "@/components/ui/kit";

/* Keadaan muat segmen /studio/artifacts (S62). */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat halaman artefak">
      <Skeleton className="h-8 w-48 rounded-[10px]" />
      <Skeleton className="h-[360px] rounded-[16px]" />
    </div>
  );
}
