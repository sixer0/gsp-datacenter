"use client";

/*
 * Dialog "Buat dokumen" untuk misi (SR-30; D-153, UX-01 §3b W5).
 *
 * R04 POST `studio.doc/v2` tanpa `sections` -> dokumen kosong berkerangka
 * (semua bagian berstatus awal). Versi templat terbaru dipatok saat dibuat.
 * Kunci dokumen misi dibangkitkan dari judul (tidak ditampilkan) agar dua
 * dokumen bertemplat sama dalam satu misi tetap terpisah. Bila dokumen dengan
 * kunci sama sudah ada, layanan mengembalikan dokumen itu (`created: false`)
 * -> pengguna ditawari membukanya. 409 META_CONFLICT / TEMPLATE_MISMATCH ->
 * pesan awam + tautan ke dokumen misi.
 */
import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Skeleton } from "@/components/ui/kit";
import { Sheet } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { ErrorView } from "@/components/studio/shared/error-view";
import { isStudioApiError } from "@/components/studio/shared/http";
import { missionLabel } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { STUDIO_NAV } from "@/lib/studio/contract/ui";
import { createDocument, listTemplates } from "./doc-api";
import { MISSION_FOLDER_RE, docKeyFromTitle } from "./doc-model";

const DOCS_HREF = STUDIO_NAV.find((n) => n.href.endsWith("/documents"))?.href ?? "/studio/documents";
const FIELD =
  "w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-[invalid=true]:border-[var(--down)]";

export function CreateDocumentDialog({
  open,
  onClose,
  knownMissions,
  initialMission,
}: {
  open: boolean;
  onClose: () => void;
  /** Folder misi yang sudah punya dokumen (saran isian). */
  knownMissions: readonly string[];
  initialMission?: string;
}) {
  const router = useRouter();
  const { notify } = useNotice();
  const ids = useId();
  const [mission, setMission] = useState(initialMission ?? "");
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; openId?: string; missionLink?: string } | null>(null);

  const templates = useStudioQuery(open ? "studio-templates" : null, (signal) => listTemplates(signal), { source: "documents.templates" });
  const usable = useMemo(() => (templates.data?.templates ?? []).filter((t) => !t.archived && !t.isPreset), [templates.data]);
  const chosen = usable.find((t) => t.id === templateId) ?? usable[0] ?? null;

  const missionOk = MISSION_FOLDER_RE.test(mission.trim());
  const titleOk = title.trim().length > 0 && title.trim().length <= 200;

  async function submit() {
    setTried(true);
    setError(null);
    if (!missionOk || !titleOk || !chosen || busy) return;
    setBusy(true);
    try {
      const folder = mission.trim();
      const r = await createDocument({
        template: { slug: chosen.slug },
        mission: { folder },
        docKey: docKeyFromTitle(title.trim()),
        meta: { title: title.trim() },
      });
      if (!r.created) {
        setError({ text: "Dokumen dengan judul ini sudah ada untuk misi tersebut. Tidak ada dokumen baru yang dibuat.", openId: r.document.id });
        return;
      }
      notify({ message: `Dokumen dibuat: ${title.trim()}` });
      onClose();
      router.push(`${DOCS_HREF}/${encodeURIComponent(r.document.id)}`);
    } catch (e) {
      const conflict = isStudioApiError(e) && (e.code === "META_CONFLICT" || e.code === "TEMPLATE_MISMATCH");
      const m = errorMessages(e, { subject: "Templat" });
      setError({
        text: conflict ? `${m.title}. Dokumen untuk misi ini dengan judul serupa sudah ada dengan data berbeda.` : `${m.title}. ${m.body}`,
        missionLink: conflict ? `${DOCS_HREF}?mission=${encodeURIComponent(mission.trim())}` : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  const missionInvalid = tried && !missionOk;
  const titleInvalid = tried && !titleOk;

  return (
    <Sheet
      open={open}
      title="Buat dokumen"
      description="Dokumen kosong dengan susunan dari templat. Agen mengisi bagian-bagiannya kemudian."
      onClose={onClose}
      placement="center"
      dismissible={!busy}
      footer={
        <>
          <Button size="sm" onClick={onClose} ariaDisabled={busy} className="whitespace-nowrap">
            Batal
          </Button>
          <Button size="sm" variant="primary" onClick={() => void submit()} ariaDisabled={busy || !chosen} className="whitespace-nowrap">
            {busy ? "Membuat…" : "Buat dokumen"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-1">
          <label htmlFor={`${ids}-m`} className="block text-[12.5px] font-medium text-[var(--text)]">
            Misi <span className="font-normal text-[var(--text-2)]">(wajib)</span>
          </label>
          <input
            id={`${ids}-m`}
            list={`${ids}-ml`}
            value={mission}
            onChange={(e) => setMission(e.target.value.toLowerCase())}
            placeholder="2026-10-23_misi_a"
            aria-invalid={missionInvalid || undefined}
            aria-describedby={`${ids}-mh`}
            className={FIELD}
          />
          <datalist id={`${ids}-ml`}>
            {knownMissions.map((m) => (
              <option key={m} value={m}>
                {missionLabel(m)}
              </option>
            ))}
          </datalist>
          <p id={`${ids}-mh`} className={`text-[12px] ${missionInvalid ? "text-[var(--down)]" : "text-[var(--text-2)]"}`}>
            {missionInvalid
              ? "Tulis folder misi dengan tanggal di depan, huruf kecil, misalnya 2026-10-23_misi_a."
              : missionOk
                ? `Tampil sebagai: ${missionLabel(mission.trim())}`
                : "Folder misi HQ, misalnya 2026-10-23_misi_a."}
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor={`${ids}-t`} className="block text-[12.5px] font-medium text-[var(--text)]">
            Judul <span className="font-normal text-[var(--text-2)]">(wajib)</span>
          </label>
          <input
            id={`${ids}-t`}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Laporan Inspeksi Gardu Induk"
            aria-invalid={titleInvalid || undefined}
            aria-describedby={titleInvalid ? `${ids}-te` : undefined}
            className={FIELD}
          />
          {titleInvalid && (
            <p id={`${ids}-te`} className="text-[12px] text-[var(--down)]">
              Judul wajib diisi.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor={`${ids}-tp`} className="block text-[12.5px] font-medium text-[var(--text)]">
            Templat
          </label>
          {templates.isLoading && <Skeleton className="h-9 w-full" />}
          {templates.error && !templates.data && (
            <ErrorView variant="inline" error={templates.error} onRetry={templates.retry} cooldown={templates.cooldown} title="Daftar templat tidak dapat dimuat" />
          )}
          {templates.data && usable.length === 0 && <p className="text-[12.5px] text-[var(--text-2)]">Belum ada templat. Buat templat lebih dulu di halaman Templat.</p>}
          {usable.length > 0 && (
            <>
              <select id={`${ids}-tp`} value={chosen?.id ?? ""} onChange={(e) => setTemplateId(e.target.value)} aria-describedby={`${ids}-tph`} className={FIELD}>
                {usable.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {chosen && (
                <p id={`${ids}-tph`} className="text-[12px] text-[var(--text-2)]">
                  Dokumen akan memakai {chosen.name} versi {chosen.latestVersionNo} dan tidak berubah bila templat diubah nanti.
                </p>
              )}
            </>
          )}
        </div>

        {error && (
          <div role="alert" className="space-y-2 text-[12.5px]">
            <p className="text-[var(--down)]">{error.text}</p>
            {error.openId && (
              <Button size="sm" href={`${DOCS_HREF}/${encodeURIComponent(error.openId)}`} className="whitespace-nowrap">
                Buka dokumen yang ada
              </Button>
            )}
            {error.missionLink && (
              <Button size="sm" href={error.missionLink} className="whitespace-nowrap">
                Buka dokumen misi ini
              </Button>
            )}
          </div>
        )}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Sheet>
  );
}
