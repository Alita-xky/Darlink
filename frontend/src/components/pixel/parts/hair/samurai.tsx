import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function HairSamurai({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Top knot */}
      <Rect x={28} y={10} width={8} height={4} fill={palette.hair} />
      <Rect x={30} y={8} width={4} height={2} fill={palette.hair} />
      <Rect x={28} y={14} width={8} height={2} fill={palette.hairShade} />
      {/* Front bangs */}
      <Rect x={20} y={18} width={24} height={4} fill={palette.hair} />
      {/* Side strips down */}
      <Rect x={18} y={22} width={2} height={10} fill={palette.hair} />
      <Rect x={44} y={22} width={2} height={10} fill={palette.hair} />
      {/* Back tail */}
      <Rect x={20} y={42} width={4} height={8} fill={palette.hair} />
    </G>
  );
}
