import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function FaceChill({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Left eye: 2-pixel-wide horizontal line */}
      <Rect x={24} y={30} width={4} height={2} fill={palette.outline} />
      {/* Right eye */}
      <Rect x={36} y={30} width={4} height={2} fill={palette.outline} />
      {/* Tiny smile (3 small rects) */}
      <Rect x={28} y={38} width={2} height={2} fill={palette.outline} />
      <Rect x={30} y={40} width={4} height={2} fill={palette.outline} />
      <Rect x={34} y={38} width={2} height={2} fill={palette.outline} />
    </G>
  );
}
