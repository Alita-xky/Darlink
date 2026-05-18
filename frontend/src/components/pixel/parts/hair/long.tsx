import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function HairLong({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Top cap */}
      <Rect x={20} y={18} width={24} height={8} fill={palette.hair} />
      {/* Long left side (past chin to torso) */}
      <Rect x={18} y={26} width={4} height={28} fill={palette.hair} />
      {/* Long right side */}
      <Rect x={42} y={26} width={4} height={28} fill={palette.hair} />
      {/* Hint of shadow on sides */}
      <Rect x={18} y={48} width={2} height={6} fill={palette.hairShade} />
      <Rect x={44} y={48} width={2} height={6} fill={palette.hairShade} />
    </G>
  );
}
