import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function FaceSmile({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Eyes: 2x2 dots */}
      <Rect x={26} y={30} width={2} height={2} fill={palette.outline} />
      <Rect x={36} y={30} width={2} height={2} fill={palette.outline} />
      {/* Curved smile (3 rects forming a U) */}
      <Rect x={26} y={38} width={2} height={2} fill={palette.outline} />
      <Rect x={28} y={40} width={8} height={2} fill={palette.outline} />
      <Rect x={36} y={38} width={2} height={2} fill={palette.outline} />
    </G>
  );
}
