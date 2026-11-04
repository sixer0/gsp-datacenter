/**
 * S20: perakit DOCX sintetis untuk uji harness konformitas DATUM (tanpa mesin Studio).
 * Hanya bagian yang dibaca pembaca R0 (`research/32` §0.4) yang dibangkitkan.
 */
import { strToU8, zipSync } from 'fflate';

export const W_NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';

export interface KitSection {
  /** Isi blok seksi (paragraf/tabel) tanpa sectPr. */
  body: string;
  header?: string;
  footer?: string;
  /** Atribut tambahan sectPr, mis. pgNumType. */
  extraSectPr?: string;
  pgMar?: string;
}

export interface KitOptions {
  sections: KitSection[];
  styles?: string;
  theme?: string;
  extraParts?: Record<string, string | Uint8Array>;
}

const PG_SZ = '<w:pgSz w:w="11906" w:h="16838"/>';
const PG_MAR =
  '<w:pgMar w:top="1474" w:right="1134" w:bottom="1361" w:left="1361" w:header="737" w:footer="737" w:gutter="0"/>';

export function p(text: string, rPr = '', pPr = ''): string {
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

export function tbl(rows: string[][], tblPr = '', tcPr = ''): string {
  const tr = rows
    .map((r) => `<w:tr>${r.map((c) => `<w:tc>${tcPr ? `<w:tcPr>${tcPr}</w:tcPr>` : ''}${p(c)}</w:tc>`).join('')}</w:tr>`)
    .join('');
  const cols = rows[0]?.length ?? 0;
  const grid = `<w:tblGrid>${Array.from({ length: cols }, () => '<w:gridCol w:w="2000"/>').join('')}</w:tblGrid>`;
  return `<w:tbl><w:tblPr>${tblPr}</w:tblPr>${grid}${tr}</w:tbl>`;
}

export function buildDocx(opts: KitOptions): Uint8Array {
  const rels: string[] = [];
  const files: Record<string, Uint8Array> = {};
  let rid = 10;
  const bodyParts: string[] = [];
  opts.sections.forEach((s, i) => {
    const refs: string[] = [];
    if (s.header !== undefined) {
      const name = `header${i + 1}.xml`;
      const id = `rId${rid++}`;
      rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="${name}"/>`);
      files[`word/${name}`] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><w:hdr ${W_NS}>${s.header}</w:hdr>`);
      refs.push(`<w:headerReference w:type="default" r:id="${id}"/>`);
    }
    if (s.footer !== undefined) {
      const name = `footer${i + 1}.xml`;
      const id = `rId${rid++}`;
      rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="${name}"/>`);
      files[`word/${name}`] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><w:ftr ${W_NS}>${s.footer}</w:ftr>`);
      refs.push(`<w:footerReference w:type="default" r:id="${id}"/>`);
    }
    const sectPr = `<w:sectPr>${refs.join('')}${PG_SZ}${s.pgMar ?? PG_MAR}${s.extraSectPr ?? ''}</w:sectPr>`;
    if (i < opts.sections.length - 1) {
      bodyParts.push(`${s.body}<w:p><w:pPr>${sectPr}</w:pPr></w:p>`);
    } else {
      bodyParts.push(`${s.body}${sectPr}`);
    }
  });
  files['[Content_Types].xml'] = strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
  files['word/document.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><w:document ${W_NS}><w:body>${bodyParts.join('')}</w:body></w:document>`);
  files['word/_rels/document.xml.rels'] = strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`,
  );
  files['word/styles.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><w:styles ${W_NS}>${opts.styles ?? ''}</w:styles>`);
  files['word/settings.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><w:settings ${W_NS}/>`);
  if (opts.theme) files['word/theme/theme1.xml'] = strToU8(opts.theme);
  for (const [k, v] of Object.entries(opts.extraParts ?? {})) files[k] = typeof v === 'string' ? strToU8(v) : v;
  return zipSync(files);
}
