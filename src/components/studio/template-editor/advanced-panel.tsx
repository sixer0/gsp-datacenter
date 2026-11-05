"use client";

/**
 * Alat ADMIN editor templat (UX-01 §3a, W3; D-163 T-1 "lanjutan HANYA ADMIN"):
 * - `AdvancedSettingsPanel`: panel terlipat "Pengaturan lanjutan" berisi kunci
 *   lapis `advanced` registri, dengan pencarian. Kunci teknis boleh tampil di
 *   sini sebagai teks sekunder.
 * - `PresetModeEditor`: mode gaya (templat `isPreset`) — editor lengkap seluruh
 *   kunci + format teks per peran.
 * Komponen ini hanya dirender pemanggil untuk ADMIN; server tetap menegakkan
 * (403 `PARAM_SURFACE_FORBIDDEN`, `PRESET_READONLY`).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { RoleKey } from "@/lib/studio/contract/enums";
import type { RoleFormat, RoleFormatMap } from "@/lib/studio/contract/engine";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { ParamDef } from "@/lib/studio/contract/types/params";
import { Skeleton } from "@/components/ui/kit";
import { ErrorView } from "@/components/studio/shared/error-view";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { getParamRegistry, getRoleLabels } from "./api";
import { ParamEditor } from "./param-editor";
import { draftErrors } from "./param-rules";
import { RoleFormatsEditor } from "./role-formats-editor";
import { omitKey } from "./model";
import type { ParamRecord } from "./values";

const fetchParams = (signal: AbortSignal) => getParamRegistry(signal);
const fetchRoles = (signal: AbortSignal) => getRoleLabels(signal);

function useLayerEditor(registry: readonly ParamDef[] | undefined, draft: ParamRecord, loaded: ParamRecord, onChange: (next: ParamRecord) => void, onErrors: (n: number) => void) {
  const defs = useMemo(() => new Map((registry ?? []).map((d) => [d.key, d])), [registry]);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [controlEpoch, setControlEpoch] = useState<Record<string, number>>({});
  const validation = useMemo(() => (registry ? draftErrors(defs, draft, loaded, true, undefined) : {}), [registry, defs, draft, loaded]);
  const errors = useMemo(() => ({ ...validation, ...localErrors }), [validation, localErrors]);
  const count = Object.keys(errors).length;
  useEffect(() => onErrors(count), [count, onErrors]);

  const onSet = useCallback(
    (key: string, v: ParamValue) => {
      setLocalErrors((prev) => omitKey(prev, key));
      onChange({ ...draft, [key]: v });
    },
    [draft, onChange],
  );
  const onReset = useCallback(
    (key: string) => {
      setLocalErrors((prev) => omitKey(prev, key));
      setControlEpoch((e) => ({ ...e, [key]: (e[key] ?? 0) + 1 }));
      onChange(omitKey(draft, key));
    },
    [draft, onChange],
  );
  const onInvalid = useCallback((key: string, message: string | null) => {
    setLocalErrors((prev) => {
      if (message === null) {
        return key in prev ? omitKey(prev, key) : prev;
      }
      return prev[key] === message ? prev : { ...prev, [key]: message };
    });
  }, []);
  return { errors, controlEpoch, onSet, onReset, onInvalid };
}

interface LayerProps {
  draft: ParamRecord;
  loaded: ParamRecord;
  /** Nilai bawaan gaya per kunci. */
  parentValues: ParamRecord;
  parentLabel: string;
  /** Nilai efektif versi yang dimuat (kunci terhitung). */
  computed: ParamRecord;
  onChange: (next: ParamRecord) => void;
  onErrors: (count: number) => void;
  readOnly: boolean;
  refFilter?: readonly string[];
}

export function AdvancedSettingsPanel(p: LayerProps) {
  const [open, setOpen] = useState(() => (p.refFilter?.length ?? 0) > 0);
  const q = useStudioQuery(open ? "template-editor:params" : null, fetchParams, { source: "template-editor.params" });
  const advanced = useMemo(() => (q.data ?? []).filter((d) => d.surface === "advanced"), [q.data]);
  const ed = useLayerEditor(q.data, p.draft, p.loaded, p.onChange, p.onErrors);
  const changed = Object.keys(p.draft).length;

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="group rounded-[12px] border border-[var(--line)] bg-[var(--surface-1)]"
    >
      <summary className="flex cursor-pointer select-none flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] px-4 py-3 text-[13px] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
        <ChevronRight className="h-4 w-4 text-[var(--text-2)] transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none" strokeWidth={2} aria-hidden />
        <span className="font-medium">Pengaturan lanjutan</span>
        <span className="text-[12px] text-[var(--text-2)]">
          khusus admin
          {q.data ? ` · ${advanced.length.toLocaleString("id-ID")} pengaturan` : ""}
          {changed > 0 ? ` · ${changed.toLocaleString("id-ID")} diubah di templat ini` : ""}
        </span>
      </summary>
      <div className="border-t border-[var(--line)] px-3 pb-3 pt-2">
        {q.error && !q.data ? (
          <ErrorView variant="inline" error={q.error} title="Daftar pengaturan lanjutan tidak dapat dimuat" onRetry={() => q.retry()} cooldown={q.cooldown} />
        ) : !q.data ? (
          <div aria-busy="true" className="space-y-2 py-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <ParamEditor
            registry={advanced}
            parentValues={p.parentValues}
            parentLabel={p.parentLabel}
            loaded={p.loaded}
            computed={p.computed}
            draft={p.draft}
            errors={ed.errors}
            isAdmin={!p.readOnly}
            tier={undefined}
            controlEpoch={ed.controlEpoch}
            onSet={p.readOnly ? () => {} : ed.onSet}
            onReset={p.readOnly ? () => {} : ed.onReset}
            onInvalid={ed.onInvalid}
            refFilter={p.refFilter}
          />
        )}
      </div>
    </details>
  );
}

export interface PresetModeProps extends LayerProps {
  roleFormatsLoaded: RoleFormatMap;
  roleFormatsDraft: RoleFormatMap;
  onRoleFormatsChange: (next: RoleFormatMap) => void;
}

/** Mode gaya ADMIN: seluruh kunci registri dalam satu lapis datar + format teks per peran. */
export function PresetModeEditor(p: PresetModeProps) {
  const q = useStudioQuery("template-editor:params", fetchParams, { source: "template-editor.params" });
  const roles = useStudioQuery("template-editor:roles", fetchRoles, { source: "template-editor.roles" });
  const ed = useLayerEditor(q.data, p.draft, p.loaded, p.onChange, p.onErrors);
  const [roleErrors, setRoleErrors] = useState<Record<string, string>>({});
  const [roleEpoch] = useState(0);

  if (q.error && !q.data) {
    return <ErrorView error={q.error} title="Daftar pengaturan gaya tidak dapat dimuat" onRetry={() => q.retry()} cooldown={q.cooldown} />;
  }
  if (!q.data) {
    return (
      <div aria-busy="true" className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <ParamEditor
        registry={q.data}
        parentValues={p.parentValues}
        parentLabel={p.parentLabel}
        loaded={p.loaded}
        computed={p.computed}
        draft={p.draft}
        errors={ed.errors}
        isAdmin={!p.readOnly}
        tier={undefined}
        controlEpoch={ed.controlEpoch}
        onSet={p.readOnly ? () => {} : ed.onSet}
        onReset={p.readOnly ? () => {} : ed.onReset}
        onInvalid={ed.onInvalid}
        refFilter={p.refFilter}
        headingLevel={2}
      />
      <details className="group rounded-[12px] border border-[var(--line)] bg-[var(--surface-1)]">
        <summary className="flex cursor-pointer select-none items-center gap-2 rounded-[12px] px-4 py-3 text-[13px] font-medium text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
          <ChevronRight className="h-4 w-4 text-[var(--text-2)] transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none" strokeWidth={2} aria-hidden />
          Format teks per peran
        </summary>
        <div className="border-t border-[var(--line)] p-3">
          <RoleFormatsEditor
            loaded={p.roleFormatsLoaded}
            draft={p.roleFormatsDraft}
            roleLabels={roles.data ?? {}}
            disabled={p.readOnly}
            onChange={(role: RoleKey, fmt: RoleFormat | undefined) => {
              const next = { ...p.roleFormatsDraft } as Record<string, RoleFormat>;
              if (fmt) next[role] = fmt;
              else delete next[role];
              p.onRoleFormatsChange(next as RoleFormatMap);
            }}
            onInvalid={(id, message) =>
              setRoleErrors((prev) => {
                if (message === null) return omitKey(prev, id);
                return { ...prev, [id]: message };
              })
            }
            onClearErrors={(prefix) => setRoleErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(prefix))))}
            errors={roleErrors}
            epoch={roleEpoch}
          />
        </div>
      </details>
    </div>
  );
}
