import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function HairBuzz({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Tight band across top */}
      <Rect x={20} y={20} width={24} height={2} fill={palette.hair} />
      {/* Sides — very thin */}
      <Rect x={20} y={22} width={2} height={2} fill={palette.hair} />
      <Rect x={42} y={22} width={2} height={2} fill={palette.hair} />
    </G>
  );
}
