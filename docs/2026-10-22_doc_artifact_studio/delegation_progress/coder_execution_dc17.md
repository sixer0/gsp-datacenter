DC-17 complete. Added src/lib/studio/services/render/final-name.ts (I59-I62, C51-C53, local FinalFileNameParts) and tests/unit/studio/render/dc17-final-name.test.ts (38 tests).
Verification: vitest 38/38 pass; eslint final-name.ts exit 0; tsc --noEmit no output (clean at run time).
Note 1: register 14.1 places C50-C53 and T2-74 in L/contract (env.ts/types); copies here are identical, DC-05 may export them, then switch to import (avoid duplicate re-export from render/index).
Note 2: FN-03 artifact result is passed through docNumberSafe (identical for normal ids) so empty/over-80 ids still match C51.
