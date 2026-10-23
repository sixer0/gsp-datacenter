import type { Metadata } from "next";
import { StudioSubnav } from "@/components/studio/document-viewer/studio-subnav";
import { NoticeProvider } from "@/components/studio/shared/notice";
import { ViewerProvider } from "@/components/studio/shared/use-viewer";
import { studioPageTitle } from "@/lib/studio/contract/ui";
import "@/components/studio/shared/studio-tokens.css";

/*
 * Layout Studio (FIX-4a; UX-01 §2.3, §6.1-§6.4):
 * - judul seragam "<Halaman> · Studio · GSP Swarm HQ" (halaman memakai `studioPageTitle`);
 * - peran penonton dimuat sekali dan dibagikan (`ViewerProvider`);
 * - satu wilayah aria-live + notifikasi status per halaman (`NoticeProvider`);
 * - token lokal Studio di wadah `.studio-root`;
 * - satu-satunya pembungkus lebar/padding: halaman tidak membungkus ulang.
 * Boundary galat akar ada di `./error.tsx` (dirender di dalam layout ini).
 */
export const metadata: Metadata = {
  title: studioPageTitle("Beranda"),
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewerProvider>
      <NoticeProvider>
        <div className="studio-root mx-auto w-full max-w-6xl">
          <header className="mb-6 space-y-3">
            <div>
              <span className="eyebrow">Studio Dokumen</span>
              <p className="mt-1 text-[12.5px] text-[var(--text-2)]">Dokumen berstandar DATUM untuk misi HQ.</p>
            </div>
            <StudioSubnav />
            <div className="rule" />
          </header>
          {children}
        </div>
      </NoticeProvider>
    </ViewerProvider>
  );
}
