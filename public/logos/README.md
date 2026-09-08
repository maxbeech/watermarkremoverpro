# Trusted-by logo assets

Referenced from `src/content/trusted-by.ts` and rendered by
`src/components/marketing/trusted-by.tsx`.

- `ledgeur.png`: copied from `ProductFactory/ledgeur/public/logo.png`, then
  resized to 128px tall with `sharp` to match the size convention in
  `scripts/build-logos.ts`.
- Every other `*.svg` for a product that ships its own icon (Bill100,
  Brandmity, Chartely, Contextely, Contract10, Denial7, Duebay, Feedlark,
  Grannio, JobPlumb, Ledgerary, Lugbird, Patent77, Patientary, PermitBird,
  PortRobin, RenewBird, Rigbird, RotaBay, Scoutern, Sourceory, TableHelm,
  Underhaus, Vouchity, Hi Crafty, GradeHack) is copied verbatim from that
  product's own `public/favicon.svg` (or `icon.svg` / `logo-mark.svg`), all
  same-family repos under `ProductFactory/`.
- The rest (WillThisHappen, Frifti, Benefily, Classify7, Conformery,
  DeckHelm, Event70, Job13, Ledgerage, Ledgerler, Mealary, Meterary,
  ModelCharter, RoofHelm, Screen100, Slopeify, Spend7, WageCoach) don't have a
  small icon-only brand asset of their own, so these are generated monogram
  marks in the same rounded-square style (64×64, `rx="14"`) so the row reads
  as one visual family rather than a mismatched collage. Regenerate with the
  script that produced them if the list changes: see git history for
  `scripts/_tmp-gen-logos.mts` (removed after running; the monogram palette
  lives in `src/content/trusted-by.ts`'s companion list if it needs
  reproducing).
