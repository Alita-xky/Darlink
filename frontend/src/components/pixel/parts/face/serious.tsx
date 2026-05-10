import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function FaceSerious({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Eyes: 2x2 dots */}
      <Rect x={26} y={30} width={2} height={2} fill={palette.outline} />
      <Rect x={36} y={30} width={2} height={2} fill={palette.outline} />
      {/* Flat mouth */}
      <Rect x={28} y={38} width={8} height={2} fill={palette.outline} />
    </G>
  );
}
