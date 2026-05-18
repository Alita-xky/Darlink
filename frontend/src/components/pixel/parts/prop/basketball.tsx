import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropBasketball({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Ball body (rounded square) */}
      <Rect x={26} y={66} width={12} height={12} fill={palette.prop} />
      <Rect x={28} y={64} width={8} height={2} fill={palette.prop} />
      <Rect x={28} y={78} width={8} height={2} fill={palette.prop} />
      {/* Outline */}
      <Rect x={28} y={64} width={8} height={2} fill={palette.outline} />
      <Rect x={28} y={78} width={8} height={2} fill={palette.outline} />
      <Rect x={26} y={66} width={2} height={12} fill={palette.outline} />
      <Rect x={36} y={66} width={2} height={12} fill={palette.outline} />
      {/* Curve lines */}
      <Rect x={31} y={66} width={2} height={12} fill={palette.outline} />
      <Rect x={28} y={71} width={8} height={2} fill={palette.outline} />
    </G>
  );
}
