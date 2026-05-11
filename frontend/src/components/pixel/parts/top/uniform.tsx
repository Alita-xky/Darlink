import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function TopUniform({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Body */}
      <Rect x={14} y={48} width={36} height={24} fill={palette.top} />
      {/* Collar */}
      <Rect x={26} y={48} width={12} height={2} fill={palette.topShade} />
      <Rect x={28} y={50} width={2} height={4} fill={palette.topShade} />
      <Rect x={34} y={50} width={2} height={4} fill={palette.topShade} />
      {/* Tie */}
      <Rect x={30} y={50} width={4} height={20} fill={palette.topShade} />
      {/* Two buttons (one on each side of tie) */}
      <Rect x={26} y={56} width={2} height={2} fill={palette.topShade} />
      <Rect x={36} y={56} width={2} height={2} fill={palette.topShade} />
      {/* Sleeves */}
      <Rect x={10} y={48} width={4} height={18} fill={palette.top} />
      <Rect x={50} y={48} width={4} height={18} fill={palette.top} />
    </G>
  );
}
