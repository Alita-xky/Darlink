import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropCoffee({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Cup body */}
      <Rect x={26} y={64} width={10} height={14} fill={palette.prop} />
      <Rect x={26} y={64} width={10} height={2} fill={palette.outline} />
      <Rect x={26} y={76} width={10} height={2} fill={palette.outline} />
      <Rect x={26} y={64} width={2} height={14} fill={palette.outline} />
      <Rect x={34} y={64} width={2} height={14} fill={palette.outline} />
      {/* Handle */}
      <Rect x={36} y={68} width={4} height={2} fill={palette.outline} />
      <Rect x={38} y={68} width={2} height={6} fill={palette.outline} />
      <Rect x={36} y={72} width={4} height={2} fill={palette.outline} />
      {/* Steam */}
      <Rect x={28} y={60} width={2} height={2} fill={palette.outline} />
      <Rect x={32} y={58} width={2} height={2} fill={palette.outline} />
    </G>
  );
}
