import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function TopDress({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Body */}
      <Rect x={14} y={48} width={36} height={24} fill={palette.top} />
      {/* Skirt extends to legs (covers up to y 88) */}
      <Rect x={12} y={72} width={40} height={16} fill={palette.top} />
      {/* Skirt hem (slight flare) */}
      <Rect x={10} y={84} width={44} height={4} fill={palette.topShade} />
      {/* Sleeves */}
      <Rect x={10} y={48} width={4} height={12} fill={palette.top} />
      <Rect x={50} y={48} width={4} height={12} fill={palette.top} />
      {/* Waist sash */}
      <Rect x={14} y={64} width={36} height={2} fill={palette.topShade} />
    </G>
  );
}
