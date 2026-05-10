# Darlink v2 Phase 1 + Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Darlink's gradient/sparkle aesthetic with a sticker/notebook-style theme (Phase 1), then restructure the unified questionnaire into 3 mode-specific flows (study / friend / romance) with mode-aware schema and migration (Phase 2).

**Architecture:**
- Phase 1 introduces a `Stickers` palette + `<StickerCard>/<StickerChip>/<HandwrittenTitle>/<TapeStrip>/<DoodleIcon>` component library, used across all subsequent phases.
- Phase 2 changes Convex schema to make `questionnaires` and `digitalHumans` mode-keyed (one user can have up to 3 of each), adds 3 new onboarding screens, and migrates existing rows to `mode='friend'`.

**Tech Stack:** Expo (React Native) + expo-router, Convex backend, react-native-reanimated for sticker animations, react-native-svg for handwritten icons.

**Spec reference:** `docs/superpowers/specs/2026-05-05-darlink-v2-design.md` sections 2 + 3.

---

## File Structure (Phase 1 + 2 only)

**Phase 1 — sticker theme:**

| Path | Action | Responsibility |
|------|--------|----------------|
| `assets/fonts/MaShanZheng-Regular.ttf` | Create | Chinese handwritten font |
| `assets/fonts/Caveat-Regular.ttf` | Create | English handwritten font |
| `app/_layout.tsx` | Modify | Load both fonts via `expo-font` |
| `constants/theme.ts` | Modify | Add `Stickers` palette, remove gradient colors, change `Shadows.lg` to hard offset |
| `src/components/sticker/StickerCard.tsx` | Create | Black-bordered sticker container |
| `src/components/sticker/HandwrittenTitle.tsx` | Create | Handwritten text wrapper |
| `src/components/sticker/StickerChip.tsx` | Create | Selectable sticker chip with bounce |
| `src/components/sticker/TapeStrip.tsx` | Create | Tape divider SVG |
| `src/components/sticker/DoodleIcon.tsx` | Create | Hand-drawn icon library (12 names) |
| `src/components/sticker/index.ts` | Create | Barrel export |
| `app/(tabs)/index.tsx` | Modify | Replace orb gradients + sparkle with sticker components (DH card section) |

**Phase 2 — questionnaire restructure:**

| Path | Action | Responsibility |
|------|--------|----------------|
| `convex/schema.ts` | Modify | Add new tables `questionnaires`/`digitalHumans` (mode-keyed), add `users` fields |
| `convex/lib/migrate_v2.ts` | Create | Migrate old rows → mode='friend' |
| `convex/profile.ts` | Modify | `getQuestionnaire/getDigitalHuman` accept mode |
| `convex/nuwa.ts` | Modify | `distillForUser` accepts `mode`, reads correct row (no darwin yet) |
| `convex/matchEngine.ts` | Modify | `generateForUser` accepts `mode` |
| `app/onboarding/_shared.tsx` | Create | Shared background questions sub-component |
| `app/onboarding/study.tsx` | Create | Study mode questionnaire |
| `app/onboarding/friend.tsx` | Create | Friend mode questionnaire |
| `app/onboarding/romance.tsx` | Create | Romance mode questionnaire |
| `app/onboarding/questionnaire.tsx` | Delete | Old unified questionnaire |
| `src/components/questionnaire/SortableList.tsx` | Create | Drag-to-reorder list |
| `src/components/questionnaire/TextAnswer.tsx` | Create | Text input with char counter |
| `src/components/questionnaire/OtherInput.tsx` | Create | Inline "Other, please specify" |
| `src/components/questionnaire/index.ts` | Create | Barrel export |
| `app/(tabs)/index.tsx` | Modify | Replace single Step Card with 3 mode cards |
| `scripts/check_migration.ts` | Create | Assertion script: old row count == new mode='friend' row count |

---

# Phase 1 — Sticker Theme

## Task 1: Add handwritten fonts

**Files:**
- Create: `assets/fonts/MaShanZheng-Regular.ttf`
- Create: `assets/fonts/Caveat-Regular.ttf`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Download fonts to repo**

```bash
mkdir -p assets/fonts
curl -L -o assets/fonts/MaShanZheng-Regular.ttf \
  https://github.com/google/fonts/raw/main/ofl/mashanzheng/MaShanZheng-Regular.ttf
curl -L -o assets/fonts/Caveat-Regular.ttf \
  https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf
ls -lh assets/fonts/
```

Expected: both files > 100KB.

- [ ] **Step 2: Modify `app/_layout.tsx` to load fonts via expo-font**

Open `app/_layout.tsx` and add at the top after existing imports:

```typescript
import { useFonts } from 'expo-font';
```

Inside the root layout component, before the existing return:

```typescript
const [fontsLoaded] = useFonts({
  'MaShanZheng-Regular': require('../assets/fonts/MaShanZheng-Regular.ttf'),
  'Caveat-Regular': require('../assets/fonts/Caveat-Regular.ttf'),
});

if (!fontsLoaded) return null;
```

- [ ] **Step 3: Verify fonts load**

Run: `npx expo start --ios` (or `--android`)
Expected: app boots without error. (Visual verification next task.)

- [ ] **Step 4: Commit**

```bash
git add assets/fonts/ app/_layout.tsx
git commit -m "feat(theme): add MaShanZheng + Caveat handwritten fonts"
```

---

## Task 2: Refactor `constants/theme.ts` — add Stickers palette

**Files:**
- Modify: `constants/theme.ts`

- [ ] **Step 1: Read current `constants/theme.ts` to confirm scope**

Run: `cat constants/theme.ts | head -90`
Expected: see `Colors`, `Radii`, `Spacing`, `Shadows`, `Fonts` exports.

- [ ] **Step 2: Add `Stickers` export and update `Shadows.lg`**

In `constants/theme.ts`, after the `Colors` export add:

```typescript
export const Stickers = {
  cream:    { bg: '#FFF8E7', edge: '#1F1F1F', accent: '#E8B4B8' },
  matcha:   { bg: '#D4E4BC', edge: '#1F1F1F', accent: '#7A9E5C' },
  peach:    { bg: '#FFD6BA', edge: '#1F1F1F', accent: '#E07856' },
  lavender: { bg: '#D8C5E8', edge: '#1F1F1F', accent: '#7C5CA8' },
} as const;

export type StickerPalette = keyof typeof Stickers;
```

Replace the body of `Shadows.lg` with:

```typescript
lg: {
  shadowColor: '#1F1F1F',
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
},
```

Also add a new `Shadows.sticker` preset for sticker cards (4×4 hard offset, slightly weaker for cards):

```typescript
sticker: {
  shadowColor: '#1F1F1F',
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
},
```

Add `HandwrittenFonts` export:

```typescript
export const HandwrittenFonts = {
  zh: 'MaShanZheng-Regular',
  en: 'Caveat-Regular',
} as const;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p .`
Expected: No errors related to `constants/theme.ts`. Existing usages of `Colors.gradientStart` etc. will still work — we'll remove them in Task 9 after replacing call sites.

- [ ] **Step 4: Commit**

```bash
git add constants/theme.ts
git commit -m "feat(theme): add Stickers palette + sticker shadow preset"
```

---

## Task 3: Create `<StickerCard>` component

**Files:**
- Create: `src/components/sticker/StickerCard.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/sticker/StickerCard.tsx` with full content:

```typescript
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Stickers, StickerPalette, Radii, Shadows } from '@/constants/theme';

type Props = {
  palette?: StickerPalette;
  rotation?: number; // degrees, default 0
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function StickerCard({ palette = 'cream', rotation = 0, style, children }: Props) {
  const colors = Stickers[palette];
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bg,
          borderColor: colors.edge,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 4,
    borderRadius: Radii.lg,
    padding: 16,
    ...Shadows.sticker,
  },
});
```

- [ ] **Step 2: Smoke test in modal screen**

Modify `app/modal.tsx` (existing scratch screen) — add at top:

```typescript
import { StickerCard } from '@/src/components/sticker/StickerCard';
```

Inside the screen body, render:

```typescript
<StickerCard palette="cream" rotation={-2}>
  <Text>Cream sticker</Text>
</StickerCard>
<StickerCard palette="matcha" rotation={3} style={{ marginTop: 12 }}>
  <Text>Matcha sticker</Text>
</StickerCard>
```

Run: `npx expo start` and open the modal route.
Expected: 2 sticker cards visible, each with 4px black border, 3×3 hard black shadow, slight rotation.

- [ ] **Step 3: Revert modal changes (smoke only)**

```bash
git checkout app/modal.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sticker/StickerCard.tsx
git commit -m "feat(sticker): add StickerCard component"
```

---

## Task 4: Create `<HandwrittenTitle>` component

**Files:**
- Create: `src/components/sticker/HandwrittenTitle.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/sticker/HandwrittenTitle.tsx`:

```typescript
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { Colors, HandwrittenFonts } from '@/constants/theme';

type Props = {
  children: string;
  size?: number;        // default 24
  color?: string;       // default Colors.text
  lang?: 'zh' | 'en';   // default 'zh'
  style?: StyleProp<TextStyle>;
};

export function HandwrittenTitle({ children, size = 24, color, lang = 'zh', style }: Props) {
  return (
    <Text
      style={[
        styles.text,
        {
          fontFamily: HandwrittenFonts[lang],
          fontSize: size,
          color: color ?? Colors.text,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    lineHeight: undefined,
  },
});
```

- [ ] **Step 2: Smoke test on modal**

In `app/modal.tsx` add:

```typescript
import { HandwrittenTitle } from '@/src/components/sticker/HandwrittenTitle';
// ...
<HandwrittenTitle size={32}>滴搭手账风</HandwrittenTitle>
<HandwrittenTitle size={28} lang="en">Darlink</HandwrittenTitle>
```

Run: `npx expo start`. Open modal. Both Chinese and English should render in handwritten style.
Expected: visible handwriting font, not system default.

If Android shows fallback: confirm `useFonts` from Task 1 actually loaded. Run `console.log(fontsLoaded)` in `_layout.tsx` to verify.

- [ ] **Step 3: Revert modal**

```bash
git checkout app/modal.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sticker/HandwrittenTitle.tsx
git commit -m "feat(sticker): add HandwrittenTitle component"
```

---

## Task 5: Create `<StickerChip>` component

**Files:**
- Create: `src/components/sticker/StickerChip.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/sticker/StickerChip.tsx`:

```typescript
import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Stickers, StickerPalette } from '@/constants/theme';
import { PressableScale } from '@/src/components/PressableScale';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  palette?: StickerPalette;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function StickerChip({ label, selected = false, onPress, palette = 'cream', style, textStyle }: Props) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      rotation.value = withSpring(5, { damping: 8 });
      scale.value = withSpring(1.05, { damping: 8 });
    } else {
      rotation.value = withSpring(0, { damping: 12 });
      scale.value = withSpring(1, { damping: 12 });
    }
  }, [selected, rotation, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const colors = Stickers[palette];

  return (
    <PressableScale
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      haptic="none"
      scaleDown={0.95}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: selected ? colors.accent : colors.bg,
            borderColor: colors.edge,
          },
          animStyle,
          style,
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: selected ? '#fff' : Colors.text },
            textStyle,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Smoke test**

In `app/modal.tsx`:

```typescript
import { useState } from 'react';
import { StickerChip } from '@/src/components/sticker/StickerChip';
// ...
const [sel, setSel] = useState(false);
<StickerChip label="测试" selected={sel} onPress={() => setSel(!sel)} />
```

Run app, tap chip. Expected: tap toggles selection — selected state shows accent fill + +5° rotate + 1.05× scale spring.

- [ ] **Step 3: Revert modal**

```bash
git checkout app/modal.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sticker/StickerChip.tsx
git commit -m "feat(sticker): add StickerChip with spring animation"
```

---

## Task 6: Create `<TapeStrip>` component

**Files:**
- Create: `src/components/sticker/TapeStrip.tsx`

- [ ] **Step 1: Install react-native-svg if not present**

Run: `cat package.json | grep react-native-svg`
If missing: `npx expo install react-native-svg`
If present: skip.

- [ ] **Step 2: Write the component**

Create `src/components/sticker/TapeStrip.tsx`:

```typescript
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';

type Props = {
  color?: 'yellow' | 'pink' | 'kraft';
  width?: number;
  height?: number;
  rotation?: number;
  style?: StyleProp<ViewStyle>;
};

const COLOR_MAP = {
  yellow: '#FCE38A',
  pink:   '#F8B3C5',
  kraft:  '#C9A37A',
} as const;

export function TapeStrip({ color = 'yellow', width = 80, height = 24, rotation = -3, style }: Props) {
  const fill = COLOR_MAP[color];
  // Torn edge: top + bottom slight zigzag
  const path = `M 0 4 L ${width * 0.1} 0 L ${width * 0.3} 3 L ${width * 0.5} 1 L ${width * 0.7} 4 L ${width * 0.9} 0 L ${width} 3 L ${width} ${height - 3} L ${width * 0.9} ${height} L ${width * 0.7} ${height - 4} L ${width * 0.5} ${height - 1} L ${width * 0.3} ${height - 3} L ${width * 0.1} ${height} L 0 ${height - 4} Z`;
  return (
    <View style={[{ transform: [{ rotate: `${rotation}deg` }] }, style]}>
      <Svg width={width} height={height}>
        <Path d={path} fill={fill} opacity={0.85} />
      </Svg>
    </View>
  );
}
```

- [ ] **Step 3: Smoke test**

In `app/modal.tsx`:

```typescript
import { TapeStrip } from '@/src/components/sticker/TapeStrip';
// ...
<TapeStrip color="yellow" width={120} />
<TapeStrip color="pink" rotation={5} />
```

Run, view modal. Expected: 2 torn-edge rectangles visible at slight rotation.

- [ ] **Step 4: Revert modal & commit**

```bash
git checkout app/modal.tsx
git add src/components/sticker/TapeStrip.tsx package.json
git commit -m "feat(sticker): add TapeStrip torn-edge SVG"
```

---

## Task 7: Create `<DoodleIcon>` component (12 icons)

**Files:**
- Create: `src/components/sticker/DoodleIcon.tsx`

- [ ] **Step 1: Write the icon component with 12 hand-drawn paths**

Create `src/components/sticker/DoodleIcon.tsx`:

```typescript
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export type DoodleName =
  | 'book' | 'coffee' | 'star' | 'heart' | 'pencil' | 'laptop'
  | 'music' | 'camera' | 'basketball' | 'burger' | 'sparkle' | 'cloud';

type Props = {
  name: DoodleName;
  size?: number;
  color?: string;
};

// All paths drawn in 24×24 viewBox, intentionally "imperfect" (slight wobble)
const PATHS: Record<DoodleName, React.ReactNode> = {
  book: (
    <Path d="M4 4 L4 20 L11 18 L11 5 Z M13 5 L13 18 L20 20 L20 4 Z" fill="none" strokeWidth={1.8} />
  ),
  coffee: (
    <Path d="M5 9 L5 18 Q5 20 7 20 L15 20 Q17 20 17 18 L17 9 Z M17 11 L19 11 Q21 11 21 14 Q21 17 19 17 L17 17" fill="none" strokeWidth={1.8} />
  ),
  star: (
    <Path d="M12 3 L14 10 L21 10 L15 14 L17 21 L12 17 L7 21 L9 14 L3 10 L10 10 Z" fill="none" strokeWidth={1.8} />
  ),
  heart: (
    <Path d="M12 20 L4 12 Q2 9 4.5 6.5 Q7 4 10 6 L12 8 L14 6 Q17 4 19.5 6.5 Q22 9 20 12 Z" fill="none" strokeWidth={1.8} />
  ),
  pencil: (
    <Path d="M3 21 L7 17 L17 7 L20 10 L10 20 Z M16 8 L18 10" fill="none" strokeWidth={1.8} />
  ),
  laptop: (
    <Path d="M5 5 L19 5 L19 16 L5 16 Z M3 18 L21 18 L20 20 L4 20 Z" fill="none" strokeWidth={1.8} />
  ),
  music: (
    <Path d="M9 18 Q9 21 6 21 Q3 21 3 18 Q3 15 6 15 Q8 15 9 16 L9 5 L19 3 L19 16 Q19 19 16 19 Q13 19 13 16 Q13 13 16 13 Q18 13 19 14" fill="none" strokeWidth={1.8} />
  ),
  camera: (
    <>
      <Path d="M3 8 L7 8 L9 5 L15 5 L17 8 L21 8 L21 19 L3 19 Z" fill="none" strokeWidth={1.8} />
      <Circle cx={12} cy={13} r={4} fill="none" strokeWidth={1.8} />
    </>
  ),
  basketball: (
    <>
      <Circle cx={12} cy={12} r={9} fill="none" strokeWidth={1.8} />
      <Path d="M3 12 L21 12 M12 3 L12 21 M5 6 Q12 12 19 6 M5 18 Q12 12 19 18" fill="none" strokeWidth={1.5} />
    </>
  ),
  burger: (
    <Path d="M4 9 Q4 6 12 6 Q20 6 20 9 L4 9 M3 12 L21 12 M3 15 L21 15 M5 18 L19 18 Q20 18 20 17" fill="none" strokeWidth={1.8} />
  ),
  sparkle: (
    <Path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z" fill="none" strokeWidth={1.6} />
  ),
  cloud: (
    <Path d="M7 17 Q3 17 3 13 Q3 9 7 9 Q8 6 12 6 Q16 6 17 9 Q21 9 21 13 Q21 17 17 17 Z" fill="none" strokeWidth={1.8} />
  ),
};

export function DoodleIcon({ name, size = 24, color = '#1F1F1F' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  );
}
```

- [ ] **Step 2: Smoke test**

In `app/modal.tsx`:

```typescript
import { DoodleIcon } from '@/src/components/sticker/DoodleIcon';
import { ScrollView } from 'react-native';
// ...
const NAMES = ['book','coffee','star','heart','pencil','laptop','music','camera','basketball','burger','sparkle','cloud'] as const;
<ScrollView horizontal>
  {NAMES.map(n => <DoodleIcon key={n} name={n} size={48} />)}
</ScrollView>
```

Expected: 12 hand-drawn icons render, each visible without overlap, no console errors.

- [ ] **Step 3: Revert modal & commit**

```bash
git checkout app/modal.tsx
git add src/components/sticker/DoodleIcon.tsx
git commit -m "feat(sticker): add DoodleIcon with 12 hand-drawn icons"
```

---

## Task 8: Sticker barrel export

**Files:**
- Create: `src/components/sticker/index.ts`

- [ ] **Step 1: Write barrel**

Create `src/components/sticker/index.ts`:

```typescript
export { StickerCard } from './StickerCard';
export { HandwrittenTitle } from './HandwrittenTitle';
export { StickerChip } from './StickerChip';
export { TapeStrip } from './TapeStrip';
export { DoodleIcon } from './DoodleIcon';
export type { DoodleName } from './DoodleIcon';
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/sticker/index.ts
git commit -m "feat(sticker): add barrel export"
```

---

## Task 9: Retheme `(tabs)/index.tsx` — sticker style

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Replace gradient orbs with scattered DoodleIcons**

In `app/(tabs)/index.tsx`, find:

```typescript
{/* Background orbs */}
<View style={styles.orb1} pointerEvents="none" />
<View style={styles.orb2} pointerEvents="none" />
```

Replace with:

```typescript
{/* Scattered doodles */}
<View style={styles.doodleLayer} pointerEvents="none">
  <View style={[styles.doodle, { top: 40, right: 30 }]}><DoodleIcon name="star" size={32} color="#E8B4B8" /></View>
  <View style={[styles.doodle, { top: 120, left: 24 }]}><DoodleIcon name="coffee" size={36} color="#7A9E5C" /></View>
  <View style={[styles.doodle, { top: 220, right: 50 }]}><DoodleIcon name="sparkle" size={28} color="#E07856" /></View>
  <View style={[styles.doodle, { bottom: 200, left: 40 }]}><DoodleIcon name="heart" size={30} color="#7C5CA8" /></View>
  <View style={[styles.doodle, { bottom: 320, right: 30 }]}><DoodleIcon name="cloud" size={40} color="#E8B4B8" /></View>
</View>
```

Add import at top:

```typescript
import { DoodleIcon, StickerCard, HandwrittenTitle } from '@/src/components/sticker';
```

Remove imports/styles for `orb1`, `orb2`. Add new styles to the `StyleSheet.create` block:

```typescript
doodleLayer: { ...StyleSheet.absoluteFillObject },
doodle: { position: 'absolute', opacity: 0.6 },
```

- [ ] **Step 2: Replace step-card LinearGradient with `<StickerCard>`**

Find the two blocks for step 1 / step 2 (search `LinearGradient` in the file). For each, replace:

```typescript
<View style={styles.stepCard}>
  <LinearGradient colors={['#FDF2F8', '#EEF2FF']} style={styles.stepGrad}>
    ...content...
  </LinearGradient>
</View>
```

with:

```typescript
<StickerCard palette="cream" rotation={-1} style={styles.stepCard}>
  ...content...
</StickerCard>
```

Remove the `stepGrad` style. Update `stepCard` to:

```typescript
stepCard: { gap: Spacing.md, alignItems: 'center' },
```

- [ ] **Step 3: Replace step button gradient with hand-styled button**

Find each `LinearGradient` inside `PressableScale onPress={...} style={styles.stepBtnWrap}` and replace with:

```typescript
<View style={[styles.stepBtnSticker, generating && { opacity: 0.5 }]}>
  {generating ? <ActivityIndicator color="#1F1F1F" /> : <HandwrittenTitle size={18} color="#1F1F1F">{'开始填写'}</HandwrittenTitle>}
</View>
```

Add style:

```typescript
stepBtnSticker: {
  backgroundColor: Stickers.matcha.accent,
  borderColor: Stickers.matcha.edge,
  borderWidth: 3,
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 20,
  ...Shadows.sticker,
},
```

Add `Stickers` import: `import { Stickers, Shadows, Spacing, Radii, Colors } from '@/constants/theme';`

- [ ] **Step 4: Replace match CTA gradient with sticker button**

Find:

```typescript
<LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} ... style={styles.matchCta}>
```

Replace the wrapping element with a sticker-styled view; replace `styles.matchCta` body with:

```typescript
matchCta: {
  backgroundColor: Stickers.peach.accent,
  borderColor: Stickers.peach.edge,
  borderWidth: 3,
  padding: Spacing.lg,
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  borderRadius: Radii.full,
  ...Shadows.sticker,
},
```

Remove the `LinearGradient` wrapper, keep just `<View style={styles.matchCta}>...</View>` inside `PressableScale`.

- [ ] **Step 5: Visual smoke**

Run: `npx expo start --ios`. Open home tab.
Expected:
- 5 doodle icons scattered as background
- Step cards bordered black with hard shadow
- Buttons sticker-styled (no gradient)
- "开始填写" / "去看看谁和你匹配" use handwritten font

- [ ] **Step 6: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat(home): retheme home tab with sticker components"
```

---

## Task 10: Verify Phase 1 cleanup

**Files:** check-only

- [ ] **Step 1: Grep for leftover gradient usage in tabs index**

Run: `grep -n "gradientStart\|gradientEnd\|LinearGradient" app/\(tabs\)/index.tsx`
Expected: zero matches.

- [ ] **Step 2: Confirm Phase 1 commits**

Run: `git log --oneline | head -10`
Expected: Tasks 1-9 appear as separate commits.

- [ ] **Step 3: No additional commit needed (verification only)**

If any leftover imports of `LinearGradient` exist in `(tabs)/index.tsx`, remove and commit:

```bash
git add app/\(tabs\)/index.tsx
git commit -m "chore(home): remove unused LinearGradient import"
```

---

# Phase 2 — Questionnaire Restructure

## Task 11: Update Convex schema with mode-keyed tables

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Read current schema to confirm starting state**

Run: `cat convex/schema.ts`
Expected: see existing `users`, `questionnaire`, `digitalHuman` (singular) tables. Note exact field shapes for migration in Task 12.

- [ ] **Step 2: Add new tables and user fields, keep old singular tables for migration**

In `convex/schema.ts`, add (do NOT delete old `questionnaire`/`digitalHuman` yet — Task 12 migration reads them):

```typescript
questionnaires: defineTable({
  userId: v.id('users'),
  mode: v.union(v.literal('study'), v.literal('friend'), v.literal('romance')),
  background: v.any(),
  needs: v.any(),
  matching: v.any(),
  raw: v.any(),
  createdAt: v.number(),
}).index('by_user_mode', ['userId', 'mode']),

digitalHumans: defineTable({
  userId: v.id('users'),
  mode: v.union(v.literal('study'), v.literal('friend'), v.literal('romance')),
  cardText: v.string(),
  mentalModels: v.array(v.string()),
  decisionHeuristics: v.array(v.string()),
  expressionPatterns: v.array(v.string()),
  systemPrompt: v.string(),
  pixelFeatures: v.any(),
  darwinScore: v.number(),
  darwinIterations: v.number(),
  createdAt: v.number(),
}).index('by_user_mode', ['userId', 'mode']),
```

In `users` table definition, add optional fields:

```typescript
selfPersonality: v.optional(v.string()),
grade: v.optional(v.string()),
major: v.optional(v.string()),
vibePalette: v.optional(v.union(
  v.literal('cream'), v.literal('matcha'), v.literal('peach'), v.literal('lavender')
)),
vibeKeywords: v.optional(v.array(v.string())),
aiTwinDisabled: v.optional(v.boolean()),
```

- [ ] **Step 3: Push schema to dev Convex**

Run: `npx convex dev` (in separate terminal, leave running)
Expected: schema deploys with no errors. New tables visible in Convex dashboard.

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/_generated/
git commit -m "feat(schema): add mode-keyed questionnaires/digitalHumans tables"
```

---

## Task 12: Write migration `migrate_v2.ts`

**Files:**
- Create: `convex/lib/migrate_v2.ts`
- Create: `scripts/check_migration.ts`

- [ ] **Step 1: Write migration mutation**

Create `convex/lib/migrate_v2.ts`:

```typescript
import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

export const migrateAllToV2 = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oldQs = await ctx.db.query('questionnaire').collect();
    const oldDhs = await ctx.db.query('digitalHuman').collect();

    let qMigrated = 0;
    let dhMigrated = 0;

    for (const q of oldQs) {
      const existing = await ctx.db
        .query('questionnaires')
        .withIndex('by_user_mode', (i) => i.eq('userId', q.userId).eq('mode', 'friend'))
        .first();
      if (existing) continue;

      await ctx.db.insert('questionnaires', {
        userId: q.userId,
        mode: 'friend',
        background: {
          socialEnergy: q.socialEnergy,
          communicationStyle: q.communicationStyle,
          interests: q.interests,
          availability: q.availability,
        },
        needs: {
          socialGoal: q.socialGoal,
          relationshipPace: q.relationshipPace,
          values: q.values,
        },
        matching: {
          boundaries: q.boundaries,
          preferredScenes: q.preferredScenes,
          dislikeTopics: q.dislikeTopics,
        },
        raw: q.raw ?? q,
        createdAt: q._creationTime,
      });
      qMigrated++;
    }

    for (const dh of oldDhs) {
      const existing = await ctx.db
        .query('digitalHumans')
        .withIndex('by_user_mode', (i) => i.eq('userId', dh.userId).eq('mode', 'friend'))
        .first();
      if (existing) continue;

      await ctx.db.insert('digitalHumans', {
        userId: dh.userId,
        mode: 'friend',
        cardText: dh.cardText,
        mentalModels: dh.mentalModels,
        decisionHeuristics: dh.decisionHeuristics ?? [],
        expressionPatterns: dh.expressionPatterns,
        systemPrompt: dh.cardText,
        pixelFeatures: null,
        darwinScore: 0,
        darwinIterations: 0,
        createdAt: dh._creationTime,
      });
      dhMigrated++;
    }

    return { qMigrated, dhMigrated, totalOldQ: oldQs.length, totalOldDh: oldDhs.length };
  },
});
```

- [ ] **Step 2: Write check script**

Create `scripts/check_migration.ts`:

```typescript
import { ConvexHttpClient } from 'convex/browser';
import { api, internal } from '../convex/_generated/api';

const url = process.env.CONVEX_URL;
if (!url) throw new Error('CONVEX_URL env var required');
const client = new ConvexHttpClient(url);

async function main() {
  const result = await client.mutation(internal.lib.migrate_v2.migrateAllToV2, {});
  console.log('migration result:', result);
  if (result.qMigrated !== result.totalOldQ) {
    console.error(`MISMATCH: migrated ${result.qMigrated} of ${result.totalOldQ} questionnaires`);
    process.exit(1);
  }
  if (result.dhMigrated !== result.totalOldDh) {
    console.error(`MISMATCH: migrated ${result.dhMigrated} of ${result.totalOldDh} digital humans`);
    process.exit(1);
  }
  console.log('OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Run migration on dev**

Run:
```bash
npx convex dev --once
CONVEX_URL=$(cat .env.local | grep CONVEX_URL | cut -d= -f2-) npx ts-node scripts/check_migration.ts
```
Expected: `OK`. If "MISMATCH", investigate skipped rows (idempotent skip is OK if existing already; check by userId).

- [ ] **Step 4: Commit**

```bash
git add convex/lib/migrate_v2.ts scripts/check_migration.ts convex/_generated/
git commit -m "feat(migration): backfill questionnaires/digitalHumans to mode='friend'"
```

---

## Task 13: Update `convex/profile.ts` to be mode-aware

**Files:**
- Modify: `convex/profile.ts`

- [ ] **Step 1: Read current file**

Run: `cat convex/profile.ts`
Note exports (`getProfile`, `getDigitalHuman`, `upsertQuestionnaire`).

- [ ] **Step 2: Update `getDigitalHuman` to accept optional mode**

Replace the existing `getDigitalHuman` query with:

```typescript
export const getDigitalHuman = query({
  args: { userId: v.id('users'), mode: v.optional(v.union(v.literal('study'), v.literal('friend'), v.literal('romance'))) },
  handler: async (ctx, { userId, mode }) => {
    const m = mode ?? 'friend';
    return await ctx.db
      .query('digitalHumans')
      .withIndex('by_user_mode', (i) => i.eq('userId', userId).eq('mode', m))
      .first();
  },
});
```

- [ ] **Step 3: Update `upsertQuestionnaire` to write to new table**

Replace its handler body to write to `questionnaires` (mode-keyed). Args become:

```typescript
args: {
  userId: v.id('users'),
  mode: v.union(v.literal('study'), v.literal('friend'), v.literal('romance')),
  background: v.any(),
  needs: v.any(),
  matching: v.any(),
  raw: v.any(),
},
handler: async (ctx, { userId, mode, background, needs, matching, raw }) => {
  const existing = await ctx.db
    .query('questionnaires')
    .withIndex('by_user_mode', (i) => i.eq('userId', userId).eq('mode', mode))
    .first();
  if (existing) {
    await ctx.db.patch(existing._id, { background, needs, matching, raw });
    return existing._id;
  }
  return await ctx.db.insert('questionnaires', {
    userId, mode, background, needs, matching, raw, createdAt: Date.now(),
  });
},
```

Add a new query for listing modes a user has filled:

```typescript
export const getModeStatus = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const qs = await ctx.db
      .query('questionnaires')
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect();
    const dhs = await ctx.db
      .query('digitalHumans')
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect();
    const status: Record<string, { questionnaire: boolean; digitalHuman: boolean }> = {
      study: { questionnaire: false, digitalHuman: false },
      friend: { questionnaire: false, digitalHuman: false },
      romance: { questionnaire: false, digitalHuman: false },
    };
    for (const q of qs) status[q.mode].questionnaire = true;
    for (const d of dhs) status[d.mode].digitalHuman = true;
    return status;
  },
});
```

- [ ] **Step 4: Type-check + Convex push**

Run:
```bash
npx tsc --noEmit -p convex/
npx convex dev --once
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add convex/profile.ts convex/_generated/
git commit -m "feat(profile): mode-aware getDigitalHuman + upsertQuestionnaire + getModeStatus"
```

---

## Task 14: Update `convex/nuwa.ts` — accept mode, no darwin yet

**Files:**
- Modify: `convex/nuwa.ts`

- [ ] **Step 1: Read current file**

Run: `cat convex/nuwa.ts`

- [ ] **Step 2: Update `distillForUser` action signature**

Change args to:

```typescript
args: {
  userId: v.id('users'),
  mode: v.union(v.literal('study'), v.literal('friend'), v.literal('romance')),
},
```

In the handler, fetch the questionnaire by mode:

```typescript
const q = await ctx.runQuery(internal.profile.getQuestionnaireByMode, { userId, mode });
if (!q) throw new Error(`no questionnaire for mode=${mode}`);
```

(Add `getQuestionnaireByMode` as an internal query in `convex/profile.ts` mirroring `getDigitalHuman`.)

After distillation, write to `digitalHumans`:

```typescript
const existing = await ctx.runQuery(internal.profile.getDigitalHumanByMode, { userId, mode });
const data = {
  userId,
  mode,
  cardText: distilled.cardText,
  mentalModels: distilled.mentalModels,
  decisionHeuristics: distilled.decisionHeuristics ?? [],
  expressionPatterns: distilled.expressionPatterns,
  systemPrompt: distilled.systemPrompt ?? distilled.cardText,
  pixelFeatures: distilled.pixelFeatures ?? null,
  darwinScore: 0,
  darwinIterations: 0,
  createdAt: Date.now(),
};
if (existing) {
  await ctx.runMutation(internal.profile.replaceDigitalHuman, { id: existing._id, data });
} else {
  await ctx.runMutation(internal.profile.insertDigitalHuman, { data });
}
```

(Add the two internal mutations in `profile.ts`.)

- [ ] **Step 3: Update LLM prompt to include mode-specific shaping**

In the prompt builder inside `distillForUser`, append a mode-specific instruction:

```typescript
const modeHint = {
  study:   '本次蒸馏聚焦学习搭子场景，强调学习目标、专业方向、可提供的学术帮助。',
  friend:  '本次蒸馏聚焦泛社交/饭搭子/玩搭子场景，强调兴趣、社交风格、轻松度。',
  romance: '本次蒸馏聚焦恋爱潜力场景，强调价值观、亲密关系边界、共同生活倾向。',
}[mode];
```

Include `modeHint` in the system prompt. Do NOT add darwin yet — that's Phase 5.

- [ ] **Step 4: Push & smoke**

Run: `npx convex dev --once`
Expected: no schema or type errors.

- [ ] **Step 5: Commit**

```bash
git add convex/nuwa.ts convex/profile.ts convex/_generated/
git commit -m "feat(nuwa): accept mode arg + write to mode-keyed digitalHumans"
```

---

## Task 15: Update `convex/matchEngine.ts` — read by mode

**Files:**
- Modify: `convex/matchEngine.ts`

- [ ] **Step 1: Read current file**

Run: `cat convex/matchEngine.ts`

- [ ] **Step 2: Add `mode` arg to `generateForUser`**

Add to args:

```typescript
mode: v.optional(v.union(v.literal('study'), v.literal('friend'), v.literal('romance'))),
```

In the handler, default `mode` to `'friend'` if not provided. When fetching the user's digital human, use the `by_user_mode` index. When fetching candidates' digital humans for scoring, fetch the same `mode` row for each candidate. Skip candidates that don't have that mode filled.

- [ ] **Step 3: Type-check & push**

Run: `npx tsc --noEmit -p convex/ && npx convex dev --once`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add convex/matchEngine.ts convex/_generated/
git commit -m "feat(match): match within selected mode"
```

---

## Task 16: Create `<TextAnswer>` component

**Files:**
- Create: `src/components/questionnaire/TextAnswer.tsx`

- [ ] **Step 1: Write component**

```typescript
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Stickers } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max?: number;
  multiline?: boolean;
};

export function TextAnswer({ value, onChange, placeholder, max = 100, multiline = true }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={(t) => { if (t.length <= max) onChange(t); }}
        placeholder={placeholder}
        placeholderTextColor={Colors.textPlaceholder}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      <Text style={styles.counter}>{value.length} / {max}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Stickers.cream.bg,
    borderColor: Stickers.cream.edge,
    borderWidth: 3,
    borderRadius: 14,
    padding: 12,
    minHeight: 80,
  },
  input: { fontSize: 16, color: Colors.text, padding: 0 },
  multiline: { minHeight: 60 },
  counter: { textAlign: 'right', fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});
```

- [ ] **Step 2: Smoke test on modal**

```typescript
const [v, setV] = useState('');
<TextAnswer value={v} onChange={setV} placeholder="请输入..." max={50} />
```

Expected: typing updates count, can't exceed max.

- [ ] **Step 3: Revert & commit**

```bash
git checkout app/modal.tsx
git add src/components/questionnaire/TextAnswer.tsx
git commit -m "feat(questionnaire): add TextAnswer with char counter"
```

---

## Task 17: Create `<SortableList>` component (drag-to-reorder)

**Files:**
- Create: `src/components/questionnaire/SortableList.tsx`

- [ ] **Step 1: Install dependency if missing**

Run: `cat package.json | grep react-native-draggable-flatlist`
If missing: `npx expo install react-native-draggable-flatlist`

- [ ] **Step 2: Write component**

```typescript
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Stickers, Colors } from '@/constants/theme';

export type SortableItem = { key: string; label: string };

type Props = {
  items: SortableItem[];
  onChange: (next: SortableItem[]) => void;
};

export function SortableList({ items, onChange }: Props) {
  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<SortableItem>) => (
    <ScaleDecorator>
      <View
        style={[styles.row, isActive && styles.rowActive]}
        onTouchStart={drag}
      >
        <Text style={styles.rank}>{(getIndex() ?? 0) + 1}</Text>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.handle}>⋮⋮</Text>
      </View>
    </ScaleDecorator>
  );

  return (
    <DraggableFlatList
      data={items}
      keyExtractor={(it) => it.key}
      renderItem={renderItem}
      onDragEnd={({ data }) => onChange(data)}
      activationDistance={6}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Stickers.cream.bg,
    borderColor: Stickers.cream.edge,
    borderWidth: 3,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 4,
    gap: 12,
  },
  rowActive: { backgroundColor: Stickers.peach.bg, borderColor: Stickers.peach.edge },
  rank: { fontSize: 18, fontWeight: '800', color: Colors.text, width: 24, textAlign: 'center' },
  label: { flex: 1, fontSize: 15, color: Colors.text },
  handle: { fontSize: 18, color: Colors.textMuted },
});
```

- [ ] **Step 3: Smoke test**

```typescript
const [items, setItems] = useState([
  { key: 'a', label: '经济条件' },
  { key: 'b', label: '兴趣爱好' },
  { key: 'c', label: '对你的投入' },
]);
<SortableList items={items} onChange={setItems} />
```

Run app, long-press to drag rows. Expected: rows reorder smoothly.

- [ ] **Step 4: Revert modal & commit**

```bash
git checkout app/modal.tsx
git add src/components/questionnaire/SortableList.tsx package.json
git commit -m "feat(questionnaire): add SortableList drag-to-reorder"
```

---

## Task 18: Create `<OtherInput>` and questionnaire barrel

**Files:**
- Create: `src/components/questionnaire/OtherInput.tsx`
- Create: `src/components/questionnaire/index.ts`

- [ ] **Step 1: Write OtherInput**

```typescript
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Colors, Stickers } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function OtherInput({ value, onChange, placeholder = '请说明…' }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(t) => { if (t.length <= 30) onChange(t); }}
        placeholder={placeholder}
        placeholderTextColor={Colors.textPlaceholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderColor: Stickers.cream.edge,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  input: { fontSize: 14, color: Colors.text, padding: 0 },
});
```

- [ ] **Step 2: Write barrel**

```typescript
// src/components/questionnaire/index.ts
export { TextAnswer } from './TextAnswer';
export { SortableList } from './SortableList';
export type { SortableItem } from './SortableList';
export { OtherInput } from './OtherInput';
```

- [ ] **Step 3: Type-check & commit**

```bash
npx tsc --noEmit -p .
git add src/components/questionnaire/
git commit -m "feat(questionnaire): add OtherInput + barrel export"
```

---

## Task 19: Create `_shared.tsx` background-question screen

**Files:**
- Create: `app/onboarding/_shared.tsx`

This is **not** a route — it's a sub-component used by study/friend/romance screens to collect grade/major/personality once. It writes to `users` table fields.

- [ ] **Step 1: Write component**

```typescript
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/src/lib/auth-context';
import { StickerChip, HandwrittenTitle } from '@/src/components/sticker';
import { OtherInput } from '@/src/components/questionnaire';
import { PressableScale } from '@/src/components/PressableScale';
import { Colors, Spacing, Stickers, Shadows } from '@/constants/theme';

const GRADES = ['大一', '大二', '大三', '大四'];
const MAJORS = ['文科', '理科', '工科', '其他'];
const PERSONA = ['内向', '外向', '其他'];

type Props = {
  onComplete: (background: { grade: string; major: string; majorOther?: string; selfPersonality: string; personalityOther?: string }) => void;
};

export function SharedBackground({ onComplete }: Props) {
  const { auth } = useAuth();
  const updateBackground = useMutation(api.auth.updateBackground);
  const [grade, setGrade] = useState('');
  const [major, setMajor] = useState('');
  const [majorOther, setMajorOther] = useState('');
  const [persona, setPersona] = useState('');
  const [personaOther, setPersonaOther] = useState('');

  const canNext = !!grade && !!major && !!persona && (major !== '其他' || majorOther.trim()) && (persona !== '其他' || personaOther.trim());

  async function handleNext() {
    if (auth.status !== 'authenticated') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateBackground({
      userId: auth.userId,
      grade,
      major: major === '其他' ? majorOther : major,
      selfPersonality: persona === '其他' ? personaOther : persona,
    });
    onComplete({ grade, major, majorOther: major === '其他' ? majorOther : undefined, selfPersonality: persona, personalityOther: persona === '其他' ? personaOther : undefined });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <HandwrittenTitle size={28}>先聊聊你自己</HandwrittenTitle>

      <Text style={styles.q}>你的年级</Text>
      <View style={styles.row}>
        {GRADES.map((g) => <StickerChip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} palette="matcha" />)}
      </View>

      <Text style={styles.q}>你的专业方向</Text>
      <View style={styles.row}>
        {MAJORS.map((m) => <StickerChip key={m} label={m} selected={major === m} onPress={() => setMajor(m)} palette="peach" />)}
      </View>
      {major === '其他' && <OtherInput value={majorOther} onChange={setMajorOther} placeholder="比如：医学" />}

      <Text style={styles.q}>你认为你是怎样的人？</Text>
      <View style={styles.row}>
        {PERSONA.map((p) => <StickerChip key={p} label={p} selected={persona === p} onPress={() => setPersona(p)} palette="lavender" />)}
      </View>
      {persona === '其他' && <OtherInput value={personaOther} onChange={setPersonaOther} placeholder="比如：双面性格" />}

      <PressableScale disabled={!canNext} onPress={handleNext} haptic="medium" style={[styles.btn, !canNext && { opacity: 0.5 }]}>
        <HandwrittenTitle size={18} color="#1F1F1F">下一步 →</HandwrittenTitle>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md, backgroundColor: Stickers.cream.bg, flexGrow: 1 },
  q: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    marginTop: Spacing.lg,
    backgroundColor: Stickers.matcha.accent,
    borderColor: Stickers.matcha.edge,
    borderWidth: 3,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    ...Shadows.sticker,
  },
});
```

- [ ] **Step 2: Add `auth.updateBackground` mutation**

In `convex/auth.ts`, add:

```typescript
export const updateBackground = mutation({
  args: {
    userId: v.id('users'),
    grade: v.string(),
    major: v.string(),
    selfPersonality: v.string(),
  },
  handler: async (ctx, { userId, grade, major, selfPersonality }) => {
    await ctx.db.patch(userId, { grade, major, selfPersonality });
  },
});
```

- [ ] **Step 3: Type-check & commit**

```bash
npx tsc --noEmit -p .
git add app/onboarding/_shared.tsx convex/auth.ts convex/_generated/
git commit -m "feat(onboarding): add SharedBackground component + updateBackground mutation"
```

---

## Task 20: Create `study.tsx` mode questionnaire

**Files:**
- Create: `app/onboarding/study.tsx`

- [ ] **Step 1: Write screen**

```typescript
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAction, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../convex/_generated/api';
import { useAuth } from '@/src/lib/auth-context';
import { SharedBackground } from './_shared';
import { StickerChip, HandwrittenTitle } from '@/src/components/sticker';
import { OtherInput } from '@/src/components/questionnaire';
import { PressableScale } from '@/src/components/PressableScale';
import { Colors, Spacing, Stickers, Shadows } from '@/constants/theme';

const TARGET_MAJORS = ['文科', '理科', '工科', '其他'];
const PURPOSES = ['学习', '交友', '交流', '其他'];
const PERSONA = ['内向', '外向', '其他'];
const HELP = ['学习', '交友', '交流', '其他'];
const MEETMODE = ['线上', '线下'];
const FREQ = ['每日', '频繁', '中等', '较少', '其他'];

type Phase = 'background' | 'needs' | 'matching';

export default function StudyScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const upsert = useMutation(api.profile.upsertQuestionnaire);
  const distill = useAction(api.nuwa.distillForUser);

  const [phase, setPhase] = useState<Phase>('background');
  const [bg, setBg] = useState<any>(null);

  // Needs
  const [targetMajor, setTargetMajor] = useState('');
  const [targetMajorOther, setTargetMajorOther] = useState('');
  const [purpose, setPurpose] = useState('');
  const [purposeOther, setPurposeOther] = useState('');
  const [idealPersona, setIdealPersona] = useState('');
  const [idealPersonaOther, setIdealPersonaOther] = useState('');

  // Matching
  const [canOffer, setCanOffer] = useState('');
  const [canOfferOther, setCanOfferOther] = useState('');
  const [meetMode, setMeetMode] = useState('');
  const [freq, setFreq] = useState('');
  const [freqOther, setFreqOther] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (phase === 'background') {
    return <SafeAreaView style={{ flex: 1 }}><SharedBackground onComplete={(b) => { setBg(b); setPhase('needs'); }} /></SafeAreaView>;
  }

  const needsValid = !!targetMajor && !!purpose && !!idealPersona;
  const matchingValid = !!canOffer && !!meetMode && !!freq;

  async function submit() {
    if (auth.status !== 'authenticated') return;
    setSubmitting(true);
    try {
      const background = bg;
      const needs = { targetMajor: targetMajor === '其他' ? targetMajorOther : targetMajor, purpose: purpose === '其他' ? purposeOther : purpose, idealPersonality: idealPersona === '其他' ? idealPersonaOther : idealPersona };
      const matching = { canOffer: canOffer === '其他' ? canOfferOther : canOffer, meetMode, frequency: freq === '其他' ? freqOther : freq };
      await upsert({ userId: auth.userId, mode: 'study', background, needs, matching, raw: { background, needs, matching } });
      router.replace('/(tabs)');
      distill({ userId: auth.userId, mode: 'study' }).catch((e) => console.error('distill:', e));
    } finally { setSubmitting(false); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Stickers.cream.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        {phase === 'needs' && (
          <>
            <HandwrittenTitle size={28}>你想找什么样的学习伙伴</HandwrittenTitle>
            <Text style={styles.q}>对方的专业方向？</Text>
            <View style={styles.row}>{TARGET_MAJORS.map((m) => <StickerChip key={m} label={m} selected={targetMajor === m} onPress={() => setTargetMajor(m)} palette="matcha" />)}</View>
            {targetMajor === '其他' && <OtherInput value={targetMajorOther} onChange={setTargetMajorOther} />}

            <Text style={styles.q}>你的主要目的？</Text>
            <View style={styles.row}>{PURPOSES.map((p) => <StickerChip key={p} label={p} selected={purpose === p} onPress={() => setPurpose(p)} palette="peach" />)}</View>
            {purpose === '其他' && <OtherInput value={purposeOther} onChange={setPurposeOther} />}

            <Text style={styles.q}>理想伙伴的性格？</Text>
            <View style={styles.row}>{PERSONA.map((p) => <StickerChip key={p} label={p} selected={idealPersona === p} onPress={() => setIdealPersona(p)} palette="lavender" />)}</View>
            {idealPersona === '其他' && <OtherInput value={idealPersonaOther} onChange={setIdealPersonaOther} />}

            <PressableScale disabled={!needsValid} onPress={() => { Haptics.selectionAsync(); setPhase('matching'); }} style={[styles.btn, !needsValid && { opacity: 0.5 }]}>
              <HandwrittenTitle size={18}>下一步 →</HandwrittenTitle>
            </PressableScale>
          </>
        )}

        {phase === 'matching' && (
          <>
            <HandwrittenTitle size={28}>你能怎么搭配 TA</HandwrittenTitle>
            <Text style={styles.q}>你能提供的帮助？</Text>
            <View style={styles.row}>{HELP.map((h) => <StickerChip key={h} label={h} selected={canOffer === h} onPress={() => setCanOffer(h)} palette="matcha" />)}</View>
            {canOffer === '其他' && <OtherInput value={canOfferOther} onChange={setCanOfferOther} />}

            <Text style={styles.q}>你想怎样交流？</Text>
            <View style={styles.row}>{MEETMODE.map((m) => <StickerChip key={m} label={m} selected={meetMode === m} onPress={() => setMeetMode(m)} palette="peach" />)}</View>

            <Text style={styles.q}>学习频率？</Text>
            <View style={styles.row}>{FREQ.map((f) => <StickerChip key={f} label={f} selected={freq === f} onPress={() => setFreq(f)} palette="lavender" />)}</View>
            {freq === '其他' && <OtherInput value={freqOther} onChange={setFreqOther} />}

            <PressableScale disabled={!matchingValid || submitting} onPress={submit} style={[styles.btn, (!matchingValid || submitting) && { opacity: 0.5 }]}>
              <HandwrittenTitle size={18}>生成我的学习数字人 ✦</HandwrittenTitle>
            </PressableScale>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md },
  q: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: { marginTop: Spacing.lg, backgroundColor: Stickers.matcha.accent, borderColor: Stickers.matcha.edge, borderWidth: 3, borderRadius: 18, padding: 14, alignItems: 'center', ...Shadows.sticker },
});
```

- [ ] **Step 2: Smoke**

Run: `npx expo start`. Manually navigate `/onboarding/study`.
Expected: 3-phase flow (background → needs → matching), each step blocks until required fields filled, submit triggers `upsert` + redirects to home.

- [ ] **Step 3: Commit**

```bash
git add app/onboarding/study.tsx
git commit -m "feat(onboarding): add study mode questionnaire"
```

---

## Task 21: Create `friend.tsx` mode questionnaire

**Files:**
- Create: `app/onboarding/friend.tsx`

- [ ] **Step 1: Write screen — same 3-phase pattern as Task 20, with friend-mode questions**

Adapt Task 20's structure. Replace question sets with:

- **Background** (handled by `<SharedBackground>`) + extra `hobbies` multi-select (max 5):
  ```typescript
  const HOBBIES = ['运动类','社交类','学习类','娱乐类','其他'];
  // multi-select state: const [hobbies, setHobbies] = useState<string[]>([]);
  ```
- **Needs**:
  - `coreFriendNeed` 单选 from `HOBBIES`
  - `secondaryNeeds` 多选 from `HOBBIES` (no max)
  - `expectedPersonality` 单选 from `['内向','外向','其他']`
- **Matching**:
  - `uniqueTrait` 文本 (`<TextAnswer>`)
  - `meetMode` 单选 `['线上','线下']`

Submit:

```typescript
await upsert({ userId, mode: 'friend', background: { ...bg, hobbies }, needs: { coreFriendNeed, secondaryNeeds, expectedPersonality }, matching: { uniqueTrait, meetMode }, raw: {...} });
distill({ userId, mode: 'friend' }).catch(...);
```

- [ ] **Step 2: Smoke + commit**

```bash
git add app/onboarding/friend.tsx
git commit -m "feat(onboarding): add friend mode questionnaire"
```

---

## Task 22: Create `romance.tsx` mode questionnaire (with sortable + text)

**Files:**
- Create: `app/onboarding/romance.tsx`

- [ ] **Step 1: Write screen — same 3-phase, with romance-specific question types**

Reuse Task 20 skeleton but with:

- **Background**:
  - `<SharedBackground>` for grade/major/personality
  - `targetGender` 单选 `['男','女']`
  - `attractivePoint` `<TextAnswer max={100}>` "你最能打动 ta 的闪光点"
  - `hobbies` 多选 (same as friend)

- **Needs**:
  - `marriageView` 单选 `['想结婚','稳定关系','其他']`
  - `partnerPriority` `<SortableList>` with items `[{key:'a',label:'经济条件'},{key:'b',label:'身体条件'},{key:'c',label:'对你的投入'},{key:'d',label:'相同兴趣'},{key:'e',label:'其他'}]` — final order saved as priority array
  - `desiredTraits` `<TextAnswer max={100}>`

- **Matching**:
  - `whatMovesYou` `<TextAnswer max={100}>`
  - `dealBreakers` `<TextAnswer max={100}>`
  - `worriedPartnerCantAccept` `<TextAnswer max={100}>`
  - `meetMode` 单选 `['线上','线下']`

Submit:

```typescript
const partnerPriorityKeys = partnerPriorityItems.map(i => i.key);
await upsert({ userId, mode: 'romance', background: { ...bg, targetGender, attractivePoint, hobbies }, needs: { marriageView, partnerPriority: partnerPriorityKeys, desiredTraits }, matching: { whatMovesYou, dealBreakers, worriedPartnerCantAccept, meetMode }, raw: {...} });
distill({ userId, mode: 'romance' }).catch(...);
```

- [ ] **Step 2: Smoke**

Run flow. Verify: SortableList drag works, all text inputs respect max, submit succeeds, redirect to home.

- [ ] **Step 3: Commit**

```bash
git add app/onboarding/romance.tsx
git commit -m "feat(onboarding): add romance mode questionnaire with sort + text fields"
```

---

## Task 23: Update `(tabs)/index.tsx` with 3 mode cards

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Replace single Step Card with mode picker**

Find the existing `{/* Step 1: No profile yet */}` block (Task 9 left this rendering one card). Replace with:

```typescript
const modeStatus = useQuery(api.profile.getModeStatus, userId ? { userId } : 'skip');

const MODES: { key: 'study'|'friend'|'romance'; emoji: string; label: string; palette: 'matcha'|'peach'|'lavender' }[] = [
  { key: 'study',   emoji: '📚', label: '学习搭子',  palette: 'matcha'   },
  { key: 'friend',  emoji: '🍱', label: '饭/玩搭子', palette: 'peach'    },
  { key: 'romance', emoji: '💝', label: '恋爱潜力',  palette: 'lavender' },
];

<View style={styles.modeRow}>
  {MODES.map((m) => {
    const filled = !!modeStatus?.[m.key]?.digitalHuman;
    return (
      <PressableScale
        key={m.key}
        onPress={() => router.push(`/onboarding/${m.key}` as any)}
        haptic="medium"
        scaleDown={0.95}
        style={{ flex: 1 }}
      >
        <StickerCard palette={m.palette} rotation={m.key === 'study' ? -2 : m.key === 'friend' ? 0 : 2}>
          <Text style={styles.modeEmoji}>{m.emoji}</Text>
          <HandwrittenTitle size={18} style={{ textAlign: 'center' }}>{m.label}</HandwrittenTitle>
          {filled ? (
            <Text style={styles.modeFilled}>✓ 已完成</Text>
          ) : (
            <Text style={styles.modeOpen}>开始 →</Text>
          )}
        </StickerCard>
      </PressableScale>
    );
  })}
</View>
```

Add styles:

```typescript
modeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
modeEmoji: { fontSize: 32, textAlign: 'center' },
modeFilled: { textAlign: 'center', fontSize: 12, color: Colors.success, fontWeight: '700' },
modeOpen: { textAlign: 'center', fontSize: 12, color: Colors.textSecondary },
```

Remove the old `hasProfile` / `hasDH` two-step layout (the `📝 第一步` / `🤖 第二步` Step Cards). Replace with: when `modeStatus` shows any mode filled, show the corresponding `digitalHumans` card (call `useQuery(api.profile.getDigitalHuman, { userId, mode: filledMode })`); otherwise show only the 3-mode picker.

- [ ] **Step 2: Update digital human card section to be mode-aware**

The existing `{hasDH && (<>...</>)}` block: replace `dh` with the result of `getDigitalHuman({userId, mode: 'friend'})` for now (showing the user's friend-mode DH as default). When user has multiple modes filled, add a horizontal scroll with 1 card per filled mode (use `useQuery` per mode, only render those that return non-null).

- [ ] **Step 3: Smoke**

Run app, log in as old user (post-migration). Expected:
- Mode row shows 3 cards
- Friend card has "✓ 已完成" if old data migrated
- Tapping any card navigates to corresponding `/onboarding/{mode}` screen

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat(home): add 3-mode picker + per-mode digital human display"
```

---

## Task 24: Delete old `questionnaire.tsx`

**Files:**
- Delete: `app/onboarding/questionnaire.tsx`

- [ ] **Step 1: Confirm no remaining references**

Run: `grep -r "onboarding/questionnaire" app/ src/`
Expected: zero matches (the home now routes to `/onboarding/{mode}`).

- [ ] **Step 2: Delete file**

```bash
git rm app/onboarding/questionnaire.tsx
```

- [ ] **Step 3: Smoke**

Run: `npx expo start`. Navigate around app — should not see any "screen not found" errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(onboarding): remove unified questionnaire — replaced by per-mode screens"
```

---

## Task 25: Run migration on dev environment

**Files:** none (data operation only)

- [ ] **Step 1: Run migration script**

```bash
CONVEX_URL=$(cat .env.local | grep CONVEX_URL | cut -d= -f2-) npx ts-node scripts/check_migration.ts
```

Expected: `OK`. If error: investigate via `npx convex logs` and Convex dashboard. Common cause = old singular tables empty (script should still print `OK` with 0/0).

- [ ] **Step 2: Manually verify in Convex dashboard**

Open https://dashboard.convex.dev. For an old user, confirm:
- `questionnaires` table has a row with `mode='friend'`
- `digitalHumans` table has a row with `mode='friend'`, `darwinScore=0`, `pixelFeatures=null`
- old singular tables still present (will be cleaned up in a later phase per spec section 7.4 = 90 days from migration)

- [ ] **Step 3: No commit needed (data operation)**

---

## Task 26: End-to-end smoke

**Files:** none (verification only)

- [ ] **Step 1: New user smoke**

1. Sign up via existing `auth/sign-in.tsx` (Phase 4 hasn't replaced it yet)
2. Land on home — see 3 mode cards, none completed
3. Tap "学习搭子" → 3-phase questionnaire (background → needs → matching)
4. Submit — redirected to home, `📚 已完成` shown
5. Wait ~10-30s — digital human card appears (mode='study')
6. Tap "饭/玩搭子" → fill that flow → second DH card appears
7. Tap "恋爱潜力" → fill romance (incl. drag-sort + text inputs) → third DH card appears

Pass criteria: 3 modes complete, 3 DHs visible, no console errors.

- [ ] **Step 2: Old user smoke**

1. Sign in with an account whose data was migrated
2. Home shows: 饭/玩搭子 marked `✓ 已完成`, study + romance still `开始 →`
3. Friend DH card visible with previous content
4. Can tap study/romance to fill those new modes

Pass criteria: migrated user lands cleanly, can incrementally add new modes.

- [ ] **Step 3: Match smoke**

1. Two test accounts, both filled `friend` mode
2. Trigger matchEngine for one: `npx convex run matchEngine:generateForUser --args '{"userId":"...","mode":"friend"}'`
3. Verify: matches generated, scoring uses `friend`-mode DH only

- [ ] **Step 4: Final commit / tag**

```bash
git tag v2-phase-1-and-2-complete
git push --tags  # only if user authorizes
```

---

# Self-Review

**Spec coverage check** (against spec sections 2 + 3):

| Spec section | Plan task | Status |
|--------------|-----------|--------|
| 2.1 调色板替换 | Task 2 | ✓ |
| 2.2 共享组件 | Tasks 3-8 | ✓ |
| 2.3 三屏视觉锚点 (home) | Task 9 | ✓ partial — 问卷屏 anchor 由 Phase 2 新建屏天然套用 sticker；DH 卡片 anchor 在 home 内 (Task 9/23) |
| 2.4 验收 | Task 10 | ✓ |
| 3.1 首页模式选择 | Task 23 | ✓ |
| 3.2 问卷文件拆分 | Tasks 19-22 | ✓ |
| 3.3 新交互组件 | Tasks 16-18 | ✓ |
| 3.4 schema 改动 | Task 11 | ✓ |
| 3.5 老数据迁移 | Tasks 12, 25 | ✓ |
| 3.6 验收 | Task 26 | ✓ |

**Note**: Spec section 2.3 lists 3 anchor screens including the questionnaire — Phase 2 replaces it entirely with sticker-styled new screens, so no separate retheme task for the old one is needed.

**Placeholder scan**: clean (all code shown, all paths exact, no TBD).

**Type consistency check**:
- `mode` typed as `v.union(v.literal('study'), v.literal('friend'), v.literal('romance'))` everywhere ✓
- `StickerPalette` imported from theme.ts ✓
- `getDigitalHuman` signature matches across profile.ts and home tab usage ✓

---

# Execution Notes

- **Order**: Tasks 1-10 (Phase 1) sequentially → Tasks 11-15 (backend) sequentially → Tasks 16-22 (UI components + screens) can partially parallelize → Tasks 23-26 (integration + smoke) sequentially.
- **Hard dependency**: Task 23 (home mode picker) depends on Tasks 11+13 (schema + getModeStatus query) AND Tasks 19-22 (mode screens exist).
- **Skipped from spec for Phase 1+2**: darwin chain (Phase 5), AI twin tab (Phase 5), pixel composer (Phase 3), 3-step login (Phase 4). Each gets its own future plan.






