import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropBook({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      <Rect x={22} y={64} width={20} height={12} fill={palette.prop} />
      <Rect x={22} y={64} width={20} height={2} fill={palette.outline} />
      <Rect x={22} y={74} width={20} height={2} fill={palette.outline} />
      {/* Center spine */}
      <Rect x={31} y={64} width={2} height={12} fill={palette.outline} />
      {/* Page lines */}
      <Rect x={24} y={68} width={6} height={1} fill={palette.outline} />
      <Rect x={24} y={70} width={6} height={1} fill={palette.outline} />
      <Rect x={34} y={68} width={6} height={1} fill={palette.outline} />
      <Rect x={34} y={70} width={6} height={1} fill={palette.outline} />
    </G>
  );
}
