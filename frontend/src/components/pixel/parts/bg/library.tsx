import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function BgLibrary({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      <Rect x={0} y={0} width={64} height={96} fill={palette.bg} />
      {/* Bookshelf: vertical book bands */}
      <Rect x={2} y={4} width={4} height={20} fill={palette.outline} />
      <Rect x={8} y={4} width={4} height={20} fill={palette.topShade} />
      <Rect x={56} y={4} width={4} height={20} fill={palette.outline} />
      <Rect x={50} y={4} width={4} height={20} fill={palette.topShade} />
      {/* Lower shelf */}
      <Rect x={2} y={72} width={4} height={20} fill={palette.topShade} />
      <Rect x={8} y={72} width={4} height={20} fill={palette.outline} />
      <Rect x={56} y={72} width={4} height={20} fill={palette.topShade} />
      <Rect x={50} y={72} width={4} height={20} fill={palette.outline} />
      {/* Shelf horizontal lines */}
      <Rect x={0} y={28} width={64} height={2} fill={palette.outline} />
      <Rect x={0} y={68} width={64} height={2} fill={palette.outline} />
    </G>
  );
}
