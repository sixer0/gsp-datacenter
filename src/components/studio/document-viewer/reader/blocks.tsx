"use client";

/*
 * Tampilan sederhana blok v2 di Lembar baca (SR-30; UX-01 §3c "Baca", T-13).
 *
 * Lembar baca adalah tampilan TINJAU, bukan replika piksel: penanda makna
 * (tebal, miring, kode, superskrip, subskrip) dirender; ukuran, huruf, dan
 * tata letak milik templat (D-139). Tabel tampil sebagai tabel sederhana;
 * tabel kompleks, grafik, diagram, gambar, dan lembar simbol menjadi kartu
 * netral dengan label nomor + keterangan + sumber dan ajakan "Lihat di PDF".
 */
import { Fragment, type ReactNode } from "react";
import { BarChart3, Image as ImageIcon, Network, Shapes, Table2 } from "lucide-react";
import type { BlockV2, InlineV2 } from "@/lib/studio/contract";
import { TABLE_BLOCK_TYPES } from "@/lib/studio/contract/enums";
import { sectionTypeLabel } from "@/components/studio/shared/labels";
import { displayRuns, inlinePlain } from "../doc-model";

const TABLE_TYPES: ReadonlySet<string> = new Set(TABLE_BLOCK_TYPES);

export function InlineText({ value }: { value: InlineV2 | null | undefined }) {
  const runs = displayRuns(value);
  return (
    <>
      {runs.map((r, i) => {
        if (r.br) return <br key={i} />;
        if (r.tab) return <span key={i} className="inline-block w-6" aria-hidden />;
        let node: ReactNode = r.t;
        if (r.code) node = <code className="rounded-[3px] bg-[color-mix(in_srgb,var(--studio-ink)_8%,transparent)] px-1 font-mono text-[0.92em]">{node}</code>;
        if (r.sup) node = <sup>{node}</sup>;
        if (r.sub) node = <sub>{node}</sub>;
        if (r.em) node = <em>{node}</em>;
        if (r.strong) node = <strong className="font-semibold">{node}</strong>;
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

function SourceLine({ value }: { value: InlineV2 | null | undefined }) {
  if (!value || !inlinePlain(value).trim()) return null;
  return (
    <p className="mt-1 text-[11.5px] uppercase tracking-[0.04em] text-[var(--studio-ink-2)]">
      Sumber: <span className="normal-case tracking-normal">{<InlineText value={value} />}</span>
    </p>
  );
}

function Caption({ label, value }: { label?: string; value: InlineV2 | null | undefined }) {
  if (!label && !value) return null;
  return (
    <p className="mt-2 text-[13px] text-[var(--studio-ink)]">
      {label && <span className="mr-2 font-semibold">{label}</span>}
      <InlineText value={value} />
    </p>
  );
}

const ASIDE_LABEL: Record<string, string> = {
  generic: "Catatan",
  doctrine: "Prinsip",
  story: "Kisah",
  quickCheck: "Cek cepat",
  ifInDoubt: "Bila ragu",
};

const FIGURE_ICON: Record<string, typeof ImageIcon> = { image: ImageIcon, chart: BarChart3, diagram: Network, symbolSheet: Shapes };

export interface BlockViewProps {
  block: BlockV2;
  /** "Gambar 3.1", "Tabel 3.1" dari mesin (R05). */
  artifactLabel?: string;
  /** Buka PDF terbaru; tanpa ini kartu menyarankan membuat berkas. */
  onOpenPdf?: () => void;
}

function PdfHint({ onOpenPdf, what }: { onOpenPdf?: () => void; what: string }) {
  if (onOpenPdf) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenPdf();
        }}
        className="text-[12px] font-medium text-[var(--studio-ink)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        Lihat {what} di PDF
      </button>
    );
  }
  return <span className="text-[12px] text-[var(--studio-ink-2)]">Tampilan lengkap tersedia setelah berkas dibuat.</span>;
}

function FigureCard({ block, artifactLabel, onOpenPdf }: BlockViewProps) {
  const Icon = FIGURE_ICON[block.type] ?? ImageIcon;
  const b = block as { caption?: InlineV2; source?: InlineV2 };
  return (
    <figure className="my-4">
      <div className="flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-[color-mix(in_srgb,var(--studio-ink)_25%,transparent)] bg-[color-mix(in_srgb,var(--studio-ink)_4%,transparent)] px-4 py-5 text-center">
        <Icon className="h-6 w-6 text-[var(--studio-ink-2)]" strokeWidth={2} aria-hidden />
        <span className="text-[12.5px] text-[var(--studio-ink-2)]">{sectionTypeLabel(block.type)}</span>
        <PdfHint onOpenPdf={onOpenPdf} what="gambar" />
      </div>
      <figcaption>
        <Caption label={artifactLabel} value={b.caption} />
        <SourceLine value={b.source} />
      </figcaption>
    </figure>
  );
}

type TableBlock = Extract<BlockV2, { rows: unknown }>;

function isComplexTable(t: TableBlock): boolean {
  if (t.columns.length > 8) return true;
  return t.rows.some((r) => r.cells.some((c) => !!c.nested || (c.paragraphs?.length ?? 0) > 3));
}

function cellContent(c: TableBlock["rows"][number]["cells"][number]): ReactNode {
  if (c.paragraphs?.length) {
    return c.paragraphs.map((p, i) => (
      <span key={i} className="block">
        <InlineText value={p} />
      </span>
    ));
  }
  if (c.runs) return <InlineText value={{ runs: c.runs }} />;
  if (typeof c.text === "string") return <InlineText value={{ text: c.text }} />;
  return null;
}

function SimpleTable({ block, artifactLabel, onOpenPdf }: BlockViewProps) {
  const t = block as TableBlock;
  if (isComplexTable(t)) {
    return (
      <figure className="my-4">
        <div className="flex items-center gap-3 rounded-[6px] border border-[color-mix(in_srgb,var(--studio-ink)_18%,transparent)] px-4 py-3">
          <Table2 className="h-5 w-5 shrink-0 text-[var(--studio-ink-2)]" strokeWidth={2} aria-hidden />
          <div className="min-w-0 space-y-0.5">
            <p className="text-[13px] font-medium">{sectionTypeLabel(block.type)}</p>
            <PdfHint onOpenPdf={onOpenPdf} what="tabel lengkap" />
          </div>
        </div>
        <figcaption>
          <Caption label={artifactLabel} value={t.caption} />
          <SourceLine value={t.source} />
        </figcaption>
      </figure>
    );
  }
  return (
    <figure className="my-4">
      {(artifactLabel || t.caption) && <Caption label={artifactLabel} value={t.caption} />}
      <div className="mt-1.5 overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <tbody>
            {t.rows.map((r, ri) => {
              const header = r.kind === "header";
              return (
                <tr
                  key={ri}
                  className={
                    header
                      ? "bg-[color-mix(in_srgb,var(--studio-ink)_8%,transparent)] font-semibold"
                      : r.kind === "total"
                        ? "font-semibold"
                        : r.kind === "group"
                          ? "bg-[color-mix(in_srgb,var(--studio-ink)_4%,transparent)]"
                          : ""
                  }
                >
                  {r.cells.map((c, ci) => {
                    if (c.vMerge === "continue") return null;
                    const Tag = header ? "th" : "td";
                    return (
                      <Tag
                        key={ci}
                        colSpan={c.gridSpan && c.gridSpan > 1 ? c.gridSpan : undefined}
                        scope={header ? "col" : undefined}
                        className="border border-[color-mix(in_srgb,var(--studio-ink)_18%,transparent)] px-2 py-1 text-left align-top"
                      >
                        {cellContent(c)}
                      </Tag>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SourceLine value={t.source} />
    </figure>
  );
}

/** Satu blok v2 sebagai tampilan dokumen. */
export function BlockView(props: BlockViewProps) {
  const { block } = props;
  switch (block.type) {
    case "paragraph":
      return (
        <div>
          <p className={block.role === "subheading" ? "font-semibold" : block.role === "lede" ? "text-[15px]" : undefined}>
            <InlineText value={block} />
          </p>
          {block.rail?.map((r, i) =>
            r.text || r.runs ? (
              <p key={i} className="mt-0.5 text-[11.5px] text-[var(--studio-ink-2)]">
                <InlineText value={r.runs ? { runs: r.runs } : { text: r.text ?? "" }} />
              </p>
            ) : null,
          )}
        </div>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-1 pl-6`}>
          {block.items.map((it, i) => (
            <li key={i}>
              <InlineText value={it} />
            </li>
          ))}
        </Tag>
      );
    }
    case "aside":
      return (
        <aside className="my-2 border-l-[3px] border-[color-mix(in_srgb,var(--studio-ink)_35%,transparent)] pl-3">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[var(--studio-ink-2)]">
            {block.label ? <InlineText value={block.label} /> : ASIDE_LABEL[block.variant] ?? "Catatan"}
          </p>
          {block.body.map((b, i) => (
            <p key={i} className="mt-1">
              <InlineText value={b} />
            </p>
          ))}
        </aside>
      );
    case "monoBlock":
      return (
        <div className="my-2">
          <p className="text-[12px] font-semibold text-[var(--studio-ink-2)]">
            <InlineText value={block.label} />
          </p>
          <pre className="mt-1 overflow-x-auto rounded-[4px] bg-[color-mix(in_srgb,var(--studio-ink)_6%,transparent)] px-3 py-2 font-mono text-[12px] leading-relaxed">
            {block.lines.map((l) => inlinePlain(l)).join("\n")}
          </pre>
        </div>
      );
    case "assumptionInline":
      return (
        <p>
          <span className="mr-1.5 rounded-[3px] border border-[color-mix(in_srgb,var(--studio-ink)_25%,transparent)] px-1 text-[11px] font-semibold uppercase tracking-[0.04em]">Asumsi</span>
          <InlineText value={block} />
        </p>
      );
    case "derivation":
      return (
        <div className="my-3 rounded-[6px] border border-[color-mix(in_srgb,var(--studio-ink)_18%,transparent)] px-3 py-2">
          <p className="font-semibold">
            {props.artifactLabel && <span className="mr-2">{props.artifactLabel}</span>}
            <InlineText value={block.title} />
          </p>
          {block.intro && (
            <p className="mt-1">
              <InlineText value={block.intro} />
            </p>
          )}
          <dl className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 text-[12.5px]">
            {block.lines.map((l, i) => (
              <Fragment key={i}>
                <dt>
                  <InlineText value={l.label} />
                </dt>
                <dd className="text-right">{l.value && "registerKey" in l.value ? "nilai dari data acuan" : <InlineText value={l.value as InlineV2 | undefined} />}</dd>
              </Fragment>
            ))}
          </dl>
          <p className="mt-1.5">
            <InlineText value={block.closing} />
          </p>
        </div>
      );
    case "image":
    case "chart":
    case "diagram":
    case "symbolSheet":
      return <FigureCard {...props} />;
    default:
      if (TABLE_TYPES.has(block.type)) return <SimpleTable {...props} />;
      return (
        <p className="text-[12.5px] text-[var(--studio-ink-2)]">
          {sectionTypeLabel((block as { type: string }).type)}: <PdfHint onOpenPdf={props.onOpenPdf} what="isi ini" />
        </p>
      );
  }
}
