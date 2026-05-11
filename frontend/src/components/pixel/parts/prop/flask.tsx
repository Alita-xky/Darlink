import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropFlask({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Neck */}
      <Rect x={30} y={58} width={4} height={6} fill={palette.outline} />
      <Rect x={31} y={59} width={2} height={4} fill={palette.prop} />
      {/* Shoulders (taper) */}
      <Rect x={28} y={64} width={8} height={2} fill={palette.outline} />
      <Rect x={26} y={66} width={12} height={2} fill={palette.outline} />
      {/* Body (wide bottom) */}
      <Rect x={24} y={68} width={16} height={10} fill={palette.prop} />
      <Rect x={24} y={68} width={16} height={2} fill={palette.outline} />
      <Rect x={24} y={68} width={2} height={10} fill={palette.outline} />
      <Rect x={38} y={68} width={2} height={10} fill={palette.outline} />
      <Rect x={24} y={76} width={16} height={2} fill={palette.outline} />
    </G>
  );
}
