import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function TopVarsity({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Body */}
      <Rect x={14} y={48} width={36} height={24} fill={palette.top} />
      {/* Diagonal stripe (use 4 staircased rects) */}
      <Rect x={14} y={50} width={8} height={4} fill={palette.topShade} />
      <Rect x={20} y={54} width={8} height={4} fill={palette.topShade} />
      <Rect x={26} y={58} width={8} height={4} fill={palette.topShade} />
      <Rect x={32} y={62} width={8} height={4} fill={palette.topShade} />
      <Rect x={38} y={66} width={8} height={4} fill={palette.topShade} />
      {/* Sleeves with rib cuff */}
      <Rect x={10} y={48} width={4} height={18} fill={palette.top} />
      <Rect x={10} y={66} width={4} height={2} fill={palette.topShade} />
      <Rect x={50} y={48} width={4} height={18} fill={palette.top} />
      <Rect x={50} y={66} width={4} height={2} fill={palette.topShade} />
    </G>
  );
}
