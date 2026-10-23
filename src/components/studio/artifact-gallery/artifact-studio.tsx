"use client";

/*
 * Galeri artefak Studio (S62; W10, FIX-4b): tiga tab — Galeri, Katalog jenis,
 * Buat. Tab tersimpan di URL (`?tab=galeri|katalog|buat`). Katalog grafik,
 * diagram, dan simbol dimuat sekali di sini (`useStudioQuery` bersama) lalu
 * dibagikan ke ketiga tab.
 *
 * Tab "Buat" tampil untuk SEMUA pengguna (keputusan user D-164 T-6, menyimpang
 * dari usulan W10 "ADMIN saja"); penegakan izin tetap di server (R09).
 */

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, LayoutGrid, PlusSquare, type LucideIcon } from "lucide-react";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import {
  getJson,
  registryUrl,
  type ChartRegistryResponse,
  type DiagramRegistryResponse,
  type SymbolRegistryResponse,
} from "./api";
import { ArtifactCatalog, type UseChoice } from "./catalog";
import { CreateArtifactPanel } from "./create-panel";
import { ArtifactGallery } from "./gallery";

type Tab = "galeri" | "katalog" | "buat";
const TABS: ReadonlyArray<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "galeri", label: "Galeri", icon: LayoutGrid },
  { id: "katalog", label: "Katalog jenis", icon: BookOpen },
  { id: "buat", label: "Buat artefak", icon: PlusSquare },
];

export function ArtifactStudio() {
  const router = useRouter();
  const pathname = usePathname() ?? "/studio/artifacts";
  const sp = useSearchParams();
  const raw = sp?.get("tab") ?? "";
  const tab: Tab = raw === "katalog" || raw === "buat" ? raw : "galeri";

  const chartsUrl = registryUrl("charts");
  const diagramUrl = registryUrl("diagram");
  const symbolsUrl = registryUrl("symbols");
  const charts = useStudioQuery<ChartRegistryResponse>(chartsUrl, (s) => getJson(chartsUrl, "catalog-charts", s), {
    source: "artifact-gallery.catalog-charts",
  });
  const diagrams = useStudioQuery<DiagramRegistryResponse>(diagramUrl, (s) => getJson(diagramUrl, "catalog-diagram", s), {
    source: "artifact-gallery.catalog-diagram",
  });
  const symbols = useStudioQuery<SymbolRegistryResponse>(symbolsUrl, (s) => getJson(symbolsUrl, "catalog-symbols", s), {
    source: "artifact-gallery.catalog-symbols",
  });

  const [choice, setChoice] = useState<{ value: UseChoice | null; nonce: number }>({ value: null, nonce: 0 });
  const [galleryVersion, setGalleryVersion] = useState(0);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ galeri: null, katalog: null, buat: null });

  const go = (t: Tab) => {
    // Pindah tab mempertahankan filter galeri di URL.
    const params = new URLSearchParams(sp?.toString() ?? "");
    params.set("tab", t);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = TABS.length;
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % n;
    else if (e.key === "ArrowLeft") next = (i - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    const t = TABS[next].id;
    tabRefs.current[t]?.focus();
    go(t);
  };

  const chartItems = charts.data?.items ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-[var(--text)]">Galeri artefak</h1>
        <p className="mt-1 text-[12.5px] text-[var(--text-2)]">
          Grafik, diagram, gambar, dan halaman web berstandar DATUM. Buka untuk pratinjau, unduh, atau buat yang baru dari contoh.
        </p>
      </div>

      <div role="tablist" aria-label="Bagian halaman artefak" className="flex flex-wrap gap-1 border-b border-[var(--line)]">
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`art-tab-${t.id}`}
              aria-selected={active}
              aria-controls={`art-panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => go(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                active ? "border-[var(--accent)] text-[var(--text)]" : "border-transparent text-[var(--text-2)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panel tetap terpasang (disembunyikan) agar suntingan isian tidak hilang saat pindah tab. */}
      <div role="tabpanel" id="art-panel-galeri" aria-labelledby="art-tab-galeri" hidden={tab !== "galeri"}>
        <ArtifactGallery key={galleryVersion} charts={chartItems} />
      </div>
      <div role="tabpanel" id="art-panel-katalog" aria-labelledby="art-tab-katalog" hidden={tab !== "katalog"}>
        <ArtifactCatalog
          charts={charts}
          diagrams={diagrams}
          symbols={symbols}
          onUse={(c) => {
            setChoice((prev) => ({ value: c, nonce: prev.nonce + 1 }));
            go("buat");
          }}
        />
      </div>
      <div role="tabpanel" id="art-panel-buat" aria-labelledby="art-tab-buat" hidden={tab !== "buat"}>
        <CreateArtifactPanel key={choice.nonce} charts={chartItems} initial={choice.value} onCreated={() => setGalleryVersion((v) => v + 1)} />
      </div>
    </div>
  );
}
