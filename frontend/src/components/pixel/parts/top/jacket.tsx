import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function TopJacket({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Body */}
      <Rect x={14} y={48} width={36} height={24} fill={palette.top} />
      {/* Zipper down center */}
      <Rect x={31} y={48} width={2} height={24} fill={palette.topShade} />
      {/* Collar */}
      <Rect x={26} y={48} width={12} height={2} fill={palette.topShade} />
      {/* Sleeves with cuff */}
      <Rect x={10} y={48} width={4} height={18} fill={palette.top} />
      <Rect x={10} y={66} width={4} height={2} fill={palette.topShade} />
      <Rect x={50} y={48} width={4} height={18} fill={palette.top} />
      <Rect x={50} y={66} width={4} height={2} fill={palette.topShade} />
    </G>
  );
}
