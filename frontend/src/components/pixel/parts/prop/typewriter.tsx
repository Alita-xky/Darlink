import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function PropTypewriter({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Body */}
      <Rect x={20} y={66} width={24} height={10} fill={palette.prop} />
      <Rect x={20} y={66} width={24} height={2} fill={palette.outline} />
      <Rect x={20} y={74} width={24} height={2} fill={palette.outline} />
      <Rect x={20} y={66} width={2} height={10} fill={palette.outline} />
      <Rect x={42} y={66} width={2} height={10} fill={palette.outline} />
      {/* Paper rising from top */}
      <Rect x={28} y={60} width={8} height={6} fill={palette.outline} />
      <Rect x={29} y={61} width={6} height={4} fill={palette.bg} />
      {/* Key dots */}
      <Rect x={24} y={70} width={2} height={2} fill={palette.outline} />
      <Rect x={28} y={70} width={2} height={2} fill={palette.outline} />
      <Rect x={32} y={70} width={2} height={2} fill={palette.outline} />
      <Rect x={36} y={70} width={2} height={2} fill={palette.outline} />
    </G>
  );
}
