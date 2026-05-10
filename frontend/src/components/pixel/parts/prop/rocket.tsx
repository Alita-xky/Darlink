import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropRocket({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Tip (taper) */}
      <Rect x={30} y={54} width={4} height={2} fill={palette.prop} />
      <Rect x={28} y={56} width={8} height={4} fill={palette.prop} />
      {/* Body */}
      <Rect x={28} y={60} width={8} height={14} fill={palette.prop} />
      <Rect x={28} y={56} width={8} height={2} fill={palette.outline} />
      <Rect x={28} y={72} width={8} height={2} fill={palette.outline} />
      <Rect x={28} y={56} width={2} height={18} fill={palette.outline} />
      <Rect x={34} y={56} width={2} height={18} fill={palette.outline} />
      {/* Window */}
      <Rect x={30} y={62} width={4} height={4} fill={palette.outline} />
      {/* Fins */}
      <Rect x={26} y={70} width={2} height={4} fill={palette.topShade} />
      <Rect x={36} y={70} width={2} height={4} fill={palette.topShade} />
      {/* Flames */}
      <Rect x={30} y={74} width={4} height={4} fill={palette.outline} />
    </G>
  );
}
