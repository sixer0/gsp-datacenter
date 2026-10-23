/**
 * S93 data guard: validate a studio.doc/v1 JSON file against the contract schema.
 *
 * Builds ajv exactly as the contract prescribes (STUDIO_SCHEMA_LOAD_ORDER + STUDIO_AJV_OPTIONS,
 * 01_specs.md §3.10) and prints `{ pointer, keyword, message }` per error.
 *
 * Usage: npx tsx benchmark/extract/validate_doc.ts [path/to/doc.json]   (default benchmark/manual000/doc.json)
 * Exit: 0 valid, 1 invalid, 2 input error.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { DOC_SCHEMA_ID, STUDIO_AJV_OPTIONS, STUDIO_SCHEMA_LOAD_ORDER } from "../../src/lib/studio/contract";

function main(): number {
  const file = path.resolve(process.argv[2] ?? path.join(__dirname, "..", "manual000", "doc.json"));
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    console.error(`input error: ${file}: ${(e as Error).message}`);
    return 2;
  }
  const ajv = new Ajv2020({ ...STUDIO_AJV_OPTIONS });
  for (const schema of STUDIO_SCHEMA_LOAD_ORDER) ajv.addSchema(schema as object);
  const validate = ajv.getSchema(DOC_SCHEMA_ID);
  if (!validate) {
    console.error(`schema ${DOC_SCHEMA_ID} not registered`);
    return 2;
  }
  const ok = validate(doc) as boolean;
  if (ok) {
    console.log(`VALID studio.doc/v1: ${file}`);
    return 0;
  }
  const errors = validate.errors ?? [];
  console.log(`INVALID studio.doc/v1: ${file} (${errors.length} errors)`);
  for (const e of errors.slice(0, 50)) {
    console.log(JSON.stringify({ pointer: e.instancePath, keyword: e.keyword, message: e.message, params: e.params }));
  }
  return 1;
}

process.exit(main());
