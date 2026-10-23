"use client";

/*
 * Kontrol Alat developer (SR-31; UX-01 W11): pemilih mode (pil radio dengan
 * fokus terlihat, pola `has-[:focus-visible]` S86 R12) dan panel Pengiriman
 * (templat dari registri R01, misi, kunci dokumen, target, tingkat terbitan,
 * agen, buat berkas). Isian kosong = ikuti JSON.
 */

import { STUDIO_TIERS } from "@/lib/studio/contract/enums";
import type { TemplateSummary } from "@/lib/studio/contract/types/api";
import { Panel } from "@/components/ui/kit";
import { ErrorView } from "@/components/studio/shared/error-view";
import { TIER_HINT, TIER_LABEL } from "@/components/studio/shared/labels";
import type { StudioQueryResult } from "@/components/studio/shared/use-studio-query";
import type { OverrideErrors } from "./payload";
import { MODES, RENDER_FORMATS, type PlaygroundMode, type PlaygroundOverrides } from "./types";

const FIELD =
  "w-full rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--surface-1)] px-2.5 py-2 text-[13px] text-[var(--text)] focus:border-[var(--line-strong)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]";

export function ModeSwitch({ mode, onChange }: { mode: PlaygroundMode; onChange: (m: PlaygroundMode) => void }) {
  return (
    <fieldset>
      <legend className="sr-only">Mode kiriman</legend>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => {
          const active = m.mode === mode;
          return (
            <label
              key={m.mode}
              className={`cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
                active
                  ? "border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--text)]"
                  : "border-[var(--line)] text-[var(--text-2)] hover:bg-[var(--surface-1)] hover:text-[var(--text)]"
              }`}
            >
              <input type="radio" name="pg-mode" value={m.mode} checked={active} onChange={() => onChange(m.mode)} className="sr-only" />
              {m.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} className="mt-1 text-[11.5px] text-[var(--down)]">
      {text}
    </p>
  );
}

export function SubmissionPanel({
  mode,
  overrides,
  onChange,
  errors,
  templatesQ,
}: {
  mode: Exclude<PlaygroundMode, "asset">;
  overrides: PlaygroundOverrides;
  onChange: (next: PlaygroundOverrides) => void;
  errors: OverrideErrors;
  templatesQ: StudioQueryResult<{ templates: TemplateSummary[] }>;
}) {
  const set = <K extends keyof PlaygroundOverrides>(k: K, v: PlaygroundOverrides[K]) => onChange({ ...overrides, [k]: v });
  const templates = (templatesQ.data?.templates ?? []).filter((t) => t.kind === "DOCUMENT" && !t.archived);
  const byId = mode !== "doc" && overrides.documentId.trim() !== "";
  return (
    <Panel className="h-fit space-y-4 p-4">
      <div>
        <h2 className="text-[12.5px] font-semibold text-[var(--text-2)]">Pengiriman</h2>
        <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-2)]">Isian di sini menimpa medan JSON terkait; kosong = ikuti JSON.</p>
      </div>

      {templatesQ.error && !templatesQ.data ? (
        <ErrorView variant="inline" error={templatesQ.error} title="Daftar templat tidak dapat dimuat" onRetry={() => templatesQ.retry()} cooldown={templatesQ.cooldown} />
      ) : null}
      <div>
        <label htmlFor="pg-template" className="mb-1 block text-[12px] text-[var(--text-2)]">
          Templat
        </label>
        <select
          id="pg-template"
          value={overrides.templateSlug}
          onChange={(e) => set("templateSlug", e.target.value)}
          className={FIELD}
          disabled={templatesQ.isLoading}
        >
          <option value="">Ikuti JSON</option>
          {templates.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name} ({t.slug}){t.isCanonical ? " · kanonik" : ""}
            </option>
          ))}
        </select>
      </div>

      {mode !== "doc" && (
        <div>
          <label htmlFor="pg-docid" className="mb-1 block text-[12px] text-[var(--text-2)]">
            Id dokumen tujuan (opsional)
          </label>
          <input
            id="pg-docid"
            value={overrides.documentId}
            onChange={(e) => set("documentId", e.target.value)}
            aria-invalid={!!errors.documentId}
            aria-describedby={errors.documentId ? "pg-docid-err" : "pg-docid-hint"}
            className={FIELD}
            maxLength={64}
          />
          {errors.documentId ? (
            <FieldError id="pg-docid-err" text={errors.documentId} />
          ) : (
            <p id="pg-docid-hint" className="mt-1 text-[11.5px] text-[var(--text-2)]">
              Diisi = target lewat id dokumen; misi dan kunci dokumen diabaikan.
            </p>
          )}
        </div>
      )}

      <fieldset className="space-y-2" disabled={byId}>
        <legend className="mb-1 text-[12px] text-[var(--text-2)]">Misi</legend>
        <div>
          <label htmlFor="pg-folder" className="mb-1 block text-[11.5px] text-[var(--text-2)]">
            Folder misi
          </label>
          <input
            id="pg-folder"
            value={overrides.missionFolder}
            onChange={(e) => set("missionFolder", e.target.value)}
            placeholder="2026-10-23_nama-misi"
            aria-invalid={!!errors.missionFolder}
            aria-describedby={errors.missionFolder ? "pg-folder-err" : undefined}
            className={`${FIELD} ${errors.missionFolder ? "border-[var(--down)]" : ""}`}
          />
          <FieldError id="pg-folder-err" text={errors.missionFolder} />
        </div>
        <div>
          <label htmlFor="pg-dockey" className="mb-1 block text-[11.5px] text-[var(--text-2)]">
            Kunci dokumen (docKey)
          </label>
          <input
            id="pg-dockey"
            value={overrides.docKey}
            onChange={(e) => set("docKey", e.target.value)}
            placeholder="laporan-survei"
            maxLength={64}
            aria-invalid={!!errors.docKey}
            aria-describedby={errors.docKey ? "pg-dockey-err" : undefined}
            className={`${FIELD} ${errors.docKey ? "border-[var(--down)]" : ""}`}
          />
          <FieldError id="pg-dockey-err" text={errors.docKey} />
        </div>
      </fieldset>

      {mode === "doc" && (
        <div>
          <label htmlFor="pg-tier" className="mb-1 block text-[12px] text-[var(--text-2)]">
            Tingkat terbitan
          </label>
          <select id="pg-tier" value={overrides.tier} onChange={(e) => set("tier", e.target.value)} className={FIELD}>
            <option value="">Ikuti JSON</option>
            {STUDIO_TIERS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]} ({TIER_HINT[t].toLowerCase()})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="pg-agent" className="mb-1 block text-[12px] text-[var(--text-2)]">
          Id agen pengirim (opsional)
        </label>
        <input
          id="pg-agent"
          value={overrides.agentId}
          onChange={(e) => set("agentId", e.target.value)}
          maxLength={80}
          placeholder="mis. alat-developer"
          className={FIELD}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-[12px] text-[var(--text-2)]">Buat berkas</legend>
        <label className="inline-flex items-center gap-2 text-[12.5px] text-[var(--text-2)]">
          <input type="checkbox" checked={overrides.render} onChange={(e) => set("render", e.target.checked)} />
          {mode === "doc" ? "Buat berkas lengkap setelah kirim" : mode === "chapter" ? "Buat draf bab setelah kirim" : "Buat draf bagian setelah kirim"}
        </label>
        {overrides.render && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pl-6 text-[12.5px] text-[var(--text-2)]">
            {RENDER_FORMATS.map((f) => (
              <label key={f} className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={overrides.formats.includes(f)}
                  onChange={() =>
                    set("formats", overrides.formats.includes(f) ? overrides.formats.filter((x) => x !== f) : [...overrides.formats, f])
                  }
                />
                {f === "docx" ? "Word" : f.toUpperCase()}
              </label>
            ))}
          </div>
        )}
        <FieldError id="pg-formats-err" text={errors.formats} />
      </fieldset>
    </Panel>
  );
}
