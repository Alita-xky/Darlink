import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function TopJersey({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Body */}
      <Rect x={14} y={48} width={36} height={24} fill={palette.top} />
      {/* Horizontal stripe at chest */}
      <Rect x={14} y={56} width={36} height={4} fill={palette.topShade} />
      {/* Number block on chest */}
      <Rect x={28} y={62} width={8} height={6} fill={palette.topShade} />
      {/* Sleeveless armholes */}
      <Rect x={10} y={48} width={4} height={4} fill={palette.skin} />
      <Rect x={50} y={48} width={4} height={4} fill={palette.skin} />
      {/* Tank straps */}
      <Rect x={18} y={48} width={4} height={4} fill={palette.top} />
      <Rect x={42} y={48} width={4} height={4} fill={palette.top} />
    </G>
  );
}
