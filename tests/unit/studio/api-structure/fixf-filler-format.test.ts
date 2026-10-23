// FIX-F C1 (D-313): `lastFilledBy` / `by` / penulis SCOPE_CONFLICT = format kontrak terdokumentasi
// (`docs/STUDIO-AGENT-GUIDE.md`, `docs/API-REFERENCE.md`): berprefiks jenis pemanggil, sama dengan
// `requester` (`agent:<agentId>`, `anonymous-internal`, `user:<nama>`, `google:<email>`). Satu helper
// (`fillerOf`) dipakai semua jalur tulis v2; UI menampilkan label awam lewat `actorLabel` (D-297).
import { describe, expect, it } from 'vitest';
import { ANONYMOUS_INTERNAL_REQUESTER, REQUESTER_PREFIX } from '@/lib/studio/contract/auth';
import { AGENT_FILLER_PREFIX, ANONYMOUS_FILLER, fillerOf } from '@/lib/studio/services/submit/meta';
import { fillerOf as fillerOfBarrel } from '@/lib/studio/services/submit';
import { actorLabel } from '@/components/studio/shared/labels';

describe('fillerOf: format pengisi = kontrak (agent:<id>)', () => {
  it('INTERNAL_AGENT dengan agentId -> agent:<agentId> (bukan id mentah)', () => {
    expect(fillerOf({ kind: 'INTERNAL_AGENT', requester: 'agent:analis-01', agentId: 'analis-01' })).toBe('agent:analis-01');
    // pemanggil buatan tanpa requester berprefiks tetap menghasilkan format kontrak
    expect(fillerOf({ kind: 'INTERNAL_AGENT', requester: '', agentId: '  analis-02 ' })).toBe('agent:analis-02');
  });

  it('INTERNAL_AGENT tanpa agentId -> requester (anonymous-internal)', () => {
    expect(fillerOf({ kind: 'INTERNAL_AGENT', requester: ANONYMOUS_INTERNAL_REQUESTER, agentId: undefined })).toBe('anonymous-internal');
    expect(fillerOf({ kind: 'INTERNAL_AGENT', requester: ANONYMOUS_INTERNAL_REQUESTER, agentId: '   ' })).toBe('anonymous-internal');
  });

  it('sesi HQ/Google -> requester sesi; agentId badan diabaikan (label saja)', () => {
    expect(fillerOf({ kind: 'USER_SESSION', requester: 'user:budi', agentId: 'mengaku-agen' })).toBe('user:budi');
    expect(fillerOf({ kind: 'ADMIN_SESSION', requester: 'user:admin', agentId: undefined })).toBe('user:admin');
    expect(fillerOf({ kind: 'GOOGLE_SESSION', requester: 'google:a@b.id', agentId: 'x' })).toBe('google:a@b.id');
    expect(fillerOf(null)).toBe(ANONYMOUS_FILLER);
  });

  it('prefiks agen = REQUESTER_PREFIX.agent (satu sumber dengan contract/auth); ekspor barrel = helper yang sama', () => {
    expect(AGENT_FILLER_PREFIX).toBe(REQUESTER_PREFIX.agent);
    expect(fillerOfBarrel).toBe(fillerOf);
  });

  it('UI (shared/labels actorLabel, D-297) menampilkan label awam untuk format ini', () => {
    expect(actorLabel(fillerOf({ kind: 'INTERNAL_AGENT', requester: 'agent:analis-01', agentId: 'analis-01' }))).toBe('Agen analis-01');
    expect(actorLabel(fillerOf({ kind: 'USER_SESSION', requester: 'user:budi', agentId: undefined }))).toBe('budi');
  });
});
