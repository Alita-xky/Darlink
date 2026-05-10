import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropGuitar({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Body (rounded shape simulated as oval with rects) */}
      <Rect x={22} y={66} width={16} height={14} fill={palette.prop} />
      <Rect x={20} y={68} width={20} height={10} fill={palette.prop} />
      <Rect x={20} y={68} width={20} height={2} fill={palette.outline} />
      <Rect x={20} y={76} width={20} height={2} fill={palette.outline} />
      <Rect x={22} y={66} width={2} height={14} fill={palette.outline} />
      <Rect x={36} y={66} width={2} height={14} fill={palette.outline} />
      {/* Sound hole */}
      <Rect x={28} y={71} width={4} height={4} fill={palette.outline} />
      {/* Neck (vertical strip going up) */}
      <Rect x={30} y={56} width={2} height={10} fill={palette.outline} />
      {/* Headstock */}
      <Rect x={28} y={54} width={6} height={4} fill={palette.outline} />
    </G>
  );
}
