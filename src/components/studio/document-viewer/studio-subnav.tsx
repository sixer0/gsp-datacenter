"use client";

/*
 * Sub-navigasi Studio (S60; FIX-4a). Diturunkan dari `STUDIO_NAV` kontrak
 * (satu sumber, S86 R14): urutan Beranda, Dokumen, Templat, Galeri artefak;
 * untuk ADMIN ditambah pemisah lalu Alat developer dan Sistem (UX-01 §2.2-§2.3).
 * Penyembunyian hanya kenyamanan; server tetap menegakkan peran.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STUDIO_NAV, studioNavFor, type StudioNavEntry } from "@/lib/studio/contract/ui";
import { useViewer } from "@/components/studio/shared/use-viewer";

function isActive(entry: StudioNavEntry, pathname: string): boolean {
  return entry.exact ? pathname === entry.href : pathname === entry.href || pathname.startsWith(entry.href + "/");
}

function NavPill({ entry, active }: { entry: StudioNavEntry; active: boolean }) {
  const Icon = entry.icon;
  return (
    <Link
      href={entry.href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        active
          ? "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line-strong)]"
          : "border border-transparent text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-1)]"
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${active ? "text-[var(--accent)]" : "text-[var(--text-3)]"}`} strokeWidth={2} aria-hidden />
      {entry.shortLabel}
    </Link>
  );
}

export function StudioSubnav() {
  const pathname = usePathname() ?? "";
  const { isAdmin } = useViewer();
  const entries = studioNavFor(isAdmin, STUDIO_NAV);
  const main = entries.filter((e) => e.audience === "all");
  const admin = entries.filter((e) => e.audience === "admin");
  // UI-02 (UA-m06): gradasi tepi kanan di ponsel sebagai isyarat dapat digeser.
  return (
    <nav aria-label="Navigasi Studio" className="-mx-1 overflow-x-auto [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:[mask-image:none]">
      <ul className="flex min-w-max items-center gap-1 py-1 pl-1 pr-10 sm:pr-1">
        {main.map((entry) => (
          <li key={entry.href}>
            <NavPill entry={entry} active={isActive(entry, pathname)} />
          </li>
        ))}
        {admin.length > 0 && (
          <>
            <li aria-hidden className="mx-1.5 h-4 w-px bg-[var(--line-strong)]" />
            {admin.map((entry) => (
              <li key={entry.href}>
                <NavPill entry={entry} active={isActive(entry, pathname)} />
              </li>
            ))}
          </>
        )}
      </ul>
    </nav>
  );
}
