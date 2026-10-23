"use client";

/*
 * Tab "Baca & sunting" (SR-30; UX-01 §3c, W7, §5.3 K-4/K-5/K-7, kriteria A8-A10).
 *
 * - Lembar baca TERANG seperti kertas (D-164 T-12): isi R20 per bagian dalam
 *   urutan susunan, bab/subbab/paragraf bernomor dari pohon R05 (nomor
 *   dokumen, bukan alamat). Bukan JSON.
 * - Setiap blok dapat difokus; klik/Enter pada paragraf membuka sunting di
 *   tempat (R16 PATCH `replace`), lalu lembar perubahan Apa/Mengapa/Dampak.
 * - Menu "..." per blok: ganti dengan gambar (R18 + `replace`), sisip
 *   paragraf/gambar di bawah (`insertAfter`), pindahkan (`move`), hapus
 *   (`delete`, K-4), riwayat paragraf.
 * - 409 SCOPE_CONFLICT -> dialog konflik awam; 404 PID_NOT_FOUND -> muat versi
 *   terbaru; 403 -> mode baca saja dengan alasan.
 * - Melihat versi lama (`?versi=n`) = baca saja + pita "Kembali ke terbaru".
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { List, MoreHorizontal, Pencil } from "lucide-react";
import type { BlockV2, ChapterV2, SlotNodeV2 } from "@/lib/studio/contract";
import type { OutputFileDto } from "@/lib/studio/contract/types/api";
import { Button, Panel, Skeleton } from "@/components/ui/kit";
import { ConfirmDialog, Sheet } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { ErrorView } from "@/components/studio/shared/error-view";
import { isStudioApiError } from "@/components/studio/shared/http";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { sectionTypeLabel, slotLabel, versionLabel } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { contentPlain } from "@/components/studio/revision/text-diff";
import { DocumentToc } from "../address-tree";
import { copyToClipboard } from "../completeness-tab";
import { getContent, getDocument, patchParagraph, renderDocument, uploadAsset } from "../doc-api";
import {
  blockEditorText,
  blockFromEditor,
  buildNumberIndex,
  chaptersOf,
  fileGroupOf,
  findBlock,
  inlinePlain,
  isEditableText,
  scopeConflictOf,
  shiftSentence,
  slotPayloadOf,
  withoutId,
  type NumberIndex,
  type PatchPidBody,
  type ScopeConflictDetails,
} from "../doc-model";
import { useDocPage } from "../doc-context";
import { FilePreviewDialog } from "../output-files";
import { BlockView, InlineText } from "./blocks";
import { ChangeSheet, ConflictDialog, ImageDialog, MoveDialog, type ChangeValues, type MoveTarget } from "./dialogs";
import { ParagraphEditor, clearDraft } from "./paragraph-editor";
import { ParagraphHistory } from "./paragraph-history";
import { SlotView } from "./slot-view";

// ── Tipe keadaan ─────────────────────────────────────────────────────────

interface EditState {
  pid: string;
  mode: "replace" | "insertAfter";
  original: BlockV2 | null;
  initialText: string;
  label: string;
  listMode: boolean;
  /** Versi dasar khusus (setelah konflik); bawaan = versi isi yang dimuat. */
  base?: number;
}

interface Pending {
  pid: string;
  op: PatchPidBody["op"];
  block?: BlockV2;
  to?: PatchPidBody["to"];
  title: string;
  defaultWhat: string;
  defaultImpact: string;
  label: string;
  /** Teks editor (untuk dialog konflik). */
  myText?: string;
  base?: number;
}

interface ImageState {
  mode: "replace" | "insertAfter" | "editImage";
  pid: string;
  original: BlockV2 | null;
  label: string;
}

const targetId = (t: string) => `bagian-${t.replace(/[^A-Za-z0-9_-]/g, "-")}`;
const blockDomId = (pid: string) => `blok-${pid.replace(/[^A-Za-z0-9_-]/g, "-")}`;

function blockLabel(b: BlockV2, number: string | undefined, artifactLabel: string | undefined): string {
  if (artifactLabel) return artifactLabel;
  const kind = sectionTypeLabel(b.type);
  return number ? `${kind} ${number}` : kind;
}

function sectionNoIndex(slots: readonly SlotNodeV2[]): Map<string, { chapterKey: string; sectionNo: number }> {
  const m = new Map<string, { chapterKey: string; sectionNo: number }>();
  for (const s of slots) for (const c of s.chapters ?? []) for (const sec of c.sections) m.set(sec.pid, { chapterKey: c.key, sectionNo: sec.sectionNo });
  return m;
}

// ── Menu per blok ────────────────────────────────────────────────────────

interface MenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

const MENU_WIDTH = 240;
const MENU_GAP = 4;
const VIEWPORT_PAD = 8;

/**
 * Posisi menu (koordinat viewport, `position: fixed`). Utamakan membuka ke
 * kanan tombol (ke arah lembar baca, bukan ke panel Daftar isi); balik ke kiri
 * bila ruang kanan kurang, dan ke atas bila ruang bawah kurang.
 */
function menuPosition(btn: DOMRect, menuHeight: number): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = btn.left;
  if (left + MENU_WIDTH > vw - VIEWPORT_PAD) left = btn.right - MENU_WIDTH;
  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - VIEWPORT_PAD - MENU_WIDTH));
  let top = btn.bottom + MENU_GAP;
  if (top + menuHeight > vh - VIEWPORT_PAD && btn.top - MENU_GAP - menuHeight >= VIEWPORT_PAD) top = btn.top - MENU_GAP - menuHeight;
  return { left, top };
}

/**
 * Menu "Tindakan lain" per blok. Daftar menu dirender lewat portal ke
 * `document.body` dengan `position: fixed` (SR52-F2): bagian bab memakai
 * `content-visibility: auto` (penahanan paint) sehingga menu di dalamnya
 * terpotong dan panel Daftar isi menangkap klik. Bukan ke `.studio-root`:
 * leluhur ber-`transform` (animasi masuk halaman HQ) menggeser acuan `fixed`.
 * Menu hanya memakai token global `:root`. Pola tombol menu WAI-ARIA:
 * buka -> fokus item pertama, panah atas/bawah/Home/End, Escape/Tab menutup
 * dan mengembalikan fokus ke tombol.
 */
function BlockMenu({ label, items, onOpenChange }: { label: string; items: MenuItem[]; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpenState] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const setOpen = useCallback(
    (v: boolean) => {
      setOpenState(v);
      onOpenChange?.(v);
    },
    [onOpenChange],
  );

  const close = useCallback(
    (restoreFocus: boolean) => {
      // Fokus dikembalikan SEBELUM menu ditutup: talang masih tampil, lalu
      // `focus-within` menjaganya tetap tampil setelah `menuOpen` = false.
      if (restoreFocus) btnRef.current?.focus({ preventScroll: true });
      setOpen(false);
      setPos(null);
    },
    [setOpen],
  );

  const place = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    setPos(menuPosition(r, menuRef.current?.offsetHeight ?? 0));
  }, []);

  // Ukur setelah menu terpasang; fokus item pertama setelah menu terlihat.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);
  const placed = pos !== null;
  useEffect(() => {
    if (!open || !placed) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [open, placed]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      close(false);
    };
    const onMove = () => place();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, close, place]);

  if (items.length === 0) return null;

  function onMenuKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const els = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      els[(n + els.length) % els.length]?.focus();
    };
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === "Tab") {
      e.preventDefault();
      close(true);
    } else if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(els.length - 1);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Tindakan lain untuk ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          if (open) close(false);
          else setOpen(true);
        }}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--studio-ink-2)] hover:bg-[color-mix(in_srgb,var(--studio-ink)_10%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      {open &&
        createPortal(
          <ul
            ref={menuRef}
            role="menu"
            aria-label={`Tindakan untuk ${label}`}
            onKeyDown={onMenuKeyDown}
            style={{ position: "fixed", left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: MENU_WIDTH, visibility: pos ? "visible" : "hidden" }}
            className="z-50 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface-2)] p-1 text-[var(--text)] shadow-xl"
          >
            {items.map((it) => (
              <li role="none" key={it.label}>
                <button
                  role="menuitem"
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    close(false);
                    it.onSelect();
                  }}
                  className={`w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] hover:bg-[var(--surface-1)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${it.danger ? "text-[var(--down)]" : ""}`}
                >
                  {it.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}

// ── Satu blok yang dapat dipilih ─────────────────────────────────────────

function BlockItem({
  block,
  label,
  artifactLabel,
  selected,
  readOnly,
  onActivate,
  menu,
  onOpenPdf,
  technical,
}: {
  block: BlockV2;
  label: string;
  artifactLabel?: string;
  selected: boolean;
  readOnly: boolean;
  onActivate: () => void;
  menu: MenuItem[];
  onOpenPdf?: () => void;
  technical: Record<string, string | number | null | undefined>;
}) {
  const editable = !readOnly && isEditableText(block);
  // Talang tetap tampil selama menu terbuka (fokus pindah ke menu portal).
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="group relative -mx-3">
      <div
        id={block.id ? blockDomId(block.id) : undefined}
        tabIndex={0}
        aria-label={editable ? `${label}, tekan Enter untuk menyunting` : label}
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onActivate();
          }
        }}
        className={`cursor-text rounded-[4px] px-3 py-1 outline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:bg-[var(--studio-mark)] focus-visible:bg-[var(--studio-mark)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
          selected ? "bg-[var(--studio-mark)]" : ""
        }`}
      >
        <BlockView block={block} artifactLabel={artifactLabel} onOpenPdf={onOpenPdf} />
      </div>
      <div className={`absolute -left-9 top-1 ${menuOpen ? "flex" : "hidden"} flex-col max-lg:flex items-center gap-0.5 group-focus-within:flex group-hover:flex max-lg:static max-lg:-mt-1 max-lg:mb-1 max-lg:flex-row max-lg:justify-end max-lg:px-3`}>
        {editable && (
          <button
            type="button"
            onClick={onActivate}
            aria-label={`Sunting ${label}`}
            title="Sunting"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--surface-1)] text-[var(--text)] shadow focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] max-lg:bg-transparent max-lg:text-[var(--studio-ink-2)] max-lg:shadow-none"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </button>
        )}
        <BlockMenu label={label} items={menu} onOpenChange={setMenuOpen} />
      </div>
      {selected && <InfoTeknis className="mx-3 mt-1 text-[var(--text)]" items={technical} />}
    </div>
  );
}

// ── Tab ──────────────────────────────────────────────────────────────────

export function ReaderTab() {
  const {
    id,
    versi,
    detail,
    report,
    numbers: latestNumbers,
    slotLabels,
    latestRevisionNo,
    refreshTick,
    navigate,
    selectedPid,
    target,
    setEditing,
    refreshAll,
  } = useDocPage();
  const { notify, announce } = useNotice();

  const content = useStudioQuery(`doc-content:${id}:${versi ?? "latest"}`, (signal) => getContent(id, versi, signal), { source: "documents.content" });
  const oldDetail = useStudioQuery(versi ? `doc:${id}:rev:${versi}` : null, (signal) => getDocument(id, versi, signal), { source: "documents.version" });

  // Muat ulang isi setiap kali kepala diperbarui (data lama tetap tampil).
  const { refetch: refetchContent } = content;
  const firstTick = useRef(refreshTick);
  useEffect(() => {
    if (refreshTick !== firstTick.current) refetchContent();
  }, [refreshTick, refetchContent]);

  const viewDetail = versi ? oldDetail.data : detail.data;
  const slots = useMemo(() => viewDetail?.slots ?? [], [viewDetail]);
  const numbers: NumberIndex = useMemo(() => (versi ? buildNumberIndex(slots) : latestNumbers), [versi, slots, latestNumbers]);
  const sectionNos = useMemo(() => sectionNoIndex(slots), [slots]);
  const doc = content.data?.content;
  const baseRevision = content.data?.revisionNo ?? latestRevisionNo ?? 0;

  const [forbidden, setForbidden] = useState(false);
  const readOnly = versi !== null || forbidden;

  // PDF lengkap terbaru untuk "Lihat di PDF".
  const pdf: OutputFileDto | null = useMemo(
    () => (viewDetail?.outputs ?? []).find((f) => f.format === "PDF" && !fileGroupOf(f).draft && f.role === "PRIMARY") ?? null,
    [viewDetail],
  );
  const [preview, setPreview] = useState<OutputFileDto | null>(null);
  const openPdf = pdf ? () => setPreview(pdf) : undefined;

  // ── Sunting ──
  const [edit, setEdit] = useState<EditState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState<null | (() => void)>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ pending: Pending; change: ChangeValues; details: ScopeConflictDetails } | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [imageDlg, setImageDlg] = useState<ImageState | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [moveDlg, setMoveDlg] = useState<{ pid: string; label: string } | null>(null);
  const [deleteDlg, setDeleteDlg] = useState<{ pid: string; label: string } | null>(null);
  const [deleteWhy, setDeleteWhy] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<{ pid: string; label: string } | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [gone, setGone] = useState<string | null>(null);

  useEffect(() => {
    setEditing(!!edit || !!pending);
  }, [edit, pending, setEditing]);
  useEffect(() => () => setEditing(false), [setEditing]);

  // Jaga perubahan yang belum disimpan saat menutup/memuat ulang tab.
  useEffect(() => {
    if (!edit || !dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [edit, dirty]);

  const draftKey = (e: EditState) => `studio:draft:${id}:${e.mode}:${e.pid}`;

  const guard = useCallback(
    (next: () => void) => {
      if (edit && dirty) setDiscard(() => next);
      else next();
    },
    [edit, dirty],
  );

  const focusBlock = (pid: string) => {
    requestAnimationFrame(() => document.getElementById(blockDomId(pid))?.focus());
  };

  function startEdit(block: BlockV2, label: string) {
    if (!block.id) return;
    const pid = block.id;
    guard(() => {
      setEdit({ pid, mode: "replace", original: block, initialText: blockEditorText(block), label, listMode: block.type === "list" });
      setDirty(false);
      navigate({ p: pid });
    });
  }

  function cancelEdit(wasDirty: boolean) {
    const close = () => {
      const pid = edit?.pid;
      if (edit) clearDraft(draftKey(edit));
      setEdit(null);
      setDirty(false);
      if (pid) focusBlock(pid);
    };
    if (wasDirty) setDiscard(() => close);
    else close();
  }

  /** R17 scope document setelah PATCH berhasil (opsi "Buat ulang berkas lengkap"). */
  async function rebuildFullFile(revisionNo: number) {
    announce("Berkas lengkap sedang dibuat");
    notify({ message: "Berkas lengkap sedang dibuat…", tone: "info" });
    const seeFiles = { label: "Lihat berkas", onClick: () => navigate({ tab: "berkas" }) };
    try {
      const res = await renderDocument(id, { scope: "document", formats: ["docx", "pdf"], revisionNo });
      if (res.job.status === "FAILED") {
        notify({ message: "Perubahan tersimpan, tetapi berkas lengkap gagal dibuat. Coba lagi dari kartu Buat berkas.", tone: "warn", durationMs: 9000 });
      } else if (res.job.status === "QUEUED" || res.job.status === "RUNNING") {
        notify({ message: "Berkas lengkap sedang dibuat. Pantau di tab Berkas.", tone: "info", action: seeFiles });
      } else {
        notify({
          message: res.job.status === "PARTIAL" ? "Berkas lengkap: sebagian berkas siap" : "Berkas lengkap: berkas siap",
          tone: res.job.status === "PARTIAL" ? "warn" : "success",
          action: seeFiles,
        });
      }
    } catch (e) {
      const m = errorMessages(e);
      notify({ message: `Perubahan tersimpan, tetapi berkas lengkap belum dibuat. ${m.title}. ${m.body}`, tone: "warn", durationMs: 9000 });
    } finally {
      refreshAll();
    }
  }

  async function doSave(p: Pending, change: ChangeValues, base: number) {
    setSaving(true);
    setSaveError(null);
    const body: PatchPidBody = {
      op: p.op,
      baseRevisionNo: base,
      ...(p.block ? { block: withoutId(p.block) } : {}),
      ...(p.to ? { to: p.to } : {}),
      change: { what: change.what, why: change.why, impact: change.impact },
    };
    try {
      const r = await patchParagraph(id, p.pid, body);
      notify({ message: `Disimpan sebagai versi ${r.revision.revisionNo}` });
      const shift = shiftSentence(r.addressMap);
      if (shift) {
        announce(shift);
        notify({ message: shift, tone: "info" });
      }
      // D-247: berkas lengkap dibuat lewat R17 SESUDAH simpan berhasil; suntingan
      // sudah tersimpan sehingga penolakan render tidak menghilangkannya.
      if (change.rerender) {
        if (r.completeness?.fullRenderAllowed) void rebuildFullFile(r.revision.revisionNo);
        else notify({ message: "Perubahan tersimpan. Berkas lengkap belum dibuat karena dokumen belum lengkap.", tone: "warn" });
      }
      if (edit) clearDraft(draftKey(edit));
      setEdit(null);
      setDirty(false);
      setPending(null);
      setConflict(null);
      setDeleteDlg(null);
      refreshAll();
      const focusPid = p.op === "delete" ? null : r.newPid ?? r.pid;
      navigate({ p: focusPid });
      if (focusPid) window.setTimeout(() => focusBlock(focusPid), 400);
    } catch (e) {
      if (isStudioApiError(e) && e.code === "SCOPE_CONFLICT") {
        setPending(null);
        setDeleteDlg(null);
        setConflictError(null);
        setConflict({ pending: p, change, details: scopeConflictOf(e.details) });
        return;
      }
      if (isStudioApiError(e) && e.status === 403) setForbidden(true);
      if (isStudioApiError(e) && e.code === "PID_NOT_FOUND") setGone(p.label);
      const m = errorMessages(e);
      const text = `${m.title}. ${m.body}`;
      setSaveError(text);
      setDeleteError(text);
      setConflictError(text);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  function requestSaveFromEditor(text: string) {
    if (!edit) return;
    const block = blockFromEditor(edit.original && isEditableText(edit.original) ? edit.original : null, text);
    const isNew = edit.mode === "insertAfter";
    setSaveError(null);
    setPending({
      pid: edit.pid,
      op: isNew ? "insertAfter" : "replace",
      block,
      title: isNew ? `Simpan paragraf baru setelah ${edit.label.toLowerCase()}` : `Simpan perubahan ${edit.label.toLowerCase()}`,
      defaultWhat: isNew ? `Sisipkan paragraf setelah ${edit.label.toLowerCase()}` : `Ubah ${edit.label.toLowerCase()}`,
      defaultImpact: isNew ? "Penomoran paragraf sesudahnya bergeser" : `${edit.label} saja`,
      label: edit.label,
      myText: text,
      base: edit.base,
    });
  }

  async function continueImage(r: { file: File | null; caption: string; source: string }) {
    if (!imageDlg) return;
    setImageBusy(true);
    setImageError(null);
    try {
      let asset = imageDlg.original?.type === "image" ? imageDlg.original.asset : "";
      if (r.file) {
        const up = await uploadAsset(r.file, viewDetail?.document.missionFolder ?? null);
        asset = up.asset.sha256.startsWith("sha256:") ? up.asset.sha256 : `sha256:${up.asset.sha256}`;
      }
      const block: BlockV2 = { type: "image", asset, caption: { text: r.caption }, source: { text: r.source } };
      const insert = imageDlg.mode === "insertAfter";
      setPending({
        pid: imageDlg.pid,
        op: insert ? "insertAfter" : "replace",
        block,
        title: insert ? "Simpan gambar baru" : `Simpan ${imageDlg.label.toLowerCase()}`,
        defaultWhat:
          imageDlg.mode === "replace"
            ? `Ganti ${imageDlg.label.toLowerCase()} dengan gambar`
            : insert
              ? `Sisipkan gambar setelah ${imageDlg.label.toLowerCase()}`
              : `Perbarui ${imageDlg.label.toLowerCase()}`,
        defaultImpact: insert || imageDlg.mode === "replace" ? "Penomoran gambar sesudahnya bergeser" : `${imageDlg.label} saja`,
        label: imageDlg.label,
      });
      setImageDlg(null);
    } catch (e) {
      const m = errorMessages(e);
      setImageError(`${m.title}. ${m.body}`);
    } finally {
      setImageBusy(false);
    }
  }

  // Tujuan pindah dari isi dokumen.
  function moveTargets(pid: string): MoveTarget[] {
    const out: MoveTarget[] = [];
    for (const s of slots) {
      if (s.sectionType !== "chapter" && s.sectionType !== "appendix") continue;
      for (const c of chaptersOf(doc, s.slotKey)) {
        const group = `${s.sectionType === "appendix" ? "Lampiran" : "Bab"} ${c.key} ${inlinePlain(c.title)}`.trim();
        if (c.intro?.length) {
          out.push({ value: `intro:${c.key}`, label: `Di awal pengantar ${s.sectionType === "appendix" ? "lampiran" : "bab"} ${c.key}`, group, to: { section: { chapterKey: c.key, sectionNo: 0, at: 0 } } });
        }
        c.sections.forEach((sec, si) => {
          const pos = sec.id ? sectionNos.get(sec.id) : undefined;
          const secNo = pos?.sectionNo ?? si + 1;
          out.push({ value: `sec:${c.key}:${secNo}`, label: `Di awal subbab ${c.key}.${secNo} ${inlinePlain(sec.title)}`.trim(), group, to: { section: { chapterKey: c.key, sectionNo: secNo, at: 0 } } });
          for (const b of sec.blocks) {
            if (!b.id || b.id === pid) continue;
            out.push({ value: `after:${b.id}`, label: `Sesudah ${blockLabel(b, numbers.number.get(b.id), numbers.artifactLabel.get(b.id)).toLowerCase()}`, group, to: { after: b.id } });
          }
        });
      }
    }
    return out;
  }

  function menuFor(block: BlockV2, label: string): MenuItem[] {
    const pid = block.id;
    if (!pid) return [];
    const history: MenuItem = { label: "Riwayat paragraf", onSelect: () => setHistoryFor({ pid, label }) };
    if (readOnly) return [history];
    const items: MenuItem[] = [];
    if (block.type === "paragraph") {
      items.push({ label: "Ganti dengan gambar", onSelect: () => guard(() => setImageDlg({ mode: "replace", pid, original: block, label })) });
    }
    if (block.type === "image") {
      items.push({ label: "Ubah gambar atau keterangan", onSelect: () => guard(() => setImageDlg({ mode: "editImage", pid, original: block, label })) });
      items.push({
        label: "Ganti gambar jadi paragraf",
        onSelect: () =>
          guard(() => {
            setEdit({ pid, mode: "replace", original: null, initialText: inlinePlain(block.caption), label, listMode: false });
            setDirty(false);
          }),
      });
    }
    items.push({
      label: "Sisipkan paragraf di bawah",
      onSelect: () =>
        guard(() => {
          setEdit({ pid, mode: "insertAfter", original: null, initialText: "", label, listMode: false });
          setDirty(false);
        }),
    });
    items.push({ label: "Sisipkan gambar di bawah", onSelect: () => guard(() => setImageDlg({ mode: "insertAfter", pid, original: null, label })) });
    items.push({ label: "Pindahkan…", onSelect: () => guard(() => setMoveDlg({ pid, label })) });
    items.push(history);
    items.push({
      label: block.type === "paragraph" ? "Hapus paragraf" : `Hapus ${sectionTypeLabel(block.type).toLowerCase()}`,
      danger: true,
      onSelect: () =>
        guard(() => {
          setDeleteWhy("");
          setDeleteError(null);
          setDeleteDlg({ pid, label });
        }),
    });
    return items;
  }

  // Gulir ke bagian yang dituju (dari rel, daftar isi, atau tab Kelengkapan).
  const doc0 = !!doc;
  useEffect(() => {
    if (!target || !doc0) return;
    const el = document.getElementById(targetId(target));
    if (el) {
      el.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      el.focus({ preventScroll: true });
    }
  }, [target, doc0]);
  const scrolledPid = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedPid || !doc0 || scrolledPid.current === selectedPid || target) return;
    scrolledPid.current = selectedPid;
    document.getElementById(blockDomId(selectedPid))?.scrollIntoView({ block: "center" });
  }, [selectedPid, doc0, target]);

  const goTo = (t: string) => {
    setTocOpen(false);
    navigate({ target: t });
  };

  // ── Render blok ──
  function renderBlock(block: BlockV2, key: string) {
    const pid = block.id ?? "";
    const number = pid ? numbers.number.get(pid) : undefined;
    const art = pid ? numbers.artifactLabel.get(pid) : undefined;
    const label = blockLabel(block, number, art);
    const editingThis = edit && edit.pid === pid;
    const editor =
      editingThis && edit ? (
        <div className="my-2" key={`${key}-editor`}>
          <ParagraphEditor
            key={`${edit.mode}:${edit.pid}:${edit.base ?? ""}`}
            label={edit.mode === "insertAfter" ? "Paragraf baru" : edit.label}
            initialText={edit.initialText}
            draftKey={draftKey(edit)}
            listMode={edit.listMode}
            onDirtyChange={setDirty}
            onCancel={cancelEdit}
            onSave={requestSaveFromEditor}
          />
        </div>
      ) : null;
    if (editingThis && edit?.mode === "replace") return editor;
    return (
      <div key={key}>
        <BlockItem
          block={block}
          label={label}
          artifactLabel={art}
          selected={selectedPid === pid}
          readOnly={readOnly}
          onActivate={() => {
            if (!readOnly && isEditableText(block)) startEdit(block, label);
            else if (pid) navigate({ p: pid });
          }}
          menu={menuFor(block, label)}
          onOpenPdf={openPdf}
          technical={{ "Id paragraf": pid, Nomor: number, "Versi dasar": baseRevision, Jenis: block.type }}
        />
        {editor}
      </div>
    );
  }

  function renderChapter(slot: SlotNodeV2, c: ChapterV2) {
    const t = `${slot.slotKey}:${c.key}`;
    const appendix = slot.sectionType === "appendix";
    return (
      // `content-visibility: auto` menahan paint di kotak bagian; margin negatif +
      // padding setara melebarkan kotak itu agar talang tombol (-left-9) dan sorot
      // blok (-mx-3) tidak terpotong (SR52-F2). Isi tidak bergeser.
      <section
        key={c.key}
        aria-labelledby={`${targetId(t)}-h`}
        className="-mx-3 mt-10 px-3 first:mt-0 lg:-ml-12 lg:pl-12"
        style={{ contentVisibility: "auto", containIntrinsicSize: "auto 900px" }}
      >
        <header id={targetId(t)} tabIndex={-1} className="mb-4 outline-none">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--studio-ink-2)]">
            {appendix ? "Lampiran" : "Bab"} {c.key}
          </p>
          <h3 id={`${targetId(t)}-h`} className="mt-1 text-[20px] font-semibold leading-snug tracking-[-0.01em]">
            <InlineText value={c.title} />
          </h3>
        </header>
        <div className="space-y-2">{(c.intro ?? []).map((b, i) => renderBlock(b, `${c.key}-intro-${b.id ?? i}`))}</div>
        {c.sections.map((sec, si) => {
          const secNo = sec.id ? numbers.number.get(sec.id) ?? `${c.key}.${si + 1}` : `${c.key}.${si + 1}`;
          return (
            <section key={sec.id ?? si} className="mt-6" aria-label={`Subbab ${secNo}`}>
              <h4 id={targetId(`${t}:${si + 1}`)} tabIndex={-1} className="mb-2 text-[15px] font-semibold outline-none">
                <span className="mr-2 tabular-nums">{secNo}</span>
                <InlineText value={sec.title} />
              </h4>
              <div className="space-y-2">{sec.blocks.map((b, bi) => renderBlock(b, `${c.key}-${si}-${b.id ?? bi}`))}</div>
            </section>
          );
        })}
      </section>
    );
  }

  function renderSlot(slot: SlotNodeV2) {
    const label = slotLabel(slot.slotKey, slot.label);
    const repeatable = slot.sectionType === "chapter" || slot.sectionType === "appendix";
    if (!repeatable) {
      return (
        <section key={slot.slotKey} className="mt-10 first:mt-0" aria-labelledby={`${targetId(slot.slotKey)}-h`}>
          <h2 id={targetId(slot.slotKey)} tabIndex={-1} className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--studio-ink-2)] outline-none">
            <span id={`${targetId(slot.slotKey)}-h`}>{label}</span>
          </h2>
          <SlotView label={label} sectionType={slot.sectionType} state={slot.state} payload={slotPayloadOf(doc, slot.slotKey)} onOpenPdf={openPdf} />
        </section>
      );
    }
    const chapters = chaptersOf(doc, slot.slotKey);
    const prog = report?.chapters?.[slot.slotKey];
    const present = new Set(chapters.map((c) => c.key));
    const missing = versi ? [] : (prog?.missing ?? []).filter((k) => !present.has(k));
    const items: Array<{ key: string; chapter?: ChapterV2 }> = [...chapters.map((c) => ({ key: c.key, chapter: c })), ...missing.map((k) => ({ key: k }))].sort((a, b) =>
      a.key.localeCompare(b.key, "id", { numeric: true }),
    );
    return (
      <section key={slot.slotKey} className="mt-12 first:mt-0" aria-label={label}>
        <h2 id={targetId(slot.slotKey)} tabIndex={-1} className="sr-only">
          {label}
        </h2>
        {items.length === 0 && (
          <div className="rounded-[6px] border border-dashed border-[color-mix(in_srgb,var(--studio-ink)_35%,transparent)] px-4 py-4 text-[13px] text-[var(--studio-ink-2)]">
            {label} belum berisi bab. Agen akan mengirim bab pertama.
          </div>
        )}
        {items.map((it) =>
          it.chapter ? (
            renderChapter(slot, it.chapter)
          ) : (
            <div
              key={it.key}
              id={targetId(`${slot.slotKey}:${it.key}`)}
              tabIndex={-1}
              className="mt-8 rounded-[6px] border border-dashed border-[color-mix(in_srgb,var(--studio-ink)_35%,transparent)] px-4 py-4 text-[13px] text-[var(--studio-ink-2)] outline-none"
            >
              {slot.sectionType === "appendix" ? "Lampiran" : "Bab"} {it.key} belum ada. Agen akan mengirimnya, atau minta pengisian lewat controller.
            </div>
          ),
        )}
      </section>
    );
  }

  // ── Keadaan muat ──
  // Dokumen format lama (tanpa susunan bagian): isi tidak diproyeksikan per bagian.
  const legacy = !!viewDetail && slots.length === 0;
  const loading = !viewDetail ? !(versi && oldDetail.error) : !legacy && content.isLoading;
  const loadError = (!legacy && content.error && !content.data ? content.error : null) ?? (versi && oldDetail.error && !oldDetail.data ? oldDetail.error : null);

  const tocFooter = (
    <div className="space-y-1.5 border-t border-[var(--line)] px-2 pt-3 text-[12px] text-[var(--text-2)]">
      <p>Tampilan ini untuk meninjau. Tata letak akhir ada di berkas PDF.</p>
      {pdf && (
        <Button size="sm" onClick={() => setPreview(pdf)} className="whitespace-nowrap">
          Buka PDF
        </Button>
      )}
    </div>
  );

  const toc = <DocumentToc slots={slots} report={versi ? null : report} content={doc} active={target} onGo={goTo} footer={tocFooter} />;

  return (
    <div className="space-y-4">
      {versi !== null && (
        <Panel className="flex flex-wrap items-center justify-between gap-3 border-[color-mix(in_srgb,var(--warn)_40%,var(--line))] px-4 py-3">
          <p className="text-[13px] text-[var(--text)]">
            Anda melihat {versionLabel(versi).toLowerCase()} (bukan terbaru). Versi lama hanya dapat dibaca.
          </p>
          <Button size="sm" onClick={() => navigate({ versi: null })} className="whitespace-nowrap">
            Kembali ke terbaru
          </Button>
        </Panel>
      )}
      {forbidden && versi === null && (
        <Panel className="px-4 py-3">
          <p className="text-[13px] text-[var(--text)]">Dokumen ini memakai templat terbatas; hanya admin yang dapat menyunting. Anda tetap dapat membaca dan membuat berkas.</p>
        </Panel>
      )}
      {gone && (
        <Panel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-[13px] text-[var(--text)]">{gone} sudah tidak ada. Paragraf mungkin dihapus atau dipindah di versi terbaru.</p>
          <Button
            size="sm"
            onClick={() => {
              setGone(null);
              setEdit(null);
              setPending(null);
              refreshAll();
            }}
            className="whitespace-nowrap"
          >
            Muat versi terbaru
          </Button>
        </Panel>
      )}

      <div className="lg:hidden">
        <Button size="sm" onClick={() => setTocOpen(true)} className="whitespace-nowrap">
          <List className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Daftar isi
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto pr-1">{toc}</div>
        </aside>

        <div className="min-w-0">
          {loadError ? (
            <ErrorView error={loadError} title="Isi dokumen tidak dapat dimuat" onRetry={content.error ? content.retry : oldDetail.retry} cooldown={content.error ? content.cooldown : oldDetail.cooldown} />
          ) : loading ? (
            <div aria-busy="true" className="rounded-[4px] px-6 py-10 sm:px-12" style={{ background: "var(--studio-paper)" }}>
              <div className="space-y-3">
                <Skeleton className="h-4 w-32 opacity-40" />
                <Skeleton className="h-6 w-2/3 opacity-40" />
                <Skeleton className="h-3 w-full opacity-40" />
                <Skeleton className="h-3 w-full opacity-40" />
                <Skeleton className="h-3 w-5/6 opacity-40" />
              </div>
            </div>
          ) : (
            <article
              aria-label="Lembar baca dokumen"
              className="rounded-[4px] px-5 py-8 text-[14.5px] leading-[1.7] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.6)] sm:px-14 sm:py-14"
              style={{ background: "var(--studio-paper)", color: "var(--studio-ink)" }}
            >
              <div className="mx-auto max-w-[44rem] lg:pl-6">
                {slots.length === 0 ? (
                  <p className="text-[13.5px] text-[var(--studio-ink-2)]">
                    Dokumen ini dibuat dengan format lama sehingga isinya belum dapat ditampilkan per bagian di sini.{" "}
                    {pdf ? "Gunakan Buka PDF di daftar isi untuk membacanya." : "Buat berkas untuk membacanya sebagai PDF."}
                  </p>
                ) : (
                  slots.filter((s) => s.state !== "OMITTED").map(renderSlot)
                )}
              </div>
            </article>
          )}
          <InfoTeknis className="mt-3" items={{ "Versi isi dimuat": content.data?.revisionNo, "Versi terbaru": latestRevisionNo }} />
        </div>
      </div>

      <Sheet open={tocOpen} title="Daftar isi" onClose={() => setTocOpen(false)} placement="side">
        {toc}
      </Sheet>

      {pending && (
        <ChangeSheet
          key={`${pending.op}:${pending.pid}:${pending.defaultWhat}`}
          open
          title={pending.title}
          defaultWhat={pending.defaultWhat}
          defaultImpact={pending.defaultImpact}
          canRerender={report?.status === "COMPLETE"}
          busy={saving}
          error={saveError}
          onCancel={() => {
            if (!saving) {
              setPending(null);
              setSaveError(null);
            }
          }}
          onSubmit={(v) => void doSave(pending, v, pending.base ?? baseRevision).catch(() => undefined)}
        />
      )}

      {imageDlg && (
        <ImageDialog
          key={`${imageDlg.mode}:${imageDlg.pid}`}
          open
          title={
            imageDlg.mode === "replace" ? `Ganti ${imageDlg.label.toLowerCase()} dengan gambar` : imageDlg.mode === "insertAfter" ? `Sisipkan gambar setelah ${imageDlg.label.toLowerCase()}` : `Ubah ${imageDlg.label.toLowerCase()}`
          }
          initialCaption={imageDlg.original?.type === "image" ? inlinePlain(imageDlg.original.caption) : ""}
          initialSource={imageDlg.original?.type === "image" ? inlinePlain(imageDlg.original.source) : ""}
          requireFile={imageDlg.mode !== "editImage"}
          busy={imageBusy}
          error={imageError}
          onCancel={() => {
            if (!imageBusy) {
              setImageDlg(null);
              setImageError(null);
            }
          }}
          onContinue={(r) => void continueImage(r)}
        />
      )}

      {moveDlg && (
        <MoveDialog
          open
          title={`Pindahkan ${moveDlg.label.toLowerCase()}`}
          targets={moveTargets(moveDlg.pid)}
          onCancel={() => setMoveDlg(null)}
          onPick={(t) => {
            setPending({
              pid: moveDlg.pid,
              op: "move",
              to: t.to,
              title: `Simpan pemindahan ${moveDlg.label.toLowerCase()}`,
              defaultWhat: `Pindahkan ${moveDlg.label.toLowerCase()} ${t.label.charAt(0).toLowerCase()}${t.label.slice(1)}`,
              defaultImpact: "Penomoran paragraf di sekitar asal dan tujuan bergeser",
              label: moveDlg.label,
            });
            setMoveDlg(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteDlg}
        title={deleteDlg ? `Hapus ${deleteDlg.label.toLowerCase()}?` : "Hapus"}
        description="Penomoran sesudahnya akan bergeser. Teksnya tetap ada di Riwayat."
        confirmLabel={deleteDlg?.label.toLowerCase().startsWith("paragraf") ? "Hapus paragraf" : "Hapus"}
        onCancel={() => {
          if (!saving) setDeleteDlg(null);
        }}
        confirmDisabled={!deleteWhy.trim()}
        error={deleteError}
        onConfirm={async () => {
          if (!deleteDlg) return;
          await doSave(
            { pid: deleteDlg.pid, op: "delete", title: "", defaultWhat: "", defaultImpact: "", label: deleteDlg.label },
            { what: `Hapus ${deleteDlg.label.toLowerCase()}`, why: deleteWhy.trim(), impact: "Penomoran sesudahnya bergeser", rerender: false },
            baseRevision,
          );
        }}
      >
        <label className="block space-y-1 text-[12.5px] font-medium text-[var(--text)]">
          Mengapa <span className="font-normal text-[var(--text-2)]">(wajib)</span>
          <input
            value={deleteWhy}
            onChange={(e) => setDeleteWhy(e.target.value)}
            className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[13px] font-normal text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </label>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!discard}
        title={edit ? `Buang perubahan pada ${edit.label.toLowerCase()}?` : "Buang perubahan?"}
        description="Teks yang belum disimpan akan hilang."
        confirmLabel="Buang"
        cancelLabel="Lanjut menyunting"
        onCancel={() => setDiscard(null)}
        onConfirm={() => {
          const next = discard;
          if (edit) clearDraft(draftKey(edit));
          setEdit(null);
          setDirty(false);
          setDiscard(null);
          next?.();
        }}
      />

      {conflict && (
        <ConflictDialog
          open
          changedBy={conflict.details.changedBy ?? null}
          changedInVersion={conflict.details.changedInRevisionNo ?? null}
          latestText={contentPlain(conflict.details.currentContent)}
          myText={conflict.pending.myText ?? contentPlain(conflict.pending.block)}
          error={conflictError}
          onCancel={() => setConflict(null)}
          onUseLatest={() => {
            const latest = conflict.details.currentContent as BlockV2 | undefined;
            const mine = conflict.pending.myText ?? contentPlain(conflict.pending.block);
            void copyToClipboard(mine).then((ok) => notify({ message: ok ? "Teks Anda disalin ke papan klip" : "Teks Anda tidak dapat disalin otomatis", tone: ok ? "info" : "warn" }));
            const newBase = Math.max(conflict.details.changedInRevisionNo ?? 0, latestRevisionNo ?? 0) || undefined;
            if (latest && isEditableText(latest)) {
              setEdit({ pid: conflict.pending.pid, mode: "replace", original: latest, initialText: blockEditorText(latest), label: conflict.pending.label, listMode: latest.type === "list", base: newBase });
            } else {
              setEdit(null);
            }
            setDirty(false);
            setConflict(null);
            refreshAll();
          }}
          onKeepMine={async () => {
            const base = Math.max(conflict.details.changedInRevisionNo ?? 0, latestRevisionNo ?? 0, baseRevision);
            await doSave(conflict.pending, conflict.change, base);
          }}
        />
      )}

      <ParagraphHistory
        open={!!historyFor}
        id={id}
        pid={historyFor?.pid ?? null}
        label={historyFor?.label ?? "Paragraf"}
        slotLabels={slotLabels}
        onClose={() => setHistoryFor(null)}
        onReuse={
          readOnly
            ? undefined
            : (block) => {
                const h = historyFor;
                setHistoryFor(null);
                if (!h) return;
                const current = findBlock(doc, h.pid);
                guard(() => {
                  setEdit({ pid: h.pid, mode: "replace", original: current ?? block, initialText: blockEditorText(block), label: h.label, listMode: block.type === "list" });
                  setDirty(false);
                });
              }
        }
      />

      <FilePreviewDialog file={preview} caption={viewDetail?.document.title} onClose={() => setPreview(null)} />
    </div>
  );
}
