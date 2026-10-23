/**
 * Pembacaan multipart berbatas untuk route Studio (IP-08, D-61).
 *
 * Modul terpisah dari `index.ts` karena menarik layanan gambar S53; hanya
 * route yang menerima unggahan mengimpornya (`@/lib/studio/http/multipart`).
 *
 * Urutan: `assertMultipartLength` (tolak dari header sebelum membaca, 413
 * `ASSET_TOO_LARGE`) -> baca berbatas `IMAGE_MAX_MULTIPART_BYTES` saat
 * streaming -> `formData()`. Galat dilempar sebagai StudioEngineError.
 */
import { StudioEngineError } from "@/lib/studio/contract/errors";
import { assertMultipartLength, IMAGE_MAX_MULTIPART_BYTES } from "@/lib/studio/services/images";
import { readBodyBytes } from "./body";

export { assertMultipartLength, IMAGE_MAX_MULTIPART_BYTES };

export function isMultipart(contentType: string | null): boolean {
  return /^multipart\/form-data\b/i.test(contentType ?? "");
}

export async function readMultipartForm(req: Request, contentType: string, limit: number = IMAGE_MAX_MULTIPART_BYTES): Promise<FormData> {
  assertMultipartLength(req.headers);
  const raw = await readBodyBytes(req, limit, "ASSET_TOO_LARGE");
  try {
    return await new Response(raw, { headers: { "content-type": contentType } }).formData();
  } catch {
    throw new StudioEngineError("JSON_MALFORMED", "Multipart body could not be parsed");
  }
}
