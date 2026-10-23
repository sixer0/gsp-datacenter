import type { Metadata } from "next";
import { TemplateEditor, type EditorStep } from "@/components/studio/template-editor";
import { studioPageTitle } from "@/lib/studio/contract/ui";

export const metadata: Metadata = { title: studioPageTitle("Editor templat") };

const PARAM_FILTER_MAX = 50;
const PARAM_REF_MAX = 120;
const STEPS: readonly EditorStep[] = ["gaya", "pengaturan", "simpan"];

/** `?paramFilter=a,b` (tautan S59) -> rujukan unik terpangkas, dibatasi jumlah dan panjangnya. */
function parseParamFilter(raw: string | string[] | undefined): string[] {
  const joined = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const out: string[] = [];
  for (const part of joined.split(",")) {
    const r = part.trim();
    if (!r || r.length > PARAM_REF_MAX || out.includes(r)) continue;
    out.push(r);
    if (out.length >= PARAM_FILTER_MAX) break;
  }
  return out;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * /studio/templates/[id]?langkah=gaya|pengaturan|simpan&version=n&paramFilter=<rujukan,...>
 * — editor templat berlangkah (SR-29; UX-01 §3a, W3). Bawaan langkah = Pengaturan.
 * `paramFilter` membuka Pengaturan lanjutan (ADMIN) dengan saringan (IP-23).
 */
export default async function StudioTemplateEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string | string[]; paramFilter?: string | string[]; langkah?: string | string[] }>;
}) {
  const { id } = await params;
  const { version, paramFilter, langkah } = await searchParams;
  const raw = first(version);
  const versionNo = raw && /^[1-9][0-9]{0,8}$/.test(raw) ? Number(raw) : undefined;
  const stepRaw = first(langkah);
  const step: EditorStep = STEPS.includes(stepRaw as EditorStep) ? (stepRaw as EditorStep) : "pengaturan";
  return <TemplateEditor templateId={id} versionNo={versionNo} step={step} paramFilter={parseParamFilter(paramFilter)} />;
}
