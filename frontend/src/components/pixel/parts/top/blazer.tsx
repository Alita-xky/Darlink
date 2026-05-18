import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function TopBlazer({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Body */}
      <Rect x={14} y={48} width={36} height={24} fill={palette.top} />
      {/* Lapels (narrowing toward bottom) */}
      <Rect x={20} y={48} width={6} height={2} fill={palette.topShade} />
      <Rect x={22} y={50} width={4} height={2} fill={palette.topShade} />
      <Rect x={24} y={52} width={2} height={2} fill={palette.topShade} />
      <Rect x={38} y={48} width={6} height={2} fill={palette.topShade} />
      <Rect x={38} y={50} width={4} height={2} fill={palette.topShade} />
      <Rect x={38} y={52} width={2} height={2} fill={palette.topShade} />
      {/* Single button */}
      <Rect x={31} y={58} width={2} height={2} fill={palette.topShade} />
      {/* Sleeves */}
      <Rect x={10} y={48} width={4} height={20} fill={palette.top} />
      <Rect x={50} y={48} width={4} height={20} fill={palette.top} />
    </G>
  );
}
