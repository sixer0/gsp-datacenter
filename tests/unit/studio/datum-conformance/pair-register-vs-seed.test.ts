/**
 * L6 (D-610; review `verification/24_datum_rev_a_code_review.md` L6): register pasangan skor konformitas
 * (`benchmark/datum_conformance/lib/pairs.ts` PAIR_REGISTER) tetap oracle terpisah, tetapi wajib sama dengan
 * tabel spec seed (`prisma/seed-doc-type-templates.ts` DOC_TYPE_TEMPLATE_SPECS) untuk slug, kode jenis, tier, dan
 * bahasa (plus kicker sampul), agar perubahan spec tidak diam-diam menggeser gerbang S36/S45/S52.
 * `datum-gsp` adalah baris kalibrasi S25 skor, bukan templat seed Rev A, jadi tidak ikut dibandingkan.
 */
import { describe, expect, it } from 'vitest';
import { PAIR_REGISTER } from '../../../../benchmark/datum_conformance/lib/pairs';
import { DOC_TYPE_TEMPLATE_SPECS } from '../../../../prisma/seed-doc-type-templates';

const CALIBRATION_ONLY = new Set(['datum-gsp']);

const fromSpec = Object.fromEntries(
  DOC_TYPE_TEMPLATE_SPECS.map((s) => [
    s.slug,
    {
      language: s.layer['doc.language'],
      typeCode: s.layer['doc.defaultTypeCode'],
      tier: s.layer['doc.defaultTier'],
      kicker: s.slotOverrides?.cover?.['cover.kicker.text'],
    },
  ]),
);

const fromRegister = Object.fromEntries(Object.entries(PAIR_REGISTER).filter(([slug]) => !CALIBRATION_ONLY.has(slug)));

describe('L6: register pasangan skor = tabel spec seed', () => {
  it('himpunan slug sama (10 templat Rev A)', () => {
    expect(Object.keys(fromRegister).sort()).toEqual(Object.keys(fromSpec).sort());
    expect(Object.keys(fromSpec)).toHaveLength(10);
  });

  it('per slug: kode jenis, tier, bahasa, dan kicker sama', () => {
    for (const slug of Object.keys(fromSpec)) {
      expect({ slug, ...fromRegister[slug] }).toEqual({ slug, ...fromSpec[slug] });
    }
  });
});
