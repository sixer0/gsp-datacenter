/**
 * UI-04 (M-2): nama tampilan pelaku/misi yang tetap membawa ID mentah sebagai tooltip.
 * `actorLabel`/`missionLabel` membuang prefiks dan mengubah huruf (lossy); ID asli tetap
 * terjangkau lewat `title` tanpa memenuhi permukaan utama.
 */
import { actorLabel, missionLabel, rawIdTitle } from "./labels";

export function ActorName({ by, text, className }: { by: string | null | undefined; text?: string; className?: string }) {
  return (
    <span className={className} title={rawIdTitle(by)}>
      {text ?? actorLabel(by)}
    </span>
  );
}

export function MissionName({ folder, text, className }: { folder: string | null | undefined; text?: string; className?: string }) {
  return (
    <span className={className} title={rawIdTitle(folder)}>
      {text ?? missionLabel(folder)}
    </span>
  );
}
