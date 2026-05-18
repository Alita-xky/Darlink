import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function HairCurly({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Bumpy clumps on top */}
      <Rect x={20} y={16} width={6} height={8} fill={palette.hair} />
      <Rect x={26} y={14} width={6} height={8} fill={palette.hair} />
      <Rect x={32} y={16} width={6} height={8} fill={palette.hair} />
      <Rect x={38} y={14} width={6} height={8} fill={palette.hair} />
      {/* Front bangs */}
      <Rect x={20} y={22} width={24} height={4} fill={palette.hair} />
      {/* Side curls */}
      <Rect x={18} y={26} width={4} height={8} fill={palette.hair} />
      <Rect x={42} y={26} width={4} height={8} fill={palette.hair} />
      {/* Curl shadows */}
      <Rect x={26} y={14} width={2} height={2} fill={palette.hairShade} />
      <Rect x={38} y={14} width={2} height={2} fill={palette.hairShade} />
    </G>
  );
}
