"use client";

/*
 * Editor JSON Playground (S100): textarea monospace tanpa bungkus baris,
 * kolom nomor baris yang ikut menggulir, sorotan baris (galat terpilih),
 * dan indikator baris/kolom kursor. Tanpa pustaka editor tambahan.
 */

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";

const LINE_PX = 20;
const PAD_PX = 12;

export interface JsonEditorHandle {
  /** Pindah kursor ke baris (1-based), sorot, dan gulir ke tampilan. */
  revealLine: (line: number) => void;
}

export const JsonEditor = forwardRef<
  JsonEditorHandle,
  {
    id: string;
    value: string;
    onChange: (v: string) => void;
    highlightLine: number | null;
    invalid: boolean;
    describedBy?: string;
    label: string;
  }
>(function JsonEditor({ id, value, onChange, highlightLine, invalid, describedBy, label }, ref) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  const lineCount = useMemo(() => {
    let n = 1;
    for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) === 10) n++;
    return n;
  }, [value]);

  const gutterText = useMemo(() => {
    const parts = new Array<string>(lineCount);
    for (let i = 0; i < lineCount; i++) parts[i] = String(i + 1);
    return parts.join("\n");
  }, [lineCount]);

  const updateCursor = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const before = ta.value.slice(0, ta.selectionStart);
    const line = before.split("\n").length;
    const col = before.length - before.lastIndexOf("\n");
    setCursor({ line, col });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      revealLine(line: number) {
        const ta = taRef.current;
        if (!ta) return;
        const text = ta.value;
        let start = 0;
        for (let l = 1; l < line && start !== -1; l++) {
          const nl = text.indexOf("\n", start);
          start = nl === -1 ? -1 : nl + 1;
        }
        if (start === -1) start = text.length;
        let end = text.indexOf("\n", start);
        if (end === -1) end = text.length;
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(start, end);
        ta.scrollTop = Math.max(0, (line - 1) * LINE_PX - ta.clientHeight / 3);
        setScrollTop(ta.scrollTop);
        updateCursor();
      },
    }),
    [updateCursor],
  );

  const onScroll = () => {
    const ta = taRef.current;
    if (!ta) return;
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
    setScrollTop(ta.scrollTop);
  };

  // Tab menyisipkan dua spasi; Escape melepas fokus agar Tab kembali berpindah fokus.
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.currentTarget.blur();
      return;
    }
    if (e.key !== "Tab" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: en } = ta;
    const next = ta.value.slice(0, s) + "  " + ta.value.slice(en);
    onChange(next);
    requestAnimationFrame(() => {
      ta.setSelectionRange(s + 2, s + 2);
      updateCursor();
    });
  };

  const hlTop = highlightLine !== null ? PAD_PX + (highlightLine - 1) * LINE_PX - scrollTop : null;

  return (
    <div>
      <div
        className={`relative flex h-[520px] overflow-hidden rounded-[var(--r-sm)] border bg-[var(--surface-1)] font-mono text-[12.5px] ${
          invalid ? "border-[var(--down)]" : "border-[var(--line)] focus-within:border-[var(--line-strong)]"
        }`}
        style={{ lineHeight: `${LINE_PX}px` }}
      >
        <div
          ref={gutterRef}
          aria-hidden
          className="w-14 shrink-0 select-none overflow-hidden border-r border-[var(--line)] bg-[var(--surface-2)] pr-2 text-right text-[var(--text-3)] num"
          style={{ paddingTop: PAD_PX, paddingBottom: PAD_PX, whiteSpace: "pre" }}
        >
          {gutterText}
        </div>
        <div className="relative min-w-0 flex-1">
          {hlTop !== null && hlTop > -LINE_PX && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-y border-[color-mix(in_srgb,var(--warn)_45%,transparent)] bg-[color-mix(in_srgb,var(--warn)_14%,transparent)]"
              style={{ top: hlTop, height: LINE_PX }}
            />
          )}
          <textarea
            id={id}
            ref={taRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              updateCursor();
            }}
            onScroll={onScroll}
            onKeyDown={onKeyDown}
            onKeyUp={updateCursor}
            onClick={updateCursor}
            onSelect={updateCursor}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            aria-label={label}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="relative h-full w-full resize-none overflow-auto bg-transparent px-3 text-[var(--text)] outline-none"
            style={{ paddingTop: PAD_PX, paddingBottom: PAD_PX, lineHeight: `${LINE_PX}px`, whiteSpace: "pre", tabSize: 2 }}
          />
        </div>
      </div>
      <p className="mt-1.5 text-[11.5px] text-[var(--text-3)] num" aria-live="off">
        Baris {cursor.line}, kolom {cursor.col} · {lineCount.toLocaleString("id-ID")} baris · Tab = 2 spasi, Esc lalu Tab untuk
        keluar dari editor
      </p>
    </div>
  );
});
