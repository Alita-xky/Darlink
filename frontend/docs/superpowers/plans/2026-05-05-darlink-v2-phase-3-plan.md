# Darlink v2 Phase 3 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement procedural-SVG pixel-avatar parts library + composer + 6 famous-person smoke test, then wire into home tab DH cards.

**Architecture:** Each pixel part is a React component returning an `<G>` of `<Rect>` primitives at integer coordinates inside a 64×96 SVG viewBox. Composer (`PixelAvatar`) stacks 5-6 layers in z-order. Palette colors injected as props. No external assets.

**Tech Stack:** React Native + Expo, react-native-svg (already installed).

**Spec reference:** `docs/superpowers/specs/2026-05-05-darlink-v2-design.md` section 4 + patch `docs/superpowers/specs/2026-05-05-darlink-v2-phase-3-spec-patch.md`.

**Branch:** `phase-3-pixel` (off `worktree-v2-phase-1-and-2`).

---

## File structure (new in this phase)

```
src/components/pixel/
  features.ts          # PixelFeatures type + enum exports + DEFAULT_FEATURES
  palette.ts           # 8 palette objects
  PixelAvatar.tsx      # composer
  famous.ts            # 6 famous presets
  parts/
    body/{male,female,neutral}.tsx       # 3 files
    hair/{short,long,curly,bald,bun,buzz,samurai,wave}.tsx  # 8
    face/{chill,serious,smile,glasses,wink}.tsx              # 5
    top/{hoodie,shirt,blazer,tee,jacket,turtleneck,jersey,dress,uniform,varsity}.tsx  # 10
    prop/{book,laptop,coffee,mic,basketball,rocket,iphone,flask,typewriter,guitar}.tsx  # 10
    bg/{library,cafe,dorm,street,studio}.tsx                 # 5

app/_smoke.tsx         # dev-only smoke render of 6 famous + free-form pickers (private route, _-prefix)

# Modified files:
app/(tabs)/index.tsx   # DH card avatar uses <PixelAvatar features={dh.pixelFeatures}>
convex/nuwa.ts         # validate LLM output's pixel_features against enum, fall back to DEFAULT_PIXEL on mismatch
```

---

## Conventions for SVG part files

Every part file exports a default React component named with PascalCase (e.g., `HairCurly`, `BodyMale`).

Signature:
```typescript
import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function HairCurly({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      <Rect x={20} y={6} width={4} height={4} fill={palette.hair} />
      {/* ... */}
    </G>
  );
}
```

Coordinate system: 64×96 viewBox. Body is roughly y=20-72 (head 20-44, torso 44-72), legs 72-96.

Pixel grid: each "pixel" is 4 SVG units (so 16 columns × 24 rows of pixels). All `<Rect>` width/height are multiples of 4. Forces a consistent pixel grain.

Color tokens passed via `palette` prop (drawn from `palette.ts`):
- `palette.skin` — face / arms / legs
- `palette.hair` — hair primary
- `palette.hairShade` — hair shadow
- `palette.top` — clothing primary
- `palette.topShade` — clothing shadow
- `palette.prop` — prop primary
- `palette.bg` — background
- `palette.outline` — '#1F1F1F' (always black; included for consistency)

---

# Tasks

## Task 1: Create `features.ts` + `palette.ts` + parts directory structure + body parts

**Files:**
- Create: `src/components/pixel/features.ts`
- Create: `src/components/pixel/palette.ts`
- Create: `src/components/pixel/parts/body/{male,female,neutral}.tsx`

- [ ] **Step 1: features.ts**

```typescript
export const HAIR_VALUES = ['short','long','curly','bald','bun','buzz','samurai','wave'] as const;
export const FACE_VALUES = ['chill','serious','smile','glasses','wink'] as const;
export const TOP_VALUES = ['hoodie','shirt','blazer','tee','jacket','turtleneck','jersey','dress','uniform','varsity'] as const;
export const PROP_VALUES = ['book','laptop','coffee','mic','basketball','rocket','iphone','flask','typewriter','guitar'] as const;
export const BG_VALUES = ['library','cafe','dorm','street','studio'] as const;
export const BODY_VALUES = ['male','female','neutral'] as const;
export const PALETTE_VALUES = ['warm','cool','pastel','mono','earth','candy','forest','sunset'] as const;

export type Hair = typeof HAIR_VALUES[number];
export type Face = typeof FACE_VALUES[number];
export type Top = typeof TOP_VALUES[number];
export type Prop = typeof PROP_VALUES[number];
export type Bg = typeof BG_VALUES[number];
export type Body = typeof BODY_VALUES[number];
export type Palette = typeof PALETTE_VALUES[number];

export type PixelFeatures = {
  body: Body;
  hair: Hair;
  face: Face;
  top: Top;
  prop: Prop | null;
  bg: Bg | null;
  palette: Palette;
};

export const DEFAULT_FEATURES: PixelFeatures = {
  body: 'neutral',
  hair: 'short',
  face: 'chill',
  top: 'tee',
  prop: null,
  bg: null,
  palette: 'pastel',
};

export function isValidPixelFeatures(x: unknown): x is PixelFeatures {
  if (!x || typeof x !== 'object') return false;
  const f = x as Record<string, unknown>;
  return (
    BODY_VALUES.includes(f.body as Body) &&
    HAIR_VALUES.includes(f.hair as Hair) &&
    FACE_VALUES.includes(f.face as Face) &&
    TOP_VALUES.includes(f.top as Top) &&
    (f.prop === null || PROP_VALUES.includes(f.prop as Prop)) &&
    (f.bg === null || BG_VALUES.includes(f.bg as Bg)) &&
    PALETTE_VALUES.includes(f.palette as Palette)
  );
}
```

- [ ] **Step 2: palette.ts**

```typescript
export type PaletteColors = {
  skin: string;
  hair: string;
  hairShade: string;
  top: string;
  topShade: string;
  prop: string;
  bg: string;
  outline: string;
};

export const PALETTES: Record<string, PaletteColors> = {
  warm:    { skin: '#F5C09F', hair: '#5C3A1E', hairShade: '#3A2611', top: '#E8745C', topShade: '#A04A38', prop: '#F5D14A', bg: '#FFF1E0', outline: '#1F1F1F' },
  cool:    { skin: '#E8C39E', hair: '#2A3F66', hairShade: '#1A2440', top: '#5C7AB4', topShade: '#384C73', prop: '#A4D4E6', bg: '#E8F0FA', outline: '#1F1F1F' },
  pastel:  { skin: '#F5D5C0', hair: '#A47AAA', hairShade: '#73557D', top: '#F5B5C8', topShade: '#C97C99', prop: '#C9E5C0', bg: '#FFF8E7', outline: '#1F1F1F' },
  mono:    { skin: '#D4D4D4', hair: '#2A2A2A', hairShade: '#0F0F0F', top: '#1F1F1F', topShade: '#0A0A0A', prop: '#999999', bg: '#F0F0F0', outline: '#1F1F1F' },
  earth:   { skin: '#C9A37A', hair: '#4A3320', hairShade: '#2D1F12', top: '#7A6440', topShade: '#4D3F26', prop: '#A88555', bg: '#E5DCC8', outline: '#1F1F1F' },
  candy:   { skin: '#FFD5C0', hair: '#FF6B9E', hairShade: '#A8447E', top: '#A4D8E5', topShade: '#5E8FA0', prop: '#FFE066', bg: '#FFF0F8', outline: '#1F1F1F' },
  forest:  { skin: '#D5B585', hair: '#3D5226', hairShade: '#243515', top: '#7A9E5C', topShade: '#4D6F35', prop: '#C4A455', bg: '#E5EFD5', outline: '#1F1F1F' },
  sunset:  { skin: '#F5C09F', hair: '#A04A38', hairShade: '#6B2A1E', top: '#FFA055', topShade: '#B86A2E', prop: '#FF6B9E', bg: '#FFE0CC', outline: '#1F1F1F' },
};
```

- [ ] **Step 3: body parts (3 files)**

`src/components/pixel/parts/body/male.tsx`:

```typescript
import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function BodyMale({ palette }: { palette: PaletteColors }) {
  // Head: round, y 20-44, x 20-44 (24x24 = 6 pixels wide, 6 tall)
  // Torso: square, y 44-72, x 16-48 (32 wide, 28 tall)
  // Arms hang at sides
  return (
    <G>
      {/* Head */}
      <Rect x={20} y={20} width={24} height={24} fill={palette.skin} />
      <Rect x={20} y={20} width={24} height={2} fill={palette.outline} />
      <Rect x={20} y={42} width={24} height={2} fill={palette.outline} />
      <Rect x={20} y={20} width={2} height={24} fill={palette.outline} />
      <Rect x={42} y={20} width={2} height={24} fill={palette.outline} />
      {/* Neck */}
      <Rect x={28} y={44} width={8} height={4} fill={palette.skin} />
      {/* Torso (clothed-base; will be covered by top) */}
      <Rect x={16} y={48} width={32} height={24} fill={palette.skin} />
      {/* Arms */}
      <Rect x={12} y={48} width={4} height={20} fill={palette.skin} />
      <Rect x={48} y={48} width={4} height={20} fill={palette.skin} />
      {/* Legs */}
      <Rect x={20} y={72} width={10} height={20} fill={palette.skin} />
      <Rect x={34} y={72} width={10} height={20} fill={palette.skin} />
    </G>
  );
}
```

`src/components/pixel/parts/body/female.tsx`: same as male but slightly narrower torso (x 18-46) and longer hair-friendly head shape.

`src/components/pixel/parts/body/neutral.tsx`: same as male but with arms slightly thinner and torso width = 30.

(Engineer should implement male first, then duplicate-and-adjust for the other two. Differences are <5 lines each.)

- [ ] **Step 4: type-check + commit**

```bash
npx tsc --noEmit -p . 2>&1 > /tmp/tsc.log; echo "exit=$?"; head -5 /tmp/tsc.log
git add src/components/pixel/features.ts src/components/pixel/palette.ts src/components/pixel/parts/body/
git commit -m "feat(pixel): add features types, 8 palettes, 3 body parts (P3-T1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 8 hair parts

**Files:** `src/components/pixel/parts/hair/{short,long,curly,bald,bun,buzz,samurai,wave}.tsx`

Each is a small `<G>` of `<Rect>`s drawn in the 20-y20 area (covering head top + sides). All share the signature `({ palette }: { palette: PaletteColors }) => JSX.Element`. Default export.

**Style outlines** (each implementation 8-15 lines):

- `short`: rectangle of 4-pixel-tall hair across top of head (y 18-22, x 20-44), with hair color
- `long`: short + 2 vertical strips down sides past the chin (y 22-50, x 18-22 and x 42-46)
- `curly`: 4-5 rounded clumps (offset rects) on top
- `bald`: empty `<G />` (no hair) — but still export a function
- `bun`: small 4×4 rect on top of head (y 14-18) + thin strip on top
- `buzz`: 1-pixel-tall band of hair (y 18-20) across head, very tight
- `samurai`: bun-style top + 2-pixel-wide vertical strip down back of head
- `wave`: short + offset wavy strands at sides (3-4 small rects placed asymmetrically)

- [ ] **Implement each, type-check after each, commit all 8 together as P3-T2**

```bash
git add src/components/pixel/parts/hair/
git commit -m "feat(pixel): 8 hair parts (P3-T2)

short / long / curly / bald / bun / buzz / samurai / wave.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 5 face parts

**Files:** `src/components/pixel/parts/face/{chill,serious,smile,glasses,wink}.tsx`

Faces draw eyes + mouth on the head area (y 28-40). Each part has 2 eye rects + 1 mouth shape:

- `chill`: 2 horizontal-line eyes (1×2 rects each) + slight smile arc (tiny mouth rects)
- `serious`: 2 short-line eyes + horizontal line mouth
- `smile`: 2 dot eyes + curved mouth (3 rects forming an arc)
- `glasses`: 2 hollow rectangle eyes (4×4 with center 2×2 hole — render as 4 thin rects forming a frame) + neutral mouth
- `wink`: 1 dot + 1 horizontal-line eye + smile mouth

Same signature, default export.

- [ ] **Implement, type-check, commit (P3-T3)**

---

## Task 4: 10 top parts

**Files:** `src/components/pixel/parts/top/{hoodie,shirt,blazer,tee,jacket,turtleneck,jersey,dress,uniform,varsity}.tsx`

Tops cover the torso area (x 14-50, y 46-74). Each is a 32×28-ish solid rectangle of `palette.top` with details:

- `hoodie`: solid + a hood tab at neck (small rect at x 28, y 42, width 8, height 4)
- `shirt`: solid + collar V (2 small rects at neck)
- `blazer`: solid + lapel triangles + a single button (1×1 rect)
- `tee`: solid only, no extras (simplest)
- `jacket`: solid + zipper line (1px wide vertical rect down center)
- `turtleneck`: solid + tall neck rect (covers up to y 42)
- `jersey`: solid + horizontal stripe at chest (different shade)
- `dress`: solid extends down to legs (y 46-86)
- `uniform`: solid + 2 buttons + tie (vertical rect at center)
- `varsity`: solid + diagonal stripes (use 3-4 thin diagonal-aligned rects)

Same signature.

- [ ] **Implement, type-check, commit (P3-T4)**

---

## Task 5: 10 prop parts

**Files:** `src/components/pixel/parts/prop/{book,laptop,coffee,mic,basketball,rocket,iphone,flask,typewriter,guitar}.tsx`

Props are held in front of the body (around y 60-72, x 24-40). Each is a small icon (8-12 pixel wide):

- `book`: rectangle with vertical line (page divider)
- `laptop`: rectangle with bottom rim (open laptop seen from front)
- `coffee`: cup shape (rectangle with handle = small rect on side)
- `mic`: vertical stick + small ball on top
- `basketball`: filled circle (use 4-5 rects to approximate)
- `rocket`: triangle on top of rectangle (use rects to fake triangle)
- `iphone`: tall rectangle with small button (matches laptop style but vertical)
- `flask`: trapezoid with neck (similar to coffee but inverted)
- `typewriter`: short wide rectangle with detail keys (small rects on top)
- `guitar`: long thin rectangle with circle hole (use 1 large + small overlay rect)

Same signature.

- [ ] **Implement, type-check, commit (P3-T5)**

---

## Task 6: 5 bg parts + finalize palette

**Files:** `src/components/pixel/parts/bg/{library,cafe,dorm,street,studio}.tsx`

Backgrounds fill 0-64 x, 0-96 y but only paint behind the avatar (so don't conflict with face/body):
- `library`: bookshelf pattern (vertical bands of `palette.bg` and `palette.outline`)
- `cafe`: window + chalk-board feel — solid bg + horizontal divider
- `dorm`: wallpaper pattern — bg + small repeated dots
- `street`: simple gradient-of-rects (bottom darker)
- `studio`: solid `palette.bg` only

Same signature.

- [ ] **Implement, type-check, commit (P3-T6)**

```bash
git add src/components/pixel/parts/bg/
git commit -m "feat(pixel): 5 bg parts (P3-T6)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: PixelAvatar composer

**Files:** `src/components/pixel/PixelAvatar.tsx`, `src/components/pixel/index.ts` (barrel)

- [ ] **Step 1: Composer**

```typescript
import React from 'react';
import Svg from 'react-native-svg';
import { PALETTES } from './palette';
import type { PixelFeatures } from './features';

import BodyMale from './parts/body/male';
import BodyFemale from './parts/body/female';
import BodyNeutral from './parts/body/neutral';
import HairShort from './parts/hair/short';
import HairLong from './parts/hair/long';
import HairCurly from './parts/hair/curly';
import HairBald from './parts/hair/bald';
import HairBun from './parts/hair/bun';
import HairBuzz from './parts/hair/buzz';
import HairSamurai from './parts/hair/samurai';
import HairWave from './parts/hair/wave';
import FaceChill from './parts/face/chill';
import FaceSerious from './parts/face/serious';
import FaceSmile from './parts/face/smile';
import FaceGlasses from './parts/face/glasses';
import FaceWink from './parts/face/wink';
import TopHoodie from './parts/top/hoodie';
import TopShirt from './parts/top/shirt';
import TopBlazer from './parts/top/blazer';
import TopTee from './parts/top/tee';
import TopJacket from './parts/top/jacket';
import TopTurtleneck from './parts/top/turtleneck';
import TopJersey from './parts/top/jersey';
import TopDress from './parts/top/dress';
import TopUniform from './parts/top/uniform';
import TopVarsity from './parts/top/varsity';
import PropBook from './parts/prop/book';
import PropLaptop from './parts/prop/laptop';
import PropCoffee from './parts/prop/coffee';
import PropMic from './parts/prop/mic';
import PropBasketball from './parts/prop/basketball';
import PropRocket from './parts/prop/rocket';
import PropIphone from './parts/prop/iphone';
import PropFlask from './parts/prop/flask';
import PropTypewriter from './parts/prop/typewriter';
import PropGuitar from './parts/prop/guitar';
import BgLibrary from './parts/bg/library';
import BgCafe from './parts/bg/cafe';
import BgDorm from './parts/bg/dorm';
import BgStreet from './parts/bg/street';
import BgStudio from './parts/bg/studio';

const BODIES = { male: BodyMale, female: BodyFemale, neutral: BodyNeutral };
const HAIRS = { short: HairShort, long: HairLong, curly: HairCurly, bald: HairBald, bun: HairBun, buzz: HairBuzz, samurai: HairSamurai, wave: HairWave };
const FACES = { chill: FaceChill, serious: FaceSerious, smile: FaceSmile, glasses: FaceGlasses, wink: FaceWink };
const TOPS = { hoodie: TopHoodie, shirt: TopShirt, blazer: TopBlazer, tee: TopTee, jacket: TopJacket, turtleneck: TopTurtleneck, jersey: TopJersey, dress: TopDress, uniform: TopUniform, varsity: TopVarsity };
const PROPS = { book: PropBook, laptop: PropLaptop, coffee: PropCoffee, mic: PropMic, basketball: PropBasketball, rocket: PropRocket, iphone: PropIphone, flask: PropFlask, typewriter: PropTypewriter, guitar: PropGuitar };
const BGS = { library: BgLibrary, cafe: BgCafe, dorm: BgDorm, street: BgStreet, studio: BgStudio };

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

- [ ] **Step 2: Barrel**

```typescript
// src/components/pixel/index.ts
export { PixelAvatar } from './PixelAvatar';
export type { PixelFeatures, Body, Hair, Face, Top, Prop, Bg, Palette } from './features';
export { DEFAULT_FEATURES, isValidPixelFeatures } from './features';
export { PALETTES } from './palette';
export type { PaletteColors } from './palette';
```

- [ ] **Step 3: type-check + commit**

```bash
npx tsc --noEmit -p . 2>&1 > /tmp/tsc.log; echo "exit=$?"; head -10 /tmp/tsc.log
git add src/components/pixel/PixelAvatar.tsx src/components/pixel/index.ts
git commit -m "feat(pixel): composer + barrel (P3-T7)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: nuwa.ts — validate pixel_features against enum

**File:** `convex/nuwa.ts` (modify `callOpenAIv2`)

- [ ] **Step 1: Find the existing fallback for pixelFeatures**

In `callOpenAIv2`, the existing code does:
```typescript
pixelFeatures: parsed.pixelFeatures && typeof parsed.pixelFeatures === "object"
  ? parsed.pixelFeatures
  : { ...DEFAULT_PIXEL },
```

This accepts ANY object as pixelFeatures. We want strict enum validation: any value not in our enum gets replaced with the default for that field.

- [ ] **Step 2: Add validation**

Replace with:

```typescript
const HAIR_ENUM = ['short','long','curly','bald','bun','buzz','samurai','wave'];
const FACE_ENUM = ['chill','serious','smile','glasses','wink'];
const TOP_ENUM = ['hoodie','shirt','blazer','tee','jacket','turtleneck','jersey','dress','uniform','varsity'];
const PROP_ENUM = ['book','laptop','coffee','mic','basketball','rocket','iphone','flask','typewriter','guitar'];
const BG_ENUM = ['library','cafe','dorm','street','studio'];
const BODY_ENUM = ['male','female','neutral'];
const PALETTE_ENUM = ['warm','cool','pastel','mono','earth','candy','forest','sunset'];

function validatePixelFeatures(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PIXEL };
  const r = raw as Record<string, unknown>;
  return {
    body: BODY_ENUM.includes(r.body as string) ? r.body : DEFAULT_PIXEL.body,
    hair: HAIR_ENUM.includes(r.hair as string) ? r.hair : DEFAULT_PIXEL.hair,
    face: FACE_ENUM.includes(r.face as string) ? r.face : DEFAULT_PIXEL.face,
    top: TOP_ENUM.includes(r.top as string) ? r.top : DEFAULT_PIXEL.top,
    prop: r.prop === null || PROP_ENUM.includes(r.prop as string) ? r.prop : DEFAULT_PIXEL.prop,
    bg: r.bg === null || BG_ENUM.includes(r.bg as string) ? r.bg : DEFAULT_PIXEL.bg,
    palette: PALETTE_ENUM.includes(r.palette as string) ? r.palette : DEFAULT_PIXEL.palette,
  };
}
```

Then in the existing return value, replace the pixelFeatures line with:
```typescript
pixelFeatures: validatePixelFeatures(parsed.pixelFeatures),
```

Also update `DEFAULT_PIXEL` to use `palette: 'pastel'` (consistent with `features.ts` `DEFAULT_FEATURES`).

- [ ] **Step 3: type-check + commit**

```bash
npx tsc --noEmit -p . 2>&1 > /tmp/tsc.log; echo "exit=$?"; head -5 /tmp/tsc.log
git add convex/nuwa.ts
git commit -m "feat(nuwa): validate LLM pixel_features against enum (P3-T8)

Each field falls back to DEFAULT_PIXEL if LLM returns unknown value.
Prevents PixelAvatar composer from crashing on out-of-enum values.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Famous fixtures + dev smoke screen

**Files:**
- Create: `src/components/pixel/famous.ts`
- Create: `app/_smoke.tsx`

- [ ] **Step 1: famous.ts**

```typescript
import type { PixelFeatures } from './features';

export const FAMOUS_PRESETS: Record<string, { features: PixelFeatures; label: string }> = {
  musk:    { features: { body: 'male', hair: 'short', face: 'serious', top: 'tee', prop: 'rocket', bg: 'studio', palette: 'cool' }, label: '马斯克' },
  jobs:    { features: { body: 'male', hair: 'bald', face: 'serious', top: 'turtleneck', prop: 'iphone', bg: 'studio', palette: 'mono' }, label: '乔布斯' },
  jordan:  { features: { body: 'male', hair: 'buzz', face: 'serious', top: 'jersey', prop: 'basketball', bg: 'street', palette: 'warm' }, label: '乔丹' },
  hemingway: { features: { body: 'male', hair: 'short', face: 'serious', top: 'shirt', prop: 'typewriter', bg: 'cafe', palette: 'warm' }, label: '海明威' },
  curie:   { features: { body: 'female', hair: 'bun', face: 'serious', top: 'dress', prop: 'flask', bg: 'library', palette: 'cool' }, label: '居里夫人' },
  wxl:     { features: { body: 'female', hair: 'wave', face: 'smile', top: 'dress', prop: 'mic', bg: 'studio', palette: 'pastel' }, label: '王心凌' },
};
```

- [ ] **Step 2: smoke screen**

```typescript
// app/_smoke.tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PixelAvatar } from '@/src/components/pixel';
import { FAMOUS_PRESETS } from '@/src/components/pixel/famous';

export default function SmokeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>像素风冒烟测试</Text>
        <Text style={styles.subtitle}>6 名人 · 视觉评审</Text>
        <View style={styles.grid}>
          {Object.entries(FAMOUS_PRESETS).map(([key, { features, label }]) => (
            <View key={key} style={styles.cell}>
              <PixelAvatar features={features} size={120} />
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.caption}>
                {features.hair} · {features.face} · {features.top}{features.prop ? ` · ${features.prop}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7' },
  content: { padding: 16, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  cell: { alignItems: 'center', width: 150, gap: 4 },
  label: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  caption: { fontSize: 11, color: '#888', textAlign: 'center' },
});
```

The `_` prefix excludes this from the routing tree (private file convention in expo-router). Reachable directly via deep link or by temporarily linking from another screen.

- [ ] **Step 3: type-check + commit**

```bash
git add src/components/pixel/famous.ts app/_smoke.tsx
git commit -m "feat(pixel): 6 famous presets + dev-only smoke render screen (P3-T9)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Home tab DH avatar uses PixelAvatar

**File:** `app/(tabs)/index.tsx` (modify `DigitalHumanCard` sub-component)

- [ ] **Step 1: Replace the letter-avatar with PixelAvatar**

Find the existing avatar block in `DigitalHumanCard`:
```tsx
<View style={[styles.dhAvatar, { backgroundColor: Stickers[meta.palette].accent }]}>
  <Text style={styles.dhAvatarText}>{userNickname[0] ?? '?'}</Text>
</View>
```

Replace with:
```tsx
<View style={styles.dhAvatarWrap}>
  <PixelAvatar
    features={(dh.pixelFeatures && isValidPixelFeatures(dh.pixelFeatures)) ? dh.pixelFeatures : DEFAULT_FEATURES}
    size={52}
  />
</View>
```

- [ ] **Step 2: Update styles**

Replace:
```tsx
dhAvatar: { width: 52, height: 52, borderRadius: 26, ... },
dhAvatarText: { ... },
```

With:
```tsx
dhAvatarWrap: { width: 52, height: 78, borderWidth: 3, borderColor: '#1F1F1F', borderRadius: 6, overflow: 'hidden', backgroundColor: '#FFF' },
```

(PixelAvatar is 64×96 viewBox = 2:3 aspect ratio; at size=52 it's 52×78. Wrap in a sticker-bordered box.)

- [ ] **Step 3: Update imports**

Add at the top:
```tsx
import { PixelAvatar, isValidPixelFeatures, DEFAULT_FEATURES } from '@/src/components/pixel';
```

Remove the old `dhAvatar` / `dhAvatarText` style references if they remain unused.

- [ ] **Step 4: type-check + commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat(home): DH cards show PixelAvatar instead of letter (P3-T10)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Push branch + open stacked PR

**Files:** none

- [ ] **Step 1: Push**

```bash
git push -u origin phase-3-pixel
```

- [ ] **Step 2: Create PR with base = `worktree-v2-phase-1-and-2`**

```bash
gh pr create --base worktree-v2-phase-1-and-2 --head phase-3-pixel \
  --title "feat(v2): Phase 3 — pixel parts SVG composer + 6 famous smoke" \
  --body "$(cat <<'EOF'
## Summary

Phase 3 of the v2 redesign per `docs/superpowers/specs/2026-05-05-darlink-v2-design.md` section 4 + patch `2026-05-05-darlink-v2-phase-3-spec-patch.md`.

Stacked on PR #1. Rebases onto main after PR #1 merges.

- 38 procedural-SVG pixel parts in `src/components/pixel/parts/` (3 body + 8 hair + 5 face + 10 top + 10 prop + 5 bg)
- 8 palette presets in `src/components/pixel/palette.ts`
- `<PixelAvatar features={...} size={...}/>` composer (5-6 layer SVG stack)
- nuwa.ts validates LLM `pixel_features` output against enum, falls back to defaults per field
- 6 famous-person fixtures (马斯克 / 乔布斯 / 乔丹 / 海明威 / 居里夫人 / 王心凌) at `src/components/pixel/famous.ts`
- Dev-only smoke screen at `app/_smoke.tsx` renders all 6 side-by-side
- Home tab DH cards now use `<PixelAvatar features={dh.pixelFeatures}>` instead of letter-bubble

## Test plan

- [ ] `npx tsc --noEmit -p .` exit 0
- [ ] `npx expo start` and visually navigate to `/_smoke` — confirm 6 avatars render distinctly (≥ 4 visually distinguishable)
- [ ] After PR #1 merges + this PR rebases: refill a friend-mode questionnaire as a test user, confirm distillForUserByMode returns valid pixel_features and home DH card renders the right avatar

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# Self-Review (run after all tasks)

Spec coverage check:
- 4.1 Asset structure → Tasks 1-6 (all parts created via SVG components)
- 4.2 Composer → Task 7
- 4.3 nuwa output → Task 8 (validation, since nuwa already supports the field from Phase 2)
- 4.4 6 famous smoke → Task 9
- 4.5 Acceptance → smoke screen visual review (manual at end)

Type consistency:
- `PixelFeatures` defined in `features.ts`, imported by composer + famous + nuwa-validation
- All part components share `({palette: PaletteColors}) => JSX.Element` signature
- 8 palette names in `palette.ts` exactly match `PALETTE_VALUES` enum in `features.ts` (cream-related stickers do NOT appear here — palette names are pixel-specific)

No placeholders. Each task lists exact file paths + exact code blocks for the part templates.

---

# Execution Notes

- Each part file is 8-15 lines of SVG `<Rect>`s; very mechanical work for a subagent
- Tasks 2-6 batch ~38 small files into 5 commits; estimate 60-90 minutes per batch with subagent + review
- Task 7 composer + Task 10 home integration are higher-risk (multi-file effects); use full review
- Task 9 smoke screen is dev-only; not in production tab navigation
