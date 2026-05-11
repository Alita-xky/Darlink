import React from 'react';
import { G, Rect } from 'react-native-svg';
import type { PaletteColors } from '../../palette';

export default function BgStreet({ palette }: { palette: PaletteColors }) {
  return (
    <G>
      {/* Sky bg */}
      <Rect x={0} y={0} width={64} height={96} fill={palette.bg} />
      {/* Building silhouettes top */}
      <Rect x={0} y={0} width={12} height={20} fill={palette.topShade} />
      <Rect x={20} y={0} width={8} height={14} fill={palette.outline} />
      <Rect x={36} y={0} width={14} height={24} fill={palette.topShade} />
      <Rect x={56} y={0} width={8} height={18} fill={palette.outline} />
      {/* Building windows */}
      <Rect x={2} y={6} width={2} height={2} fill={palette.bg} />
      <Rect x={6} y={6} width={2} height={2} fill={palette.bg} />
      <Rect x={2} y={12} width={2} height={2} fill={palette.bg} />
      <Rect x={38} y={6} width={2} height={2} fill={palette.bg} />
      <Rect x={42} y={6} width={2} height={2} fill={palette.bg} />
      <Rect x={46} y={6} width={2} height={2} fill={palette.bg} />
      <Rect x={38} y={12} width={2} height={2} fill={palette.bg} />
      <Rect x={42} y={12} width={2} height={2} fill={palette.bg} />
      {/* Sidewalk + road */}
      <Rect x={0} y={84} width={64} height={4} fill={palette.topShade} />
      <Rect x={0} y={88} width={64} height={8} fill={palette.outline} />
      {/* Lane stripes */}
      <Rect x={8} y={92} width={6} height={1} fill={palette.bg} />
      <Rect x={20} y={92} width={6} height={1} fill={palette.bg} />
      <Rect x={32} y={92} width={6} height={1} fill={palette.bg} />
      <Rect x={44} y={92} width={6} height={1} fill={palette.bg} />
      <Rect x={56} y={92} width={6} height={1} fill={palette.bg} />
    </G>
  );
}
