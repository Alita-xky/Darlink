import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function BgCafe({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      <Rect x={0} y={0} width={64} height={96} fill={palette.bg} />
      {/* Window frame top-left */}
      <Rect x={2} y={2} width={20} height={20} fill={palette.topShade} />
      <Rect x={4} y={4} width={16} height={16} fill={palette.bg} />
      {/* Window cross */}
      <Rect x={11} y={4} width={2} height={16} fill={palette.outline} />
      <Rect x={4} y={11} width={16} height={2} fill={palette.outline} />
      {/* Chalkboard top-right */}
      <Rect x={42} y={4} width={20} height={14} fill={palette.outline} />
      <Rect x={44} y={6} width={2} height={1} fill={palette.bg} />
      <Rect x={48} y={6} width={4} height={1} fill={palette.bg} />
      <Rect x={54} y={6} width={6} height={1} fill={palette.bg} />
      <Rect x={44} y={10} width={6} height={1} fill={palette.bg} />
      <Rect x={52} y={10} width={6} height={1} fill={palette.bg} />
      <Rect x={44} y={14} width={4} height={1} fill={palette.bg} />
      <Rect x={50} y={14} width={4} height={1} fill={palette.bg} />
      {/* Floor line */}
      <Rect x={0} y={86} width={64} height={2} fill={palette.outline} />
    </G>
  );
}
