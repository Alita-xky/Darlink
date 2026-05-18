import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function HairBun({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Bun (4x4 bump) */}
      <Rect x={28} y={12} width={8} height={6} fill={palette.hair} />
      <Rect x={30} y={10} width={4} height={2} fill={palette.hair} />
      {/* Cap on head */}
      <Rect x={20} y={18} width={24} height={4} fill={palette.hair} />
      {/* Side hair */}
      <Rect x={18} y={22} width={2} height={8} fill={palette.hair} />
      <Rect x={44} y={22} width={2} height={8} fill={palette.hair} />
      {/* Bun shadow */}
      <Rect x={28} y={16} width={8} height={2} fill={palette.hairShade} />
    </G>
  );
}
