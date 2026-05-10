import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function TopTee({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      <Rect x={14} y={48} width={36} height={24} fill={palette.top} />
      {/* Sleeves */}
      <Rect x={10} y={48} width={4} height={12} fill={palette.top} />
      <Rect x={50} y={48} width={4} height={12} fill={palette.top} />
    </G>
  );
}
