import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function BodyFemale({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Head — same as male */}
      <Rect x={20} y={20} width={24} height={24} fill={palette.skin} />
      <Rect x={20} y={20} width={24} height={2} fill={palette.outline} />
      <Rect x={20} y={42} width={24} height={2} fill={palette.outline} />
      <Rect x={20} y={20} width={2} height={24} fill={palette.outline} />
      <Rect x={42} y={20} width={2} height={24} fill={palette.outline} />
      {/* Neck */}
      <Rect x={28} y={44} width={8} height={4} fill={palette.skin} />
      {/* Torso narrower than male (28 wide instead of 32) */}
      <Rect x={18} y={48} width={28} height={24} fill={palette.skin} />
      {/* Arms */}
      <Rect x={14} y={48} width={4} height={20} fill={palette.skin} />
      <Rect x={46} y={48} width={4} height={20} fill={palette.skin} />
      {/* Legs */}
      <Rect x={22} y={72} width={8} height={20} fill={palette.skin} />
      <Rect x={34} y={72} width={8} height={20} fill={palette.skin} />
    </G>
  );
}
