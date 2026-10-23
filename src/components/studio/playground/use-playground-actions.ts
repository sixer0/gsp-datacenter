"use client";

/*
 * Hook aksi Alat developer (SR-31; S86 R09): Validasi (R08 dry-run), Kirim
 * ke Studio (R04/R12/R13, kiriman nyata setelah konfirmasi K-10 di layar),
 * dan Unggah aset (R18).
 *
 * - Badan = isi editor + isian panel (`applyOverrides`).
 * - Galat jaringan/5xx/429 mempersenjatai `useCooldown` bersama per aksi
 *   (jeda 3/6/12 s, maks 3 percobaan ulang, hormati Retry-After); galat lain
 *   tidak memakai jeda. Semua galat HTTP sudah dicatat `requestJson`.
 * - Isu validasi (`ValidationIssue[]`) dari R08 atau dari `details` 400
 *   `SCHEMA_INVALID` disimpan untuk dipetakan ke baris editor.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { STUDIO_MAX_ASSET_BYTES, STUDIO_MAX_JSON_BYTES } from "@/lib/studio/contract/env";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import { isAbortError, isStudioApiError } from "@/components/studio/shared/http";
import { formatBytes } from "@/components/studio/shared/labels";
import { useCooldown, type CooldownState } from "@/components/studio/shared/use-cooldown";
import { submitV2, uploadAsset, validateSubmission, validationIssuesOf } from "./api";
import { parseEditorJson, type JsonSyntaxError } from "./json-locate";
import { applyOverrides, hasOverrideErrors, overrideErrors, utf8Length } from "./payload";
import {
  modeMeta,
  type AssetUploadResult,
  type JsonMode,
  type PlaygroundOverrides,
  type SubmitResultV2,
  type ValidateResultV2,
} from "./types";

export type PlaygroundAction = "validate" | "submit" | "asset";

export interface ActionFailure {
  action: PlaygroundAction;
  /** `StudioApiError` (dari server/jaringan) atau galat lokal `{ code, message }`. */
  error: unknown;
  /** Kalimat lokal bila galat bukan dari server (ukuran, jenis berkas, isian panel). */
  localMessage?: string;
}

export interface IssueSet {
  mode: JsonMode;
  title: string;
  items: ValidationIssue[];
}

/** Penjaga satu aksi: jeda bersama + status "gagal sementara". */
interface Guard {
  cooldown: CooldownState;
  /** `true` bila aksi boleh jalan sekarang (memakai satu percobaan ulang bila perlu). */
  begin: () => boolean;
  succeed: () => void;
  fail: (err: unknown) => void;
}

function useGuard(): Guard {
  const cooldown = useCooldown();
  const failed = useRef(false);
  const { arm, holdFor, reset, trigger, secondsLeft, exhausted } = cooldown;
  const begin = useCallback(() => {
    if (secondsLeft > 0 || exhausted) return false;
    return failed.current ? trigger() : true;
  }, [secondsLeft, exhausted, trigger]);
  const succeed = useCallback(() => {
    failed.current = false;
    reset();
  }, [reset]);
  const fail = useCallback(
    (err: unknown) => {
      if (isStudioApiError(err) && err.retryable) {
        failed.current = true;
        arm();
        if (err.retryAfterSec) holdFor(err.retryAfterSec);
      } else {
        failed.current = false;
        reset();
      }
    },
    [arm, holdFor, reset],
  );
  return { cooldown, begin, succeed, fail };
}

export interface PreparedSubmission {
  mode: JsonMode;
  body: unknown;
}

export interface PlaygroundActions {
  busy: PlaygroundAction | null;
  validation: { result: ValidateResultV2; text: string; mode: JsonMode } | null;
  submitResult: { result: SubmitResultV2; mode: JsonMode } | null;
  assetResult: AssetUploadResult | null;
  issues: IssueSet | null;
  syntaxError: JsonSyntaxError | null;
  failure: ActionFailure | null;
  cooldowns: Record<PlaygroundAction, CooldownState>;
  /** Urai editor + panel; null bila ada galat (ditampilkan). */
  prepare: (mode: JsonMode, text: string, overrides: PlaygroundOverrides, action: "validate" | "submit") => PreparedSubmission | null;
  validate: (mode: JsonMode, text: string, overrides: PlaygroundOverrides, preview: boolean) => Promise<ValidateResultV2 | null>;
  submit: (prepared: PreparedSubmission) => Promise<SubmitResultV2 | null>;
  upload: (file: File, missionFolder: string) => Promise<AssetUploadResult | null>;
  clearSyntaxError: () => void;
  clearIssues: () => void;
}

export function usePlaygroundActions(opts: { onSyntaxError?: (e: JsonSyntaxError) => void } = {}): PlaygroundActions {
  const onSyntaxErrorRef = useRef(opts.onSyntaxError);
  useEffect(() => {
    onSyntaxErrorRef.current = opts.onSyntaxError;
  }, [opts.onSyntaxError]);
  const [busy, setBusy] = useState<PlaygroundAction | null>(null);
  const [validation, setValidation] = useState<PlaygroundActions["validation"]>(null);
  const [submitResult, setSubmitResult] = useState<PlaygroundActions["submitResult"]>(null);
  const [assetResult, setAssetResult] = useState<AssetUploadResult | null>(null);
  const [issues, setIssues] = useState<IssueSet | null>(null);
  const [syntaxError, setSyntaxError] = useState<JsonSyntaxError | null>(null);
  const [failure, setFailure] = useState<ActionFailure | null>(null);
  const validateGuard = useGuard();
  const submitGuard = useGuard();
  const assetGuard = useGuard();

  const localFail = useCallback((action: PlaygroundAction, code: string, message: string) => {
    setFailure({ action, error: { code, status: 0 }, localMessage: message });
  }, []);

  const prepare = useCallback<PlaygroundActions["prepare"]>(
    (mode, text, overrides, action) => {
      setFailure(null);
      const bytes = utf8Length(text);
      if (bytes > STUDIO_MAX_JSON_BYTES) {
        localFail(action, "PAYLOAD_TOO_LARGE", `JSON ${formatBytes(bytes)} melebihi batas ${formatBytes(STUDIO_MAX_JSON_BYTES)}.`);
        return null;
      }
      if (hasOverrideErrors(overrideErrors(mode, overrides))) {
        localFail(action, "OVERRIDES_INVALID", "Perbaiki isian di panel Pengiriman terlebih dahulu.");
        return null;
      }
      const parsed = parseEditorJson(text);
      if (!parsed.ok) {
        setSyntaxError(parsed.error);
        onSyntaxErrorRef.current?.(parsed.error);
        localFail(action, "JSON_MALFORMED", `JSON tidak valid di baris ${parsed.error.line}, kolom ${parsed.error.column}.`);
        return null;
      }
      setSyntaxError(null);
      const scope = modeMeta(mode).renderScope ?? "document";
      return { mode, body: applyOverrides(mode, parsed.value, overrides, scope) };
    },
    [localFail],
  );

  const validate = useCallback<PlaygroundActions["validate"]>(
    async (mode, text, overrides, preview) => {
      const prepared = prepare(mode, text, overrides, "validate");
      if (!prepared || !validateGuard.begin()) return null;
      setBusy("validate");
      try {
        const result = await validateSubmission(prepared.body, preview);
        validateGuard.succeed();
        setValidation({ result, text, mode });
        setIssues({ mode, title: "Masalah validasi", items: result.issues });
        return result;
      } catch (e) {
        if (isAbortError(e)) return null;
        validateGuard.fail(e);
        setFailure({ action: "validate", error: e });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [prepare, validateGuard],
  );

  const submit = useCallback<PlaygroundActions["submit"]>(
    async ({ mode, body }) => {
      if (!submitGuard.begin()) return null;
      setBusy("submit");
      setFailure(null);
      try {
        const result = await submitV2(mode, body);
        submitGuard.succeed();
        setSubmitResult({ result, mode });
        setIssues(null);
        return result;
      } catch (e) {
        if (isAbortError(e)) return null;
        submitGuard.fail(e);
        setFailure({ action: "submit", error: e });
        const items = validationIssuesOf(e);
        if (items.length > 0) setIssues({ mode, title: "Masalah dari server", items });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [submitGuard],
  );

  const upload = useCallback<PlaygroundActions["upload"]>(
    async (file, missionFolder) => {
      setFailure(null);
      if (file.type !== "image/png" && file.type !== "image/jpeg") {
        localFail("asset", "ASSET_TYPE_UNSUPPORTED", `Berkas ${file.name} bukan PNG atau JPEG.`);
        return null;
      }
      if (file.size > STUDIO_MAX_ASSET_BYTES) {
        localFail("asset", "ASSET_TOO_LARGE", `Berkas ${file.name} (${formatBytes(file.size)}) melebihi batas ${formatBytes(STUDIO_MAX_ASSET_BYTES)}.`);
        return null;
      }
      if (!assetGuard.begin()) return null;
      setBusy("asset");
      try {
        const res = await uploadAsset(file, missionFolder);
        assetGuard.succeed();
        setAssetResult(res);
        return res;
      } catch (e) {
        if (isAbortError(e)) return null;
        assetGuard.fail(e);
        setFailure({ action: "asset", error: e });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [assetGuard, localFail],
  );

  const clearSyntaxError = useCallback(() => setSyntaxError(null), []);
  const clearIssues = useCallback(() => setIssues(null), []);

  return {
    busy,
    validation,
    submitResult,
    assetResult,
    issues,
    syntaxError,
    failure,
    cooldowns: { validate: validateGuard.cooldown, submit: submitGuard.cooldown, asset: assetGuard.cooldown },
    prepare,
    validate,
    submit,
    upload,
    clearSyntaxError,
    clearIssues,
  };
}
