import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function BgDorm({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      <Rect x={0} y={0} width={64} height={96} fill={palette.bg} />
      {/* Repeating dots wallpaper (top half) */}
      <Rect x={6} y={6} width={2} height={2} fill={palette.topShade} />
      <Rect x={18} y={6} width={2} height={2} fill={palette.topShade} />
      <Rect x={30} y={6} width={2} height={2} fill={palette.topShade} />
      <Rect x={42} y={6} width={2} height={2} fill={palette.topShade} />
      <Rect x={54} y={6} width={2} height={2} fill={palette.topShade} />
      <Rect x={12} y={14} width={2} height={2} fill={palette.topShade} />
      <Rect x={24} y={14} width={2} height={2} fill={palette.topShade} />
      <Rect x={36} y={14} width={2} height={2} fill={palette.topShade} />
      <Rect x={48} y={14} width={2} height={2} fill={palette.topShade} />
      <Rect x={6} y={22} width={2} height={2} fill={palette.topShade} />
      <Rect x={30} y={22} width={2} height={2} fill={palette.topShade} />
      <Rect x={54} y={22} width={2} height={2} fill={palette.topShade} />
      {/* Bed (bottom) */}
      <Rect x={0} y={84} width={64} height={12} fill={palette.outline} />
      <Rect x={0} y={84} width={64} height={2} fill={palette.topShade} />
    </G>
  );
}
