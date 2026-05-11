import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function FaceWink({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Left eye open: 2x2 dot */}
      <Rect x={26} y={30} width={2} height={2} fill={palette.outline} />
      {/* Right eye closed: horizontal line */}
      <Rect x={34} y={30} width={6} height={2} fill={palette.outline} />
      {/* Smile */}
      <Rect x={26} y={38} width={2} height={2} fill={palette.outline} />
      <Rect x={28} y={40} width={8} height={2} fill={palette.outline} />
      <Rect x={36} y={38} width={2} height={2} fill={palette.outline} />
    </G>
  );
}
