// S74: Prisma tiruan untuk uji route/layanan Studio TANPA DB nyata.
// Setiap `db.<model>.<metode>` adalah vi.fn yang dibuat saat pertama diakses;
// default-nya MELEMPAR ("unmocked") agar akses DB yang tidak diharapkan uji
// langsung terlihat (bukan diam-diam undefined). `$transaction(fn)` memanggil
// fn dengan `db` yang sama (callback interaktif) atau Promise.all (array).
// Modul ini sengaja hanya bergantung pada vitest: dipakai dari factory
// vi.mock('@/lib/prisma') sehingga tidak boleh menarik layanan Studio.
import { vi, type Mock } from 'vitest';

type AnyFn = (...a: any[]) => any;
type Model = Record<string, Mock<AnyFn>>;

const models = new Map<string, Model>();
const callLog: string[] = [];

function unmocked(name: string): AnyFn {
  return () => {
    throw new Error(`unmocked prisma call: ${name}`);
  };
}

function model(name: string): Model {
  let m = models.get(name);
  if (!m) {
    const fns: Model = {};
    m = new Proxy(fns, {
      get(target, method: string | symbol) {
        if (typeof method !== 'string') return undefined;
        if (!target[method]) {
          const full = `${name}.${method}`;
          const fn = vi.fn(unmocked(full)) as Mock<AnyFn>;
          target[method] = vi.fn((...args: any[]) => {
            callLog.push(full);
            return fn(...args);
          }) as Mock<AnyFn>;
          // Implementasi diatur lewat `.impl` (lihat `on`).
          (target[method] as unknown as { inner: Mock<AnyFn> }).inner = fn;
        }
        return target[method];
      },
    }) as Model;
    models.set(name, m);
  }
  return m;
}

const transaction = vi.fn(async (arg: unknown) => {
  callLog.push('$transaction');
  if (typeof arg === 'function') return (arg as (tx: unknown) => unknown)(db);
  if (Array.isArray(arg)) return Promise.all(arg);
  throw new Error('unsupported $transaction argument');
});

const executeRaw = vi.fn(async () => {
  callLog.push('$executeRaw');
  return 1;
});

export const db: any = new Proxy(
  {},
  {
    get(_t, key: string | symbol) {
      if (key === '$transaction') return transaction;
      if (key === '$executeRaw') return executeRaw;
      if (key === 'then') return undefined; // bukan thenable
      if (typeof key !== 'string') return undefined;
      return model(key);
    },
  },
);

/** Atur implementasi `db.<model>.<metode>`. */
export function on(modelName: string, method: string, impl: AnyFn): void {
  const fn = model(modelName)[method] as unknown as { inner: Mock<AnyFn> };
  fn.inner.mockImplementation(impl);
}

/** Panggilan ke `db.<model>.<metode>` (argumen per panggilan). */
export function callsOf(modelName: string, method: string): unknown[][] {
  return (model(modelName)[method] as Mock<AnyFn>).mock.calls;
}

/** Urutan semua akses DB sejak reset (`model.metode`, `$transaction`). */
export function dbCalls(): readonly string[] {
  return callLog;
}

/** Akses tulis (create/update/delete/upsert/executeRaw) sejak reset. */
export function dbWrites(): string[] {
  return callLog.filter((c) => /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)$/.test(c) || c === '$executeRaw');
}

export function resetDb(): void {
  models.clear();
  callLog.length = 0;
  transaction.mockClear();
  executeRaw.mockClear();
}

export function prismaModule() {
  return { prisma: db };
}

/**
 * SR-43: lupakan riwayat panggilan (callLog + mock.calls tiap metode) TANPA membuang
 * implementasi yang sudah dipasang - dipakai sesudah fixture menulis lewat layanan nyata.
 */
export function clearDbCalls(): void {
  callLog.length = 0;
  for (const m of models.values()) {
    for (const k of Object.keys(m)) (m[k] as Mock<AnyFn>).mockClear();
  }
  transaction.mockClear();
  executeRaw.mockClear();
}
