# Darlink v2 Phase 3 — Spec Patch

**Date**: 2026-05-05
**Patches**: `2026-05-05-darlink-v2-design.md` section 4
**Reason**: Pre-execution decision on pixel asset sourcing — rebase from PNG to SVG.

---

## Decision: Procedural SVG, not PNG

The original spec (section 4.1) called for 38+ PNG files (8 hair + 5 face + 10 top + 10 prop + 5 bg + 3 body + 8 palette JSON). Producing those PNGs requires either (a) hand-drawn pixel art, (b) AI image generation, or (c) sourcing from a free pack — each adds an asset pipeline that's a hard blocker for a code-only team.

**Replace with**: each part is a React component returning `<G>` (SVG group) of `<Rect>` / `<Path>` primitives sized to a 64×96 viewBox. Composer stacks 5-6 layers inside a single `<Svg>`.

### Why this works

- `react-native-svg` already installed (Phase 1 added it for `TapeStrip` / `DoodleIcon`)
- Pixel-aesthetic preserved: each part is a grid of integer-coordinate `<Rect>`s — visually pixel-shaped without anti-aliasing tricks
- Diff-able: each commit shows exact path data; reviewers can spot a typo in the SVG path
- Palette tinting via SVG `fill` attribute (no `tintColor` PNG hack)
- 100% deterministic — same inputs → same render, no asset bundle bloat

### Trade-offs

- Style budget: SVG primitives can't easily mimic dithering / gradients common in 16-bit pixel art. The aesthetic will look "flat pixel" rather than "retro game pixel". Acceptable for an avatar role.
- File count up: ~38 `.tsx` files in `src/components/pixel/parts/` (vs 38 PNGs in `assets/`). Tradeoff is filesystem clutter vs build pipeline simplicity. Going with code.
- If later we want true PNG quality, we can swap `<Rect>`-based parts for `<Image>`-based parts file-by-file; the composer interface stays stable.

---

## Updated 4.1 — Pixel parts file structure

```
src/components/pixel/
  features.ts                 # PixelFeatures type + enums
  PixelAvatar.tsx             # composer
  palette.ts                  # 8 palette objects (skin, hair, top, prop, bg color hex)
  famous.ts                   # 6 named-person feature presets (Phase 3 smoke)
  parts/
    body/
      male.tsx                # exports a <G> renderer fn
      female.tsx
      neutral.tsx
    hair/
      short.tsx  long.tsx  curly.tsx  bald.tsx
      bun.tsx    buzz.tsx   samurai.tsx  wave.tsx
    face/
      chill.tsx  serious.tsx  smile.tsx  glasses.tsx  wink.tsx
    top/
      hoodie.tsx  shirt.tsx  blazer.tsx  tee.tsx  jacket.tsx
      turtleneck.tsx  jersey.tsx  dress.tsx  uniform.tsx  varsity.tsx
    prop/
      book.tsx  laptop.tsx  coffee.tsx  mic.tsx  basketball.tsx
      rocket.tsx  iphone.tsx  flask.tsx  typewriter.tsx  guitar.tsx
    bg/
      library.tsx  cafe.tsx  dorm.tsx  street.tsx  studio.tsx
```

Each part component has signature:

```typescript
import React from 'react';
import { G } from 'react-native-svg';

type Props = {
  palette: PaletteColors;  // resolved colors from palette.ts (not the palette key)
};

export function HairCurly({ palette }: Props) {
  return (
    <G>
      <Rect x={X} y={Y} width={W} height={H} fill={palette.hair} />
      {/* ...more pixel rects to compose curly hair */}
    </G>
  );
}
```

The `palette` prop is resolved by the composer (`PixelAvatar`) from the user's `palette` enum value. Each part file imports nothing about which palette is active — it just paints with the colors handed in.

---

## Updated 4.2 — Composer

`src/components/pixel/PixelAvatar.tsx`:

```typescript
type PixelFeatures = {
  body: 'male' | 'female' | 'neutral';
  hair: 'short' | 'long' | 'curly' | 'bald' | 'bun' | 'buzz' | 'samurai' | 'wave';
  face: 'chill' | 'serious' | 'smile' | 'glasses' | 'wink';
  top: 'hoodie' | 'shirt' | ... ;
  prop: 'book' | ... | null;
  bg: 'library' | ... | null;
  palette: 'warm' | 'cool' | 'pastel' | 'mono' | 'earth' | 'candy' | 'forest' | 'sunset';
};

export function PixelAvatar({ features, size = 120 }: { features: PixelFeatures; size?: number }) {
  const palette = PALETTES[features.palette];
  const Body = BODIES[features.body];
  const Hair = HAIRS[features.hair];
  const Face = FACES[features.face];
  const Top = TOPS[features.top];
  const Prop = features.prop ? PROPS[features.prop] : null;
  const Bg = features.bg ? BGS[features.bg] : null;

  return (
    <Svg width={size} height={size * 1.5} viewBox="0 0 64 96">
      {Bg && <Bg palette={palette} />}
      <Body palette={palette} />
      <Top palette={palette} />
      <Hair palette={palette} />
      <Face palette={palette} />
      {Prop && <Prop palette={palette} />}
    </Svg>
  );
}
```

Layer order: bg → body → top → hair → face → prop. (Hair after top so hair drapes over collar; face after hair so eyes show through bangs; prop on top of everything.)

---

## Updated 4.3 — nuwa output

Unchanged from original spec — `nuwa.ts` `distillForUserByMode` already outputs `pixelFeatures` (Phase 2 Task 14 added the schema). Phase 3 Task P3-T8 only verifies LLM is actually using the enum hints + adds defensive validation that the LLM's output is in the enum (else fall back to `DEFAULT_PIXEL`).

---

## Updated 4.4 — Famous person smoke

Same 6 names. The smoke test is a **dev-only screen** at `app/_smoke.tsx` (private route, won't show in tabs) that renders the 6 PixelAvatars side-by-side with labels. To validate, run `expo start` and navigate to `/_smoke`. No automated comparison — pure visual review.

`src/components/pixel/famous.ts`:

```typescript
export const FAMOUS_PRESETS = {
  musk:    { features: { body: 'male', hair: 'short', face: 'serious', top: 'tee', prop: 'rocket', bg: 'studio', palette: 'cool' }, label: '马斯克' },
  jobs:    { features: { body: 'male', hair: 'bald', face: 'serious', top: 'turtleneck', prop: 'iphone', bg: 'studio', palette: 'mono' }, label: '乔布斯' },
  jordan:  { features: { body: 'male', hair: 'buzz', face: 'serious', top: 'jersey', prop: 'basketball', bg: 'street', palette: 'warm' }, label: '乔丹' },
  hemingway: { features: { body: 'male', hair: 'short', face: 'serious', top: 'shirt', prop: 'typewriter', bg: 'cafe', palette: 'warm' }, label: '海明威' },
  curie:   { features: { body: 'female', hair: 'bun', face: 'serious', top: 'dress', prop: 'flask', bg: 'library', palette: 'cool' }, label: '居里夫人' },
  wxl:     { features: { body: 'female', hair: 'wave', face: 'smile', top: 'dress', prop: 'mic', bg: 'studio', palette: 'pastel' }, label: '王心凌' },
} as const;
```

Note: original spec called for some attributes not in the enum (smirk / confident / thoughtful / beard / court / dock / lab / stage). With code-based parts I must use only the listed enums. Substitutions documented inline (e.g., `serious` in place of `smirk` / `confident` / `thoughtful`; `studio` in place of `court` / `dock` / `lab` / `stage`). If smoke render shows insufficient differentiation between Musk/Jobs/Hemingway (all have body=male, face=serious), Phase 3 will fail acceptance and require enum expansion in a follow-up.

---

## Acceptance change

Original 4.5 said "render 6 famous persons with ≥ 4/6 identifiability via blind test". With reduced enum diversity (face only has 5 values), 4/6 may not be achievable for all 6. **Revised acceptance**:

- All 6 famous presets render without error (no missing parts, no overflow)
- Composer in standalone use (with arbitrary feature combinations) renders without error
- Visual differentiation: at least 4/6 famous personae are distinguishable from each other when rendered side-by-side (Musk vs Jordan vs Curie should be obvious; Jobs vs Hemingway may look similar — acceptable for MVP)
- TypeScript clean (`npx tsc --noEmit -p .` exit 0)

---

## Out of scope (deferred from Phase 3)

- Animation (e.g., blinking, idle sway). Pure static avatars only.
- Per-user color customization (haircolor sliders etc.). The 8 palettes are fixed.
- Storing pixel art on Convex (avatars derived from `dh.pixelFeatures` at render time). No persistence needed beyond features.
