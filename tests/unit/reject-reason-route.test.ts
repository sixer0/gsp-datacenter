// FIX-RR (defect TRIAGE-0904D, kartu t_ff4b471d): keputusan REJECT wajib merekam
// alasan ke kolom result. Uji level RUTE terisolasi (seam = handler PATCH publik):
// prisma distub total (tanpa DB), guard sesi dilewati lewat x-internal-secret.
// Nilai expected ditulis independen dari implementasi (literal spec kartu).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const findUnique = vi.fn();
const update = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agentRequest: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      update: (...a: unknown[]) => update(...a),
    },
  },
}));

import { PATCH } from '@/app/api/brahma/requests/[id]/route';

function makeReq(body: unknown): Request {
  return new Request('https://127.0.0.1:9011/api/brahma/requests/r1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-internal-secret': 'unit-internal-secret' },
    body: JSON.stringify(body),
  });
}

const saved = { ...process.env };
beforeEach(() => {
  process.env = { ...saved };
  process.env.INTERNAL_API_SECRET = 'unit-internal-secret';
  findUnique.mockReset();
  update.mockReset();
  update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'r1',
    status: data.status,
    result: data.result ?? null,
  }));
});
afterEach(() => {
  process.env = saved;
});

const awaiting = { id: 'r1', status: 'awaiting_approval', prompt: 'p', result: null, error: null };
const params = { params: Promise.resolve({ id: 'r1' }) };

describe('PATCH reject menyimpan alasan (FIX-RR)', () => {
  it('reject dengan alasan → result "REJECTED BY USER: <alasan>"', async () => {
    findUnique.mockResolvedValue(awaiting);
    const res = await PATCH(makeReq({ action: 'reject', reason: 'duplikat dengan t_abc' }), params);
    expect(res.status).toBe(200);
    const data = update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.status).toBe('rejected');
    expect(data.result).toBe('REJECTED BY USER: duplikat dengan t_abc');
  });

  it('reject tanpa alasan → result "REJECTED BY USER: (tanpa alasan)"', async () => {
    findUnique.mockResolvedValue(awaiting);
    const res = await PATCH(makeReq({ action: 'reject' }), params);
    expect(res.status).toBe(200);
    const data = update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.status).toBe('rejected');
    expect(data.result).toBe('REJECTED BY USER: (tanpa alasan)');
  });

  it('reason whitespace-only diperlakukan kosong', async () => {
    findUnique.mockResolvedValue(awaiting);
    await PATCH(makeReq({ action: 'reject', reason: '   ' }), params);
    const data = update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.result).toBe('REJECTED BY USER: (tanpa alasan)');
  });

  it('reject tidak mengubah kolom lain selain status/result/decidedAt', async () => {
    findUnique.mockResolvedValue(awaiting);
    await PATCH(makeReq({ action: 'reject', reason: 'x' }), params);
    const data = update.mock.calls[0][0].data as Record<string, unknown>;
    expect(Object.keys(data).sort()).toEqual(['decidedAt', 'result', 'status']);
  });

  it('approve tidak ikut menulis result (regresi)', async () => {
    findUnique.mockResolvedValue(awaiting);
    await PATCH(makeReq({ action: 'approve' }), params);
    const data = update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.status).toBe('approved');
    expect('result' in data).toBe(false);
  });
});
