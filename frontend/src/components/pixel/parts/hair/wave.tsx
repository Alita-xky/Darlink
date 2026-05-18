import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function HairWave({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Top cap */}
      <Rect x={20} y={18} width={24} height={6} fill={palette.hair} />
      {/* Wavy strand front-left going down */}
      <Rect x={18} y={24} width={4} height={6} fill={palette.hair} />
      <Rect x={20} y={30} width={4} height={4} fill={palette.hair} />
      <Rect x={22} y={34} width={4} height={4} fill={palette.hair} />
      {/* Right side flowing */}
      <Rect x={42} y={24} width={4} height={10} fill={palette.hair} />
      <Rect x={40} y={34} width={4} height={6} fill={palette.hair} />
      {/* Subtle shadows */}
      <Rect x={20} y={24} width={2} height={2} fill={palette.hairShade} />
      <Rect x={42} y={24} width={2} height={2} fill={palette.hairShade} />
    </G>
  );
}
