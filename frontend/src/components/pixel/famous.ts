import type { PixelFeatures } from './features';

export const FAMOUS_PRESETS: Record<string, { features: PixelFeatures; label: string }> = {
  musk:      { features: { body: 'male',    hair: 'short',   face: 'serious', top: 'tee',        prop: 'rocket',     bg: 'studio',  palette: 'cool'   }, label: '马斯克' },
  jobs:      { features: { body: 'male',    hair: 'bald',    face: 'serious', top: 'turtleneck', prop: 'iphone',     bg: 'studio',  palette: 'mono'   }, label: '乔布斯' },
  jordan:    { features: { body: 'male',    hair: 'buzz',    face: 'serious', top: 'jersey',     prop: 'basketball', bg: 'street',  palette: 'warm'   }, label: '乔丹' },
  hemingway: { features: { body: 'male',    hair: 'short',   face: 'serious', top: 'shirt',      prop: 'typewriter', bg: 'cafe',    palette: 'warm'   }, label: '海明威' },
  curie:     { features: { body: 'female',  hair: 'bun',     face: 'serious', top: 'dress',      prop: 'flask',      bg: 'library', palette: 'cool'   }, label: '居里夫人' },
  wxl:       { features: { body: 'female',  hair: 'wave',    face: 'smile',   top: 'dress',      prop: 'mic',        bg: 'studio',  palette: 'pastel' }, label: '王心凌' },
};
