import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function BgStudio({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      <Rect x={0} y={0} width={64} height={96} fill={palette.bg} />
      {/* Spotlight from top: lighter gradient (use one rect for bright zone) */}
      <Rect x={20} y={2} width={24} height={2} fill={palette.outline} />
      <Rect x={26} y={0} width={12} height={2} fill={palette.outline} />
      {/* Backdrop seam */}
      <Rect x={0} y={66} width={64} height={2} fill={palette.topShade} />
    </G>
  );
}
