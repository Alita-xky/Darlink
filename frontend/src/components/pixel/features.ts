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
