// W1.3+W3.3 (N-1,N-2,N-3): unit test builder roster dinamis src/lib/agent-roster.ts.
// Dua sisi diuji: (a) perilaku murni lewat fixture disk sintetis — deterministik,
// tidak bergantung isi mesin (termasuk controller-roster.json milik fixture);
// (b) scan disk NYATA mesin ini — sifat fleet terkonsolidasi, dilewati bila
// folder profil / PROFILE-REGISTRY.json tidak ada.
// Nilai secret tidak pernah dibaca/dicetak: fixture hanya memuat key model.*.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parseModelLabel, buildRoster, PROFILE_META } from '@/lib/agent-roster';

const REAL_PROFILES_DIR =
  process.env.HERMES_PROFILES_DIR || 'C:/Users/TRIAL/AppData/Local/hermes/profiles';

const CFG_GSP = `model:
  default: auto-efficient
  provider: GSP-AI
  base_url: http://127.0.0.1:1/v1
  api_key: \${SOME_ENV_VAR_NOT_READ}
agent:
  max_turns: 150
`;
const CFG_ROOT = `model:
  default: auto-efficient
  provider: GSP-AI
`;

let fixtureRoot: string;
let fixtureProfiles: string;
let fixtureControllers: string;

beforeAll(() => {
  // <fixtureRoot>/config.yaml  = profil root "default" (brahma)
  // <fixtureRoot>/profiles/{gsp-alpha,gsp-beta,user01}/config.yaml
  // <fixtureRoot>/controller-roster.json = roster kanonis milik fixture sendiri,
  // agar uji tidak bergantung pada controller-roster.json mesin ini.
  fixtureRoot = mkdtempSync(join(tmpdir(), 'roster-fixture-'));
  fixtureProfiles = join(fixtureRoot, 'profiles');
  fixtureControllers = join(fixtureRoot, 'controller-roster.json');
  writeFileSync(join(fixtureRoot, 'config.yaml'), CFG_ROOT);
  writeFileSync(fixtureControllers, JSON.stringify({ controllers: ['default', 'user01'] }));
  for (const p of ['gsp-alpha', 'gsp-beta', 'user01']) {
    mkdirSync(join(fixtureProfiles, p), { recursive: true });
    writeFileSync(join(fixtureProfiles, p, 'config.yaml'), CFG_GSP);
  }
});

afterAll(() => {
  if (fixtureRoot) rmSync(fixtureRoot, { recursive: true, force: true });
});

describe('parseModelLabel (N-2: label model dari config, bukan hardcoded)', () => {
  it('memakai HANYA blok model: top-level — default+provider tergabung', () => {
    expect(parseModelLabel(CFG_GSP)).toBe('GSP-AI/auto-efficient');
  });

  it('baris api_key/base_url tidak pernah ikut jadi label', () => {
    const label = parseModelLabel(CFG_GSP);
    expect(label).not.toMatch(/api_key|base_url|SOME_ENV/i);
  });

  it('tanpa blok model → unknown (bukan crash, bukan deepseek)', () => {
    expect(parseModelLabel('agent:\n  max_turns: 10\n')).toBe('unknown');
  });

  it('label deepseek lama tidak bisa muncul dari config yang benar', () => {
    expect(parseModelLabel(CFG_GSP)).not.toMatch(/deepseek/i);
  });
});

describe('buildRoster dari fixture disk sintetis', () => {
  it('satu entri per folder profil + root default → id brahma', () => {
    const roster = buildRoster(fixtureProfiles);
    expect(roster).toHaveLength(4);
    const ids = roster.map((a) => a.id).sort();
    expect(ids).toEqual(['brahma', 'gsp-alpha', 'gsp-beta', 'user01']);
  });

  it('profil dengan peta persona memakai meta lama (name/emoji/group)', () => {
    const roster = buildRoster(fixtureProfiles);
    const brahma = roster.find((a) => a.id === 'brahma')!;
    expect(brahma.profile).toBe('default');
    expect(brahma.level).toBe(1);
    expect(brahma.group).toBe('core');
    expect(brahma.name).toBe(PROFILE_META['default'].name);
  });

  it('profil baru tanpa peta → fallback: controller bila di roster kanonis, else general', () => {
    const roster = buildRoster(fixtureProfiles, { controllerRosterFile: fixtureControllers });
    const user01 = roster.find((a) => a.profile === 'user01')!;
    // user01 tercantum di controller-roster.json milik fixture (kebijakan 31-08).
    expect(user01.group).toBe('controller');
    expect(user01.level).toBe(3);
    const beta = roster.find((a) => a.profile === 'gsp-beta')!;
    expect(beta.group).toBe('general');
    expect(beta.name).toBe('gsp-beta');
  });

  it('roster kanonis tak terbaca → daftar fallback tertanam, profil tak dikenal → general', () => {
    const roster = buildRoster(fixtureProfiles, {
      controllerRosterFile: join(fixtureRoot, 'tidak-ada.json'),
    });
    const user01 = roster.find((a) => a.profile === 'user01')!;
    expect(user01.group).toBe('general');
    expect(user01.role).toBe('Profil Hermes · dinamis');
  });

  it('semua entri punya shape respons yang dibutuhkan dashboard', () => {
    for (const a of buildRoster(fixtureProfiles)) {
      expect(typeof a.id).toBe('string');
      expect(typeof a.profile).toBe('string');
      expect(typeof a.name).toBe('string');
      expect(typeof a.emoji).toBe('string');
      expect(typeof a.role).toBe('string');
      expect(typeof a.model).toBe('string');
      expect(typeof a.level).toBe('number');
      expect(typeof a.group).toBe('string');
    }
  });

  it('direktori tidak terbaca → throw (kontrak: caller yang memutuskan fallback)', () => {
    expect(() => buildRoster(join(fixtureRoot, 'tidak-ada'))).toThrow();
  });
});

// Fleet terkonsolidasi (PROF-MERGE-1010, 2026-10-10): roster per-peran diganti
// profil umum gsp-thinker / gsp-worker / gsp-worker-fast + profil manajemen &
// user. Uji disk nyata hanya menegaskan SIFAT yang berlaku untuk fleet sah
// mana pun — tanpa nama/jumlah hardcoded — dan dilewati di mesin lain.
const REAL_REGISTRY_FILE =
  process.env.HERMES_PROFILE_REGISTRY ||
  'C:/Users/TRIAL/workspace/gsp-hermes/workspace/fleet/PROFILE-REGISTRY.json';
const WORKER_PROFILES = ['gsp-thinker', 'gsp-worker', 'gsp-worker-fast'];
// Grup level-3 yang benar-benar dirender src/app/agents/page.tsx dan
// src/app/orchestration/page.tsx; grup "general" tidak tampil di peta.
const RENDERED_L3_GROUPS = ['controller', 'analysis', 'execution', 'verification', 'utility'];

function readLiveProfiles(): string[] | null {
  try {
    const j = JSON.parse(readFileSync(REAL_REGISTRY_FILE, 'utf8'));
    return Array.isArray(j.hidup) ? j.hidup.filter((p: unknown) => typeof p === 'string') : null;
  } catch {
    return null;
  }
}

const liveProfiles = readLiveProfiles();
const realDiskAvailable = existsSync(REAL_PROFILES_DIR) && liveProfiles !== null;
const skipNote = realDiskAvailable
  ? ''
  : ` [DILEWATI: ${!existsSync(REAL_PROFILES_DIR) ? `folder profil ${REAL_PROFILES_DIR}` : `registry ${REAL_REGISTRY_FILE}`} tidak ada/tak terbaca di mesin ini]`;

describe.skipIf(!realDiskAvailable)(`buildRoster dari disk NYATA (fleet terkonsolidasi)${skipNote}`, () => {
  const roster = () => buildRoster(REAL_PROFILES_DIR);

  it('setiap profil hidup di PROFILE-REGISTRY.json yang ada di disk muncul di roster', () => {
    const profiles = new Set(roster().map((a) => a.profile));
    const onDisk = liveProfiles!.filter(
      (p) => p === 'default' || existsSync(join(REAL_PROFILES_DIR, p)),
    );
    expect(onDisk.length).toBeGreaterThan(0);
    for (const p of onDisk) expect(profiles.has(p), `profil hidup ${p} harus terdaftar`).toBe(true);
  });

  it('gsp-thinker, gsp-worker, gsp-worker-fast hadir dengan peran yang jelas dan grup yang dirender', () => {
    const byProfile = new Map(roster().map((a) => [a.profile, a]));
    for (const p of WORKER_PROFILES) {
      const a = byProfile.get(p);
      expect(a, `profil pekerja ${p} harus ada di roster`).toBeDefined();
      expect(a!.role).not.toBe('Profil Hermes · dinamis');
      expect(a!.name).not.toBe(p);
      expect(a!.level).toBe(3);
      expect(RENDERED_L3_GROUPS).toContain(a!.group);
    }
  });

  it('jumlah entri = 1 root + jumlah folder profil di disk', () => {
    const dirs = readdirSync(REAL_PROFILES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'default').length;
    expect(roster().length).toBe(dirs + 1);
  });

  it('tanpa duplikat id maupun profil', () => {
    const r = roster();
    expect(new Set(r.map((a) => a.id)).size).toBe(r.length);
    expect(new Set(r.map((a) => a.profile)).size).toBe(r.length);
  });

  it('label model berasal dari config.yaml tiap profil (N-2), bukan label hardcoded', () => {
    // parseModelLabel sendiri dikunci literal di blok atas; di sini yang diuji
    // adalah wiring: tiap entri membaca config.yaml miliknya (root: ../config.yaml).
    for (const a of roster()) {
      const cfg =
        a.profile === 'default'
          ? join(dirname(REAL_PROFILES_DIR), 'config.yaml')
          : join(REAL_PROFILES_DIR, a.profile, 'config.yaml');
      const expected = existsSync(cfg) ? parseModelLabel(readFileSync(cfg, 'utf8')) : 'unknown';
      expect(a.model, `model ${a.profile}`).toBe(expected);
      expect(a.model.length).toBeGreaterThan(0);
    }
    expect(roster().some((a) => /deepseek/i.test(a.model))).toBe(false);
  });

  it('TIDAK ada entri hantu gsp-vendor-crawler-orchestrator (N-1)', () => {
    expect(roster().some((a) => a.profile === 'gsp-vendor-crawler-orchestrator')).toBe(false);
  });

  it('agen yang punya peta persona memakai persona itu apa adanya', () => {
    for (const a of roster()) {
      const meta = PROFILE_META[a.profile];
      if (!meta) continue;
      expect({ name: a.name, emoji: a.emoji, role: a.role, level: a.level, group: a.group }).toEqual(meta);
    }
  });
});
