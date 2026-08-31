// W1.3+W3.3 (N-1,N-2,N-3): unit test builder roster dinamis src/lib/agent-roster.ts.
// Dua sisi diuji: (a) perilaku murni lewat fixture disk sintetis — deterministik,
// tidak bergantung isi mesin; (b) scan disk NYATA mesin ini — membuktikan klaim
// exit criteria: tidak ada entri hantu, jumlah = folder profil, model bukan deepseek.
// Nilai secret tidak pernah dibaca/dicetak: fixture hanya memuat key model.*.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseModelLabel, buildRoster, PROFILE_META } from '@/lib/agent-roster';

const REAL_PROFILES_DIR = 'C:/Users/TRIAL/AppData/Local/hermes/profiles';

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

beforeAll(() => {
  // <fixtureRoot>/config.yaml  = profil root "default" (brahma)
  // <fixtureRoot>/profiles/{gsp-alpha,gsp-beta,user01}/config.yaml
  fixtureRoot = mkdtempSync(join(tmpdir(), 'roster-fixture-'));
  fixtureProfiles = join(fixtureRoot, 'profiles');
  writeFileSync(join(fixtureRoot, 'config.yaml'), CFG_ROOT);
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
    const roster = buildRoster(fixtureProfiles);
    const user01 = roster.find((a) => a.profile === 'user01')!;
    // user01 terikat akun RBAC → masuk controller-roster.json (kebijakan 31-08).
    expect(user01.group).toBe('controller');
    expect(user01.level).toBe(3);
    const beta = roster.find((a) => a.profile === 'gsp-beta')!;
    expect(beta.group).toBe('general');
    expect(beta.name).toBe('gsp-beta');
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

describe('buildRoster dari disk NYATA (exit criteria X: N-1/N-2/N-3)', () => {
  it('TIDAK ada entri hantu gsp-vendor-crawler-orchestrator (N-1)', () => {
    const roster = buildRoster(REAL_PROFILES_DIR);
    expect(roster.some((a) => a.id === 'gsp-vendor-crawler-orchestrator')).toBe(false);
    expect(roster.some((a) => a.profile === 'gsp-vendor-crawler-orchestrator')).toBe(false);
  });

  it('7 profil drift N-3 kini terdaftar (crawler-orchestrator + user RBAC)', () => {
    const roster = buildRoster(REAL_PROFILES_DIR);
    const profiles = new Set(roster.map((a) => a.profile));
    for (const p of ['gsp-crawler-orchestrator', 'user01', 'novriandy', 'firmanhidayat',
      'gsp-budi', 'gsp-creative', 'gsp-firman-custom']) {
      expect(profiles.has(p), `profil ${p} harus terdaftar`).toBe(true);
    }
  });

  it('jumlah entri = 1 root + jumlah folder profil di disk', () => {
    const roster = buildRoster(REAL_PROFILES_DIR);
    const dirs = readdirSync(REAL_PROFILES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory()).length;
    expect(roster.length).toBe(dirs + 1);
  });

  it('label model berasal dari config: tidak ada deepseek, mayoritas GSP-AI/auto-efficient (N-2)', () => {
    const roster = buildRoster(REAL_PROFILES_DIR);
    expect(roster.some((a) => /deepseek/i.test(a.model))).toBe(false);
    const gspai = roster.filter((a) => a.model === 'GSP-AI/auto-efficient').length;
    expect(gspai).toBeGreaterThanOrEqual(45);
    expect(roster.every((a) => a.model.length > 0)).toBe(true);
  });

  it('persona peta lama tetap utuh untuk agen terpetakan', () => {
    const roster = buildRoster(REAL_PROFILES_DIR);
    const ta = roster.find((a) => a.profile === 'gsp-task-architect')!;
    expect(ta.level).toBe(2);
    expect(ta.group).toBe('advisor');
    expect(ta.name).toBe('Task Architect');
  });
});
