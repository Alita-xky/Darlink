import type { PixelFeatures, Palette } from '@/src/components/pixel';
import { DEFAULT_FEATURES } from '@/src/components/pixel';

export type VibePalette = 'cream' | 'matcha' | 'peach' | 'lavender';
export type VibeKeyword = '认真' | '搞笑' | '温柔' | '锋利' | '佛系' | '卷王';

export const VIBE_PALETTES: VibePalette[] = ['cream', 'matcha', 'peach', 'lavender'];
export const VIBE_KEYWORDS: VibeKeyword[] = ['认真', '搞笑', '温柔', '锋利', '佛系', '卷王'];

const VIBE_TO_PIXEL_PALETTE: Record<VibePalette, Palette> = {
  cream: 'pastel',
  matcha: 'forest',
  peach: 'warm',
  lavender: 'cool',
};

export function vibeToFeatures(
  vibePalette: VibePalette | undefined,
  vibeKeywords: string[],
): PixelFeatures {
  const palette = vibePalette ? VIBE_TO_PIXEL_PALETTE[vibePalette] : DEFAULT_FEATURES.palette;

  const has = (k: VibeKeyword) => vibeKeywords.includes(k);

  // Hair: 佛系 → long, else short
  const hair: PixelFeatures['hair'] = has('佛系') ? 'long' : 'short';

  // Face: 搞笑 → wink; 锋利 → serious; default smile (温柔/认真/卷王 fall through to smile by default)
  const face: PixelFeatures['face'] = has('搞笑')
    ? 'wink'
    : has('锋利')
    ? 'serious'
    : 'smile';

  // Top: 卷王 → shirt (more "professional"), else hoodie (casual)
  const top: PixelFeatures['top'] = has('卷王') ? 'shirt' : 'hoodie';

  // Prop: 认真 → book; 卷王 → laptop; else null
  const prop: PixelFeatures['prop'] = has('认真')
    ? 'book'
    : has('卷王')
    ? 'laptop'
    : null;

  return {
    body: 'neutral',
    hair,
    face,
    top,
    prop,
    bg: null,
    palette,
  };
}
