import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function BodyMale({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Head: 24x24 at (20,20) */}
      <Rect x={20} y={20} width={24} height={24} fill={palette.skin} />
      {/* Outline */}
      <Rect x={20} y={20} width={24} height={2} fill={palette.outline} />
      <Rect x={20} y={42} width={24} height={2} fill={palette.outline} />
      <Rect x={20} y={20} width={2} height={24} fill={palette.outline} />
      <Rect x={42} y={20} width={2} height={24} fill={palette.outline} />
      {/* Neck */}
      <Rect x={28} y={44} width={8} height={4} fill={palette.skin} />
      {/* Torso (skin base; covered by top) */}
      <Rect x={16} y={48} width={32} height={24} fill={palette.skin} />
      {/* Arms */}
      <Rect x={12} y={48} width={4} height={20} fill={palette.skin} />
      <Rect x={48} y={48} width={4} height={20} fill={palette.skin} />
      {/* Legs */}
      <Rect x={20} y={72} width={10} height={20} fill={palette.skin} />
      <Rect x={34} y={72} width={10} height={20} fill={palette.skin} />
    </G>
  );
}
