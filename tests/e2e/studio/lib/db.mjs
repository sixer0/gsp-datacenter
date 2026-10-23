// SR-52: akses DB v21 baca + pembersihan fixture berprefiks. Tidak pernah mencetak kredensial.
import pg from "pg";
import { assertV21 } from "./env.mjs";

export async function withDb(fn) {
  const client = new pg.Client({ connectionString: assertV21() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Sidik dokumen baca-saja: baris dokumen + jumlah revisi/blok/berkas/job per dokumen. */
export async function fingerprint(client, ids) {
  const out = {};
  for (const id of ids) {
    const d = await client.query(
      `SELECT id, "docNumber", "currentRevisionNo", "updatedAt", completeness::text AS c, title FROM "StudioDocument" WHERE id=$1`, [id]);
    const r = await client.query(`SELECT count(*)::int n, max("revisionNo") mx FROM "StudioRevision" WHERE "documentId"=$1`, [id]);
    const o = await client.query(`SELECT count(*)::int n FROM "StudioOutputFile" WHERE "documentId"=$1`, [id]);
    const j = await client.query(`SELECT count(*)::int n FROM "StudioRenderJob" WHERE "documentId"=$1`, [id]);
    const i = await client.query(`SELECT count(*)::int n FROM "StudioDocIdentity" WHERE "documentId"=$1`, [id]);
    out[id] = { doc: d.rows[0] ?? null, revisions: r.rows[0], outputs: o.rows[0].n, jobs: j.rows[0].n, identities: i.rows[0].n };
  }
  return out;
}
