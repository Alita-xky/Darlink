import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function HairShort({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Cap on top of head (x 20-44, y 18-26) */}
      <Rect x={20} y={18} width={24} height={8} fill={palette.hair} />
      {/* Forehead bangs slight peek */}
      <Rect x={22} y={26} width={2} height={2} fill={palette.hair} />
      <Rect x={40} y={26} width={2} height={2} fill={palette.hair} />
      {/* Sides at ear level */}
      <Rect x={18} y={26} width={2} height={6} fill={palette.hair} />
      <Rect x={44} y={26} width={2} height={6} fill={palette.hair} />
    </G>
  );
}
