"use client";

/*
 * Hook contoh kiriman Alat developer (SR-31; S86 R09, R15).
 *
 * - Contoh kurasi E1/E2/Lembar kendali (`examples-v2.ts`) diisi templat, misi,
 *   dan kunci dokumen dari panel (templat dari registri R01).
 * - "Minimal dari skema": JSON Schema diunduh dari registri R03
 *   (`kind=schema&schemaId=`), termasuk `$ref` eksternal (`common/v2`), lalu
 *   dibangkitkan `generateExample`. URL skema dibangun dari
 *   `STUDIO_SCHEMA_BASE_URL` kontrak (R15: tidak di-hardcode ulang).
 * - Skema di-cache per sesi halaman; rujukan di luar registri ditolak.
 */

import { useCallback, useRef, useState } from "react";
import { STUDIO_SCHEMA_BASE_URL } from "@/lib/studio/contract/env";
import { reportClientError } from "@/components/studio/shared/client-log";
import { isStudioApiError } from "@/components/studio/shared/http";
import { fetchSchema } from "./api";
import { externalRefs, generateExample, type JsonSchemaDoc } from "./example";
import { EXAMPLE_OPTIONS, curatedExample, type ExampleContext, type ExampleId, type ExampleOption } from "./examples-v2";
import { buildHints } from "./hints";
import { isRecord } from "./payload";
import { modeMeta, type JsonMode } from "./types";

/** Awalan `$id` skema registri, mis. `https://hq.gsp.local/studio/schema/`. */
export const SCHEMA_URL_PREFIX = `${STUDIO_SCHEMA_BASE_URL}/`;

export function schemaUrl(schemaId: string): string {
  return `${SCHEMA_URL_PREFIX}${schemaId}.json`;
}

/** `$id` -> schemaId registri; null bila di luar registri. */
export function schemaIdFromUrl(url: string): string | null {
  if (!url.startsWith(SCHEMA_URL_PREFIX)) return null;
  const id = url.slice(SCHEMA_URL_PREFIX.length).replace(/\.json$/, "");
  return /^[a-z0-9./-]+$/i.test(id) ? id : null;
}

/**
 * Lengkapi contoh minimal: skema SID02/SID03 mewajibkan `target` tak kosong
 * (minProperties 1) tanpa medan wajib, sehingga pembangkit menghasilkan `{}`.
 * Isi dengan target misi dari panel agar contoh lolos skema.
 */
export function finishMinimal(mode: JsonMode, value: unknown, ctx: ExampleContext): unknown {
  if (mode === "doc" || !isRecord(value)) return value;
  if (!isRecord(value.target) || Object.keys(value.target).length === 0) {
    return { ...value, target: { mission: { folder: ctx.missionFolder }, docKey: ctx.docKey } };
  }
  return value;
}

export interface SchemaExamples {
  options: (mode: JsonMode) => readonly ExampleOption[];
  /** Teks JSON rapi untuk contoh; null bila gagal (galat di `error`). */
  build: (mode: JsonMode, id: ExampleId, ctx: ExampleContext) => Promise<string | null>;
  busy: boolean;
  error: unknown;
  clearError: () => void;
}

export function useSchemaExamples(): SchemaExamples {
  const cache = useRef(new Map<string, JsonSchemaDoc>());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const loadSchemas = useCallback(async (rootUrl: string) => {
    const docs: Record<string, JsonSchemaDoc> = {};
    const queue = [rootUrl];
    while (queue.length > 0) {
      const url = queue.shift() as string;
      if (docs[url]) continue;
      let doc = cache.current.get(url);
      if (!doc) {
        const id = schemaIdFromUrl(url);
        if (!id) throw new Error(`Rujukan skema di luar registri: ${url}`);
        doc = await fetchSchema(id);
        cache.current.set(url, doc);
      }
      docs[url] = doc;
      queue.push(...externalRefs(doc));
    }
    return docs;
  }, []);

  const build = useCallback(
    async (mode: JsonMode, id: ExampleId, ctx: ExampleContext): Promise<string | null> => {
      setError(null);
      if (id !== "minimal") return JSON.stringify(curatedExample(id, ctx), null, 2) + "\n";
      const schemaId = modeMeta(mode).schemaId;
      if (!schemaId) return null;
      setBusy(true);
      try {
        const root = schemaUrl(schemaId);
        const docs = await loadSchemas(root);
        const value = finishMinimal(mode, generateExample(root, docs, buildHints(mode, ctx)), ctx);
        return JSON.stringify(value, null, 2) + "\n";
      } catch (e) {
        // Galat HTTP sudah dicatat `requestJson`; galat pembangkit dicatat di sini.
        if (!isStudioApiError(e)) reportClientError("studio.ui.playground.example", e, { mode, schemaId });
        setError(e);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [loadSchemas],
  );

  const options = useCallback((mode: JsonMode) => EXAMPLE_OPTIONS[mode], []);
  const clearError = useCallback(() => setError(null), []);
  return { options, build, busy, error, clearError };
}
