"use client";

/**
 * Daftar pengaturan pratinjau per kategori (D-627 "Preview pane grouping", tindak lanjut review C34 #16, D-650).
 *
 * Menampilkan pengaturan template yang dipakai pratinjau (nilai draf yang dikirim ke server) dikelompokkan lewat
 * `groupParamsByCategory` (satu pemetaan dengan editor, `groupByCategory`). Gaya sama dengan editor (D-633, D-637):
 * akordeon kategori satu-satunya navigasi (tanpa chip), label polos, deskripsi kategori satu baris, jumlah per
 * kategori, semua kategori tertutup pada awalnya (tenang). Kategori kecil tampil datar; kategori besar memakai
 * keterangan subkelompok (bukan judul bab). Baca saja: penyuntingan tetap di panel Pengaturan.
 */
import { useId, useMemo, useState, type ReactElement } from "react";
import { ChevronRight } from "lucide-react";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import { ReadonlyValue } from "@/components/studio/template-editor/param-control";
import { paramDisplayLabel } from "@/components/studio/template-editor/param-labels";
import { unitOf } from "@/components/studio/template-editor/values";
import { groupParamsByCategory, type ParamCategorySection } from "./param-tools";

/** Definisi registri yang punya nilai di `values` (urutan registri; kunci tak dikenal diabaikan). */
export function previewParamDefs(registry: readonly ParamDef[], values: Readonly<Record<string, ParamValue>>): ParamDef[] {
  return registry.filter((d) => Object.prototype.hasOwnProperty.call(values, d.key));
}

export interface PreviewParamGroupsProps {
  registry: readonly ParamDef[];
  /** Nilai pengaturan yang dipakai pratinjau (per kunci parameter). */
  values: Readonly<Record<string, ParamValue>>;
  /** Kategori yang terbuka sejak awal (bawaan: tidak ada). */
  initialOpen?: readonly string[];
}

export function PreviewParamGroups({ registry, values, initialOpen }: PreviewParamGroupsProps): ReactElement | null {
  const uid = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(initialOpen ?? []));
  const defs = useMemo(() => previewParamDefs(registry, values), [registry, values]);
  const sections: ParamCategorySection[] = useMemo(() => groupParamsByCategory(defs), [defs]);
  if (sections.length === 0) return null;

  const domId = (id: string, part: string) => `${uid}-${id.replace(/[^A-Za-z0-9_-]/g, "_")}-${part}`;
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="flex flex-col gap-2" data-preview-param-groups="">
      <p className="text-[12px] text-[var(--text-2)]">
        Pengaturan yang dipakai pratinjau: {defs.length} pengaturan, per kategori.
      </p>
      {sections.map((g) => {
        const isOpen = open.has(g.id);
        const titleId = domId(g.id, "title");
        const metaId = domId(g.id, "meta");
        const descId = domId(g.id, "desc");
        const panelId = domId(g.id, "panel");
        return (
          <section key={g.id} aria-labelledby={titleId} className="rounded-xl border border-[var(--line)]">
            <h3 className="m-0">
              <button
                type="button"
                className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)] motion-reduce:transition-none"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-labelledby={`${titleId} ${metaId}`}
                aria-describedby={descId}
                data-category={g.category.id}
                onClick={() => toggle(g.id)}
              >
                <ChevronRight
                  className={`mt-0.5 h-4 w-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? "rotate-90 text-[var(--accent)]" : "text-[var(--text-2)]"}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span id={titleId} className="block text-[13px] font-semibold text-[var(--text)]">
                    {g.category.label}
                  </span>
                  <span id={descId} className="mt-0.5 block text-[12px] font-normal leading-snug text-[var(--text-2)]">
                    {g.category.help}
                  </span>
                </span>
                <span id={metaId} className="shrink-0 pt-0.5 text-[12px] font-normal text-[var(--text-3)]">
                  {g.total} pengaturan
                </span>
              </button>
            </h3>
            <div id={panelId} hidden={!isOpen} className="border-t border-[var(--line)] px-2 py-2">
              {isOpen && (
                <div className="space-y-2">
                  {g.namespaces.map((ns) => (
                    <div key={ns.id} data-subgroup={ns.namespace}>
                      {!g.flat && <p className="px-2 pb-1 pt-1.5 text-[12px] font-medium text-[var(--text-2)]">{ns.label}</p>}
                      <ul className="divide-y divide-[var(--line)]">
                        {ns.params.map((d) => (
                          <li key={d.key} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 px-2 py-2">
                            <span className="min-w-0 text-[12.5px] text-[var(--text)]">{paramDisplayLabel(d.key, d.label, unitOf(d.type))}</span>
                            <span className="min-w-0 max-w-full text-[12.5px] text-[var(--text-2)]">
                              <ReadonlyValue def={d} value={values[d.key]} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
