import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function TopTurtleneck({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Tall neck (covers neck up to head bottom) */}
      <Rect x={26} y={42} width={12} height={6} fill={palette.top} />
      <Rect x={26} y={42} width={12} height={2} fill={palette.topShade} />
      {/* Body */}
      <Rect x={14} y={48} width={36} height={24} fill={palette.top} />
      {/* Sleeves */}
      <Rect x={10} y={48} width={4} height={20} fill={palette.top} />
      <Rect x={50} y={48} width={4} height={20} fill={palette.top} />
    </G>
  );
}
