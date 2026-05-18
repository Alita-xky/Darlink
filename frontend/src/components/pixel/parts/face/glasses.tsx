import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function FaceGlasses({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Left glasses frame: 4x4 rect with hole inside */}
      <Rect x={24} y={28} width={6} height={6} fill={palette.outline} />
      <Rect x={25} y={29} width={4} height={4} fill={palette.skin} />
      {/* Pupil dot */}
      <Rect x={26} y={30} width={2} height={2} fill={palette.outline} />
      {/* Right glasses frame */}
      <Rect x={34} y={28} width={6} height={6} fill={palette.outline} />
      <Rect x={35} y={29} width={4} height={4} fill={palette.skin} />
      <Rect x={36} y={30} width={2} height={2} fill={palette.outline} />
      {/* Bridge between frames */}
      <Rect x={30} y={30} width={4} height={1} fill={palette.outline} />
      {/* Neutral mouth */}
      <Rect x={28} y={38} width={8} height={2} fill={palette.outline} />
    </G>
  );
}
