// SR-49 diagnostik: bandingkan tanda isi PDF salinan out/pdf/<rev>-1.pdf vs -2.pdf.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pdfNormalizedSha256 } from '../_helpers';
const d = path.join(__dirname, '..', 'out', 'pdf');
for (const f of readdirSync(d).filter((x) => x.endsWith('-1.pdf'))) {
  const g = f.replace('-1.pdf', '-2.pdf');
  if (!existsSync(path.join(d, g))) continue;
  console.log(f, pdfNormalizedSha256(readFileSync(path.join(d, f))) === pdfNormalizedSha256(readFileSync(path.join(d, g))));
}
